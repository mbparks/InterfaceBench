import { worldCommands, commands, flatten, bbox, inside, edgeDistance, boxesOverlap, polygonsOverlap, panelShape, openingShapes, objectBounds, textShape } from './geometry.js';
export function runChecks(project) {
  const findings = [];
  const emit = (key, severity, confidence, title, explanation, action, ids = [], panel = null) => findings.push({
    key,
    severity,
    confidence,
    title,
    explanation,
    action,
    ids,
    panel,
    acknowledgment: project.acknowledgments[key] || ''
  });
  for (const b of project.panels) {
    const outline = flatten(commands(panelShape(b)), .3);
    const holes = [];
    const bodies = [];
    for (const c of b.components) {
      const d = c.definition;
      if (!d.verified) emit('verify-' + c.id, 'warning', 'unknown', `${c.ref}: unverified dimensions`, d.provenance?.status==='manufacturer-sourced'?'Selected dimensions have manufacturer sources; rear/access clearances include planning assumptions and no physical measurement is recorded.':'This embedded part definition is illustrative or lacks a measurement record.', 'Measure the actual part, record evidence and confirm the definition.', [c.id], b.id);
      if (b.thickness < d.minThickness || b.thickness > d.maxThickness) emit('thickness-' + c.id, 'error', 'high', `${c.ref}: mounting thickness conflict`, `${b.thickness} mm panel; declared range ${d.minThickness}–${d.maxThickness} mm.`, 'Change the panel thickness, part or mounting design.', [c.id], b.id);
      if (d.depth + d.bend > b.depth) emit('depth-' + c.id, 'error', 'high', `${c.ref}: insufficient rear depth`, `${d.depth + d.bend} mm including cable clearance; ${b.depth} mm available.`, 'Increase rear depth or change the component.', [c.id], b.id);
      for (const [i, s] of openingShapes(c).entries()) {
        const cs = worldCommands(s, c),
          poly = flatten(cs, .3),
          box = bbox(cs);
        holes.push({
          c,
          i,
          s,
          cs,
          poly,
          box
        });
        if (poly.some(p => !inside(p, outline) && edgeDistance(p, outline) > .02)) emit(`boundary-${c.id}-${i}`, 'error', 'medium', `${c.ref}: opening beyond panel`, 'Opening boundary lies outside the panel. Curves are sampled; verify critical clearances on actual parts.', 'Move the component or enlarge the panel.', [c.id], b.id);else if (Math.min(...poly.map(p => edgeDistance(p, outline))) < b.edge) emit(`edge-${c.id}-${i}`, 'warning', 'medium', `${c.ref}: edge spacing below ${b.edge} mm`, 'Sampled contour distance is below the specified minimum.', 'Increase edge spacing or document a justified allowance.', [c.id], b.id);
      }
      bodies.push({
        c,
        box: bbox(worldCommands(d.rear, c)),
        access: bbox(worldCommands(d.access, c))
      });
    }
    for (let i = 0; i < holes.length; i++) for (let j = i + 1; j < holes.length; j++) {
      const a = holes[i],
        d = holes[j];
      if (boxesOverlap(a.box, d.box) && (polygonsOverlap(a.poly, d.poly) || JSON.stringify(a.cs) === JSON.stringify(d.cs))) emit(`cuts-${a.c.id}-${a.i}-${d.c.id}-${d.i}`, 'error', 'medium', `Overlapping openings: ${a.c.ref} / ${d.c.ref}`, 'Closed cut regions overlap or duplicate. Sampled curves; not a boolean union.', 'Separate the openings or define one intentional combined opening.', [a.c.id, d.c.id], b.id);
    }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i],
        d = bodies[j];
      if (boxesOverlap(a.box, d.box)) emit(`rear-${a.c.id}-${d.c.id}`, 'warning', 'medium', `Rear interference: ${a.c.ref} / ${d.c.ref}`, 'Conservative rotated bounding boxes overlap. Rear bodies start at the panel back; depth intervals overlap.', 'Inspect actual 3D geometry or increase spacing.', [a.c.id, d.c.id], b.id);
      if (boxesOverlap(a.access, d.access)) emit(`access-${a.c.id}-${d.c.id}`, 'warning', 'low', `Access envelopes: ${a.c.ref} / ${d.c.ref}`, 'Conservative 2D bounding boxes overlap; fingers, tools or connectors may compete for space.', 'Review physical access and record any accepted overlap.', [a.c.id, d.c.id], b.id);
    }
    for (const a of b.artwork.filter(a => ['uv', 'engrave', 'overlay'].includes(a.layer))) {
      try {
        const bounds = objectBounds(a, project);
        for (const h of holes) if (boxesOverlap(bounds, h.box)) emit(`art-${a.id}-${h.c.id}`, 'info', 'low', 'Artwork may meet an opening', 'Conservative bounding boxes intersect. Tick scales surrounding knobs can trigger this check.', 'Inspect intended artwork placement; acknowledge intentional surrounds.', [a.id, h.c.id], b.id);
      } catch (e) {
        emit(`art-invalid-${a.id}`, 'error', 'high', 'Artwork cannot be exported', e.message, 'Change unsupported text or geometry.', [a.id], b.id);
      }
    }
    for (const c of b.components) if (c.label) {
      try {
        textShape(c.label, 0, 0, c.labelSize);
      } catch (e) {
        emit('label-invalid-' + c.id, 'error', 'high', `${c.ref}: label cannot be exported`, e.message, 'Change unsupported characters in the label.', [c.id], b.id);
      }
    }
  }
  const comps = new Map(project.panels.flatMap(b => b.components.map(c => [c.id, {
      c,
      panel: b.id
    }]))),
    pins = new Map(project.controller.pins.map(p => [p.id, p])),
    used = new Map();
  for (const {
    c,
    panel
  } of comps.values()) for (const t of c.definition.terminals) {
    const conn = project.connections.find(n => n.component === c.id && n.terminal === t.id);
    if (t.required && (!conn || !conn.pin)) emit(`missing-${c.id}-${t.id}`, 'warning', 'high', `${c.ref}.${t.name}: unassigned`, 'Required terminal has no controller assignment. Physical panel export remains available.', 'Assign a pin or document an external connection and make the terminal optional.', [c.id], panel);
  }
  for (const n of project.connections) {
    const item = comps.get(n.component);
    if (!item) continue;
    const {
      c,
      panel
    } = item;
    const t = c.definition.terminals.find(t => t.id === n.terminal),
      pin = pins.get(n.pin);
    if (!n.pin) continue;
    if (!pin) {
      emit('pin-missing-' + n.id, 'error', 'high', `${c.ref}: unknown pin ${n.pin}`, 'The assigned controller pin no longer exists.', 'Choose an existing pin.', [c.id], panel);
      continue;
    }
    if (t.role === 'passive') emit('unknown-' + n.id, 'info', 'unknown', `${c.ref}.${t.name}: compatibility unchecked`, 'A passive terminal has no declared electrical function.', 'Declare its role and voltage before evaluating compatibility.', [c.id], panel);else if (!pin.caps.includes(t.role)) emit('cap-' + n.id, 'error', 'high', `${c.ref}.${t.name}: capability mismatch`, `${pin.id} does not declare ${t.role}.`, 'Choose a compatible pin or explicit interface circuit.', [c.id], panel);
    if (t.role !== 'ground' && t.role !== 'passive' && t.voltage !== pin.voltage) {
      emit('voltage-' + n.id, n.driver ? 'warning' : 'error', n.driver ? 'unknown' : 'high', `${c.ref}.${t.name}: voltage domain mismatch`, `${t.voltage} V terminal → ${pin.voltage} V pin.${n.driver ? ' Declared interface: ' + n.driver + '; circuit not validated.' : ''}`, 'Use a verified level interface or compatible voltage domain.', [c.id], panel);
    }
    if (!used.has(n.pin)) used.set(n.pin, []);
    used.get(n.pin).push({
      n,
      t,
      c,
      panel
    });
  }
  for (const [pin, uses] of used) {
    if (uses.length < 2) continue;
    const first = uses[0];
    const commonPower = uses.every(u => u.t.role === first.t.role && ['power', 'ground'].includes(u.t.role));
    const bus = uses.every(u => u.t.role === first.t.role && ['SDA', 'SCL', 'SCK', 'MOSI', 'MISO'].includes(u.t.role) && u.n.bus && u.n.bus === first.n.bus);
    if (!commonPower && !bus) emit('pin-conflict-' + pin, 'error', 'high', `${pin}: exclusive assignment conflict`, `${uses.map(u => u.c.ref + '.' + u.t.name).join(', ')} share a pin without a compatible shared-bus declaration.`, 'Use separate pins or explicitly declare a supported shared bus.', uses.map(u => u.c.id));
  }
  return findings.sort((a, b) => ({
    error: 0,
    warning: 1,
    info: 2
  })[a.severity] - {
    error: 0,
    warning: 1,
    info: 2
  }[b.severity]);
}
