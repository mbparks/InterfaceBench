/* INTERFACEBENCH • GPL-3.0-only. Canonical dimensions are millimetres. */
export const VERSION = '1.4.3-rc.1';
export const SCHEMA = 3;
export const clone = v => structuredClone(v);
// Legacy files keep front fabrication labels; rear fabrication is an explicit choice.
export const labelSides = o => ({front:o.labelSides?.front!==false,rear:o.labelSides?.rear===true});
export const labelVisible = (panel,component,side='front') => labelSides(component)[side];
export const uid = () => globalThis.crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
export const layers = ['outline', 'cut', 'engrave', 'uv', 'overlay', 'registration', 'reference'];
export const layerNames = {
  outline: 'Panel outline',
  cut: 'Cutouts & drilling',
  engrave: 'Engraving',
  uv: 'UV-print artwork',
  overlay: 'Adhesive overlay',
  registration: 'Registration',
  reference: 'Reference geometry'
};
export const roles = ['digitalIn', 'digitalOut', 'analogIn', 'pwm', 'SDA', 'SCL', 'MOSI', 'MISO', 'SCK', 'CS', 'TX', 'RX', 'power', 'ground', 'passive'];
export const circ = (d, x = 0, y = 0) => ({
  type: 'circle',
  x,
  y,
  d
});
export const rect = (w, h, x = 0, y = 0, r = 0) => ({
  type: 'rect',
  x,
  y,
  w,
  h,
  r
});
const term = (name, role, voltage = 5) => ({
  id: name,
  name,
  role,
  voltage,
  required: true
});
function def(id, name, kind, front, opening, rear, access, depth, terminals, prefix, color) {
  return {
    id,
    name,
    kind,
    front,
    openings: Array.isArray(opening) ? opening : [opening],
    rear,
    access,
    depth,
    bend: 0,
    minThickness: 0,
    maxThickness: 8,
    mountReference: 'Opening centre',
    terminals,
    prefix,
    color,
    verified: false,
    source: 'Illustrative generic part — measure your actual hardware',
    verifiedDate: '',
    notes: 'Nominal dimensions are illustrative; not manufacturer specifications.'
  };
}
export const starterParts = [def('button', 'Momentary button', 'button', circ(18), circ(12), circ(16), circ(27), 24, [term('SIG', 'digitalIn'), term('GND', 'ground')], 'SW', '#79ac8c'), def('stop', 'Stop button', 'button', circ(24), circ(16), circ(22), circ(34), 28, [term('SIG', 'digitalIn'), term('GND', 'ground')], 'SW', '#d36c57'), def('toggle', 'Toggle switch', 'toggle', circ(13), circ(6), rect(12, 20), circ(25), 22, [term('SIG', 'digitalIn'), term('GND', 'ground')], 'SW', '#c8ced0'), def('encoder', 'Rotary encoder', 'encoder', circ(22), circ(7), rect(16, 16), circ(30), 19, [term('A', 'digitalIn'), term('B', 'digitalIn'), term('GND', 'ground')], 'ENC', '#d5d8d3'), def('pot', 'Potentiometer', 'pot', circ(27), circ(7), circ(21), circ(34), 22, [term('WIPER', 'analogIn'), term('VCC', 'power'), term('GND', 'ground')], 'RV', '#d8ddcb'), def('led', 'Panel indicator', 'led', circ(9), circ(8), circ(8), circ(14), 15, [term('ANODE', 'digitalOut'), term('GND', 'ground')], 'LED', '#c2ee84'), def('display', 'I²C display', 'display', rect(51, 24, 0, 0, 2), rect(46, 18), rect(59, 29), rect(65, 35), 17, [term('SDA', 'SDA'), term('SCL', 'SCL'), term('VCC', 'power'), term('GND', 'ground')], 'DS', '#24342d'), def('connector', 'Panel connector', 'connector', circ(20), circ(16), circ(19), circ(30), 27, [term('P1', 'passive', 0), term('P2', 'passive', 0), term('P3', 'passive', 0)], 'J', '#777d77'), def('usb', 'Rectangular connector', 'connector', rect(18, 11, 0, 0, 2), rect(13, 7, 0, 0, 1), rect(20, 17), rect(24, 21), 30, [term('P1', 'passive', 0), term('P2', 'passive', 0)], 'J', '#9baba2'), def('mount', 'Mounting hole', 'mount', circ(7), circ(3.2), circ(7), circ(10), 6, [], 'H', '#adb1a7')];
export function uno() {
  return {
    name: 'Arduino UNO R3',
    source: 'https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf',
    verifiedDate: '2026-10-08',
    pins: [...Array.from({
      length: 14
    }, (_, i) => ({
      id: `D${i}`,
      code: String(i),
      voltage: 5,
      caps: ['digitalIn', 'digitalOut', ...([3, 5, 6, 9, 10, 11].includes(i) ? ['pwm'] : []), ...(i === 0 ? ['RX'] : i === 1 ? ['TX'] : i === 10 ? ['CS'] : i === 11 ? ['MOSI'] : i === 12 ? ['MISO'] : i === 13 ? ['SCK'] : [])]
    })), ...Array.from({
      length: 6
    }, (_, i) => ({
      id: `A${i}`,
      code: `A${i}`,
      voltage: 5,
      caps: ['analogIn', 'digitalIn', 'digitalOut', ...(i === 4 ? ['SDA'] : i === 5 ? ['SCL'] : [])]
    })), {
      id: '5V',
      code: '',
      voltage: 5,
      caps: ['power']
    }, {
      id: '3V3',
      code: '',
      voltage: 3.3,
      caps: ['power']
    }, {
      id: 'GND',
      code: '',
      voltage: 0,
      caps: ['ground']
    }]
  };
}
export function newPanel(name = 'Main panel') {
  return {
    id: uid(),
    name,
    w: 240,
    h: 150,
    shape: 'rounded',
    radius: 5,
    thickness: 6,
    material: 'Birch plywood',
    process: 'Laser cut + UV print',
    depth: 45,
    edge: 3,
    origin: 'top-left',
    color: '#b49365',
    outline: [],
    components: [],
    artwork: [],
    layers: Object.fromEntries(layers.map(l => [l, {
      visible: true,
      locked: false,
      export: l !== 'reference'
    }]))
  };
}
export function newProject(name = 'Untitled contraption') {
  return {
    app: 'INTERFACEBENCH',
    schema: SCHEMA,
    id: uid(),
    name,
    revision: 'A',
    panels: [newPanel()],
    controller: uno(),
    connections: [],
    variables: {
      run: 0,
      speed: 50
    },
    rules: [],
    assumptions: [],
    evidence: [],
    baselines: [],
    acknowledgments: {},
    assets: {},
    modified: new Date().toISOString()
  };
}
export function instantiateDefinition(project,definition) {
  const d=clone(definition);
  if(d.photoAsset){const key='part-photo-'+uid();project.assets??={};project.assets[key]=clone(d.photoAsset);d.photo=key;delete d.photoAsset;}
  if(d.photo&&!project.assets?.[d.photo])delete d.photo;
  return d;
}
export function addComponent(project, panel, definition, x = 40, y = 40) {
  const n = project.panels.flatMap(p => p.components).filter(c => c.ref.startsWith(definition.prefix)).length + 1;
  let ref = definition.prefix + n;
  while (project.panels.some(p => p.components.some(c => c.ref === ref))) ref = definition.prefix + (Number(ref.slice(definition.prefix.length)) + 1);
  const c = {
    id: uid(),
    ref,
    label: definition.name,
    labelSides: {front:true,rear:false},
    definition: clone(definition),
    x,
    y,
    rotation: 0,
    locked: false,
    group: null,
    labelX: 0,
    labelY: (definition.front.d || definition.front.h) / 2 + 7,
    labelSize: 3,
    layer: 'engrave',
    color: definition.color,
    value: definition.kind === 'pot' ? 50 : 0,
    display: 'READY',
    notes: ''
  };
  c.definition = instantiateDefinition(project,c.definition);
  panel.components.push(c);
  return c;
}
export function example(diagnostic = false) {
  const p = newProject(diagnostic ? 'Kinetic sculpture · diagnostic' : 'Kinetic sculpture');
  const b = p.panels[0];
  b.name = 'Operator panel';
  b.w = 280;
  b.h = 180;
  b.depth = 65;
  b.thickness = 4;
  const create = (key, x, y, label) => {
    const c = addComponent(p, b, starterParts.find(d => d.id === key), x, y);
    c.label = label;
    return c;
  };
  const display = create('display', 193, 49, 'MOTION / STATUS');
  const run = create('button', 54, 111, 'RUN');
  const stop = create('stop', 104, 111, 'STOP');
  const speed = create('pot', 177, 112, 'SPEED');
  const arm = create('toggle', 54, 52, 'ARM');
  const led = create('led', 241, 112, 'ACTIVE');
  const j = create('connector', 237, 49, 'MOTOR');
  for (const [x, y] of [[9, 9], [271, 9], [9, 171], [271, 171]]) create('mount', x, y, '');
  b.artwork = [{
    id: uid(),
    type: 'text',
    text: 'KINETIC / 01',
    x: 20,
    y: 25,
    size: 6,
    color: '#283930',
    layer: 'uv',
    rotation: 0
  }, {
    id: uid(),
    type: 'text',
    text: 'A SMALL MACHINE FOR UNEXPECTED MOVEMENT',
    x: 20,
    y: 158,
    size: 2.6,
    color: '#394336',
    layer: 'uv',
    rotation: 0
  }, {
    id: uid(),
    type: 'line',
    x: 20,
    y: 76,
    w: 240,
    h: 0,
    stroke: 0.35,
    color: '#4c5942',
    layer: 'uv',
    rotation: 0
  }, {
    id: uid(),
    type: 'border',
    x: 193,
    y: 49,
    w: 65,
    h: 35,
    r: 2,
    stroke: 0.5,
    color: '#5b6559',
    layer: 'reference',
    rotation: 0
  }, {
    id: uid(),
    type: 'rotary',
    x: 177,
    y: 112,
    r: 21,
    count: 11,
    start: -135,
    end: 135,
    stroke: 0.4,
    color: '#2d4131',
    layer: 'engrave',
    rotation: 0
  }];
  const cn = (c, t, pin, notes = '') => p.connections.push({
    id: uid(),
    component: c.id,
    terminal: t,
    pin,
    signal: `${c.ref}_${t}`,
    bus: ['SDA', 'SCL'].includes(t) ? `I2C_${t}` : '',
    pullup: ['SIG', 'A', 'B'].includes(t),
    activeLow: true,
    driver: '',
    notes
  });
  cn(run, 'SIG', 'D2');
  cn(run, 'GND', 'GND');
  cn(stop, 'SIG', 'D3');
  cn(stop, 'GND', 'GND');
  cn(arm, 'SIG', 'D4');
  cn(arm, 'GND', 'GND');
  cn(speed, 'WIPER', 'A0');
  cn(speed, 'VCC', '5V');
  cn(speed, 'GND', 'GND');
  cn(led, 'ANODE', 'D9', 'Series current-limiting resistor required');
  cn(led, 'GND', 'GND');
  cn(display, 'SDA', 'A4');
  cn(display, 'SCL', 'A5');
  cn(display, 'VCC', '5V');
  cn(display, 'GND', 'GND');
  for (const t of j.definition.terminals) t.required = false;
  p.rules = [{
    id: uid(),
    source: run.id,
    event: 'press',
    op: 'set',
    variable: 'run',
    value: 1,
    min: 0,
    max: 1,
    target: led.id
  }, {
    id: uid(),
    source: stop.id,
    event: 'press',
    op: 'set',
    variable: 'run',
    value: 0,
    min: 0,
    max: 1,
    target: led.id
  }, {
    id: uid(),
    source: speed.id,
    event: 'change',
    op: 'map',
    variable: 'speed',
    value: 0,
    min: 0,
    max: 100,
    target: display.id
  }];
  p.assumptions = [{
    id: uid(),
    target: 'project',
    text: 'All generic component dimensions are illustrative. Confirm openings, rear bodies and mounting thickness against actual parts.'
  }, {
    id: uid(),
    target: j.id,
    text: 'Motor connector is a mechanical placeholder. External motor driver, power supply and protective circuits are outside this panel prototype.'
  }];
  p.evidence = [{
    id: uid(),
    target: 'controller',
    text: 'UNO R3 capabilities transcribed from Arduino product datasheet, checked 2026-10-08.',
    source: p.controller.source
  }];
  if (diagnostic) {
    stop.x = 55;
    stop.y = 112;
    led.x = 278;
    b.depth = 18;
    p.connections.find(c => c.component === stop.id && c.terminal === 'SIG').pin = 'D2';
    speed.definition.maxThickness = 2;
    display.definition.terminals.find(t => t.name === 'VCC').voltage = 3.3;
  }
  return p;
}
export function parseUnit(s, unit = 'mm') {
  const m = String(s).trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*(mm|cm|in|inch|\")?$/i);
  if (!m) throw Error('Enter a number with mm, cm or in.');
  const n = Number(m[1]),
    u = (m[2] || unit).toLowerCase();
  return n * (u === 'cm' ? 10 : ['in', 'inch', '"'].includes(u) ? 25.4 : 1);
}
export const formatUnit = (n, u = 'mm') => +(n / (u === 'in' ? 25.4 : 1)).toFixed(u === 'in' ? 5 : 3);
export function objects(panel) {
  return [...panel.components, ...panel.artwork];
}
export function designContent(p) {
  const c = clone(p);
  delete c.modified;
  delete c.baselines;
  delete c.acknowledgments;
  return c;
}
export function stable(v) {
  return JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, k) => (o[k] = x[k], o), {}) : x);
}
export function fingerprints(p) {
  const geometry = p.panels.map(b => ({
    id: b.id,
    w: b.w,
    h: b.h,
    shape: b.shape,
    radius: b.radius,
    outline: b.outline,
    thickness: b.thickness,
    origin: b.origin,
    exportLayers: {
      outline: b.layers.outline.export,
      cut: b.layers.cut.export,
      registration: b.layers.registration.export
    },
    components: b.components.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      rotation: c.rotation,
      openings: c.definition.openings
    })),
    cutArt: b.artwork.filter(a => ['cut', 'outline', 'registration'].includes(a.layer))
  }));
  const art = p.panels.map(b => ({
    id: b.id,
    components: b.components.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      rotation: c.rotation,
      label: c.label,
      labelSides: labelSides(c),
      labelX: c.labelX,
      labelY: c.labelY,
      labelSize: c.labelSize,
      layer: c.layer
    })),
    art: b.artwork,
    layers: Object.fromEntries(Object.entries(b.layers).map(([l, v]) => [l, v.export]))
  }));
  return {
    geometry: stable({
      geometry,
      revision: p.revision
    }),
    artwork: stable({
      geometry,
      art,
      assets: p.assets
    }),
    wiring: stable({
      connections: p.connections,
      controller: p.controller,
      refs: p.panels.map(b => b.components.map(c => ({
        id: c.id,
        ref: c.ref,
        terminals: c.definition.terminals
      })))
    }),
    project: stable(designContent(p))
  };
}
export function baselineDiff(p, base) {
  const before = base.snapshot;
  const changes = [];
  for (const key of ['name', 'revision', 'controller', 'connections', 'variables', 'rules', 'assumptions', 'evidence', 'assets']) if (stable(p[key]) !== stable(before[key])) changes.push(`${key} changed`);
  const previous = new Map(before.panels.map(b => [b.id, b]));
  for (const b of p.panels) {
    const old = previous.get(b.id);
    if (!old) {
      changes.push(`Panel added: ${b.name}`);
      continue;
    }
    for (const k of ['w', 'h', 'shape', 'radius', 'thickness', 'material', 'depth', 'outline', 'layers', 'labelSides']) if (stable(b[k]) !== stable(old[k])) changes.push(`${b.name}: ${k} changed`);
    const prev = new Map(objects(old).map(o => [o.id, o]));
    for (const o of objects(b)) {
      if (!prev.has(o.id)) changes.push(`Added ${o.ref || o.text || o.type}`);else if (stable(o) !== stable(prev.get(o.id))) changes.push(`Changed ${o.ref || o.text || o.type}`);
      prev.delete(o.id);
    }
    for (const o of prev.values()) changes.push(`Removed ${o.ref || o.text || o.type}`);
    previous.delete(b.id);
  }
  for (const b of previous.values()) changes.push(`Panel removed: ${b.name}`);
  return changes;
}
