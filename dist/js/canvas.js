import { esc, objects, rect, circ } from './model.js';
import { svgElement, commands, pathData, panelShape, artShapes, objectBounds, transform, mirror } from './geometry.js';
// Physical geometry is independent of camera and rear-view presentation.
const primitive = (shape, fill, stroke, width = .3) => svgElement({
  shape,
  fill,
  stroke,
  width
});
export function partIcon(d) {
  const w=d.front.d||d.front.w||50,h=d.front.d||d.front.h||44,pad=Math.max(w,h)*.12+2;
  return `<svg viewBox="${-w/2-pad} ${-h/2-pad} ${w+pad*2} ${h+pad*2}" aria-hidden="true">${primitive(d.front,d.color,'#c6d2c2',.6)}${d.openings.map(s=>primitive(s,'#14241d','#c6d2c2',.5)).join('')}</svg>`;
}
export function frontBody(c, selected, value, display) {
  const d = c.definition,
    s = d.front;
  let html = primitive(s, c.color || d.color, '#384337', .45);
  if(d.visual==='outline') {
    html+=d.openings.map(s=>primitive(s,'#17271f','#a5b49e',.3)).join('');
    if(d.kind==='display')html+=`<text x="0" y="1.5" fill="#cceab3" font-size="${Math.min(3.5,(s.w||s.d)/12)}" text-anchor="middle">${esc((display||'READY').slice(0,22))}</text>`;
    if(['button','toggle','pot','encoder','led'].includes(d.kind))html+=primitive(circ(3,0,0),value?'#d5ff82':'#56754d','#c6d2c2',.3);
    return html;
  }
  const w = s.d || s.w,
    h = s.d || s.h;
  if (['button', 'pot', 'encoder', 'toggle'].includes(d.kind)) {
    html = primitive(s, 'url(#metal)', '#455043', .45);
    if (d.kind === 'toggle') {
      html += primitive(circ(Math.min(w, h) * .6), '#28332b', '#dfe2d5', .4) + `<path d="M 0 2 L ${value ? 3 : -3} -9" stroke="#c8d2cc" stroke-width="3.5" stroke-linecap="round"/><circle cx="${value ? 3 : -3}" cy="-9" r="2.4" fill="#e7ebdf"/>`;
    } else {
      const r = w * .39;
      html += primitive(circ(r * 2), c.color || d.color, '#354336', .4);
      if (d.kind === 'pot' || d.kind === 'encoder') {
        const a = ((value || 0) / 100 * 270 - 135) * Math.PI / 180;
        html += `<path d="M ${Math.sin(a) * r * .4} ${-Math.cos(a) * r * .4} L ${Math.sin(a) * r * .86} ${-Math.cos(a) * r * .86}" stroke="#26342a" stroke-width="1.3" stroke-linecap="round"/>`;
        html += `<circle r="${r * .85}" fill="none" stroke="#ffffff22" stroke-width=".5"/>`;
      } else html += `<circle r="${r * .85}" fill="none" stroke="#ffffff55" stroke-width=".5"/>`;
    }
  }
  if (d.kind === 'led') html += primitive(circ(w * .7), value ? '#d5ff82' : '#56754d', '#32412c', .3) + (value ? primitive(circ(w * .25), '#f2ffce', 'none') : '');
  if (d.kind === 'display') html += primitive(rect(w - 4, h - 4, 0, 0, 1), '#14291f', '#82917d', .3) + `<text x="0" y="1.5" fill="#cceab3" font-size="3.5" text-anchor="middle">${esc((display || 'READY').slice(0, 22))}</text>`;
  if (d.kind === 'connector') {
    if (s.type === 'circle') for (let i = 0; i < 3; i++) html += primitive(circ(2.4, Math.cos(i * 2.094 - 1.57) * w * .2, Math.sin(i * 2.094 - 1.57) * w * .2), '#151c19', '#929990', .2);else html += primitive(rect(w * .65, h * .4), '#1c2922', '#4c594f', .3);
  }
  if (d.kind === 'mount') html += primitive(d.openings[0], '#1d2b22', '#5b6154', .3);
  return html;
}
export function renderCanvas(app) {
  const {
    p,
    panel: b,
    selection,
    prefs,
    view,
    sim
  } = app;
  const svg = document.getElementById('canvas');
  if (!b) return;
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  const scale = view.w / (svg.clientWidth || 800),
    sw = scale * 1.25,
    textSize = scale * 10;
  const rear = app.side === 'rear';
  const selected = new Set(selection);
  const items = [];
  items.push(`<defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dce0d4"/><stop offset=".4" stop-color="#a3aea4"/><stop offset=".65" stop-color="#ecefdf"/><stop offset="1" stop-color="#69756a"/></linearGradient><linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${esc(b.color)}"/><stop offset="1" stop-color="${esc(b.color)}" stop-opacity=".88"/></linearGradient><filter id="panelShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".2"/></filter></defs>`);
  let step = prefs.grid;
  while (view.w / step > 110) step *= 2;
  let grid = '';
  for (let x = Math.floor(view.x / step) * step; x < view.x + view.w; x += step) for (let y = Math.floor(view.y / step) * step; y < view.y + view.h; y += step) grid += `<circle cx="${x}" cy="${y}" r="${scale * .65}"/>`;
  items.push(`<g fill="var(--grid)">${grid}</g>`);
  // Rulers express front-reference coordinates even in mirrored rear presentation.
  const tick = step * 5;
  let ruler = '';
  for (let x = 0; x <= b.w; x += tick) {
    const sx = rear ? b.w - x : x;
    ruler += `<path d="M ${sx} -5 v -2"/><text x="${sx}" y="-10" text-anchor="middle">${+(x / (prefs.units === 'in' ? 25.4 : 1)).toFixed(2)}</text>`;
  }
  for (let y = 0; y <= b.h; y += tick) ruler += `<path d="M -5 ${y} h -2"/><text x="-10" y="${y + textSize * .3}" text-anchor="end">${+(y / (prefs.units === 'in' ? 25.4 : 1)).toFixed(2)}</text>`;
  items.push(`<g stroke="var(--muted)" stroke-width="${scale * .5}" fill="var(--muted)" font-size="${textSize}">${ruler}</g>`);
  items.push(`<g ${rear ? `transform="translate(${b.w} 0) scale(-1 1)"` : ''}>`);
  items.push(`<g filter="url(#panelShadow)">${primitive(panelShape(b), 'url(#wood)', '#5c644c', .4)}</g>`);
  // Quiet grain is presentational; it is never included in manufacturing output.
  if (/wood|ply|birch|oak|walnut/i.test(b.material) && b.shape !== 'imported') items.push(`<g opacity=".06" stroke="#493f28" stroke-width=".25">${Array.from({
    length: 18
  }, (_, i) => `<path d="M ${10 + i * 15} 10 q ${i % 2 ? 5 : -5} ${b.h / 2} 0 ${b.h - 20}"/>`).join('')}</g>`);
  if (app.compare) {
    const base = p.baselines.find(x => x.id === app.compare)?.snapshot.panels.find(x => x.id === b.id);
    if (base) items.push(`<g opacity=".65" stroke-dasharray="2 2">${base.components.map(c => `<g transform="translate(${c.x} ${c.y}) rotate(${c.rotation})">${primitive(c.definition.front, 'none', '#7454ab', .5)}</g>`).join('')}</g>`);
  }
  const arts = b.artwork.filter(a => b.layers[a.layer].visible);
  for (const a of arts) {
    try {
      let visual = a.type === 'image' ? svgElement({
        image: p.assets[a.asset],
        transform: a,
        w: a.w,
        h: a.h
      }) : `<g transform="translate(${a.x} ${a.y}) rotate(${a.rotation})">${artShapes(a, p).map(s => svgElement(s)).join('')}</g>`;
      items.push(`<g data-object="${a.id}" opacity="${a.layer === 'reference' ? .45 : 1}">${visual}</g>`);
    } catch {}
  }
  for (const c of b.components) {
    const d = c.definition;
    if (b.layers.cut.visible) items.push(`<g transform="translate(${c.x} ${c.y}) rotate(${c.rotation})">${d.openings.map(s => primitive(s, rear ? '#1a2c2466' : '#29382b', '#433b2b', .3)).join('')}</g>`);
    let body;
    if (rear) {
      body = primitive(d.rear, '#27372bca', '#adc89b', .4);
      const w = d.rear.w || d.rear.d,
        h = d.rear.h || d.rear.d;
      for (const [i, t] of d.terminals.entries()) body += primitive(rect(2.3, 4, (i - (d.terminals.length - 1) / 2) * 3.5, h / 2 + 1), '#b1b8a1', '#46583c', .2);
    } else body = frontBody(c, selected.has(c.id), sim?.values[c.id] ?? c.value, sim?.displays[c.id] || c.display);
    items.push(`<g data-object="${c.id}" transform="translate(${c.x} ${c.y}) rotate(${c.rotation})" opacity="${sim?.enabled[c.id] === false ? .3 : 1}">${body}${prefs.envelopes ? `<g stroke-dasharray="1 1">${primitive(d.access, 'none', rear ? '#bbdc90' : '#3f583e', .3)}</g>` : ''}</g>`);
  }
  items.push('</g>');
  for (const c of b.components) {
    if (c.label && b.layers[c.layer].visible) {
      const pos = transform(c.labelX, c.labelY, c),
        pt = rear ? mirror(pos, b.w) : pos;
      items.push(`<text x="${pt.x}" y="${pt.y}" transform="rotate(${rear ? -c.rotation : c.rotation} ${pt.x} ${pt.y})" text-anchor="middle" font-size="${c.labelSize}" fill="#253d2c" pointer-events="none">${esc(c.label)}</text>`);
    }
    if (rear) {
      const pt = mirror(c, b.w);
      items.push(`<text x="${pt.x}" y="${pt.y + 1}" text-anchor="middle" font-size="3" fill="#d7e6bc" pointer-events="none">${esc(c.ref)}</text>`);
    }
  }
  for (const o of objects(b)) {
    if (!selected.has(o.id)) continue;
    try {
      const bounds = objectBounds(o, p),
        x = rear ? b.w - bounds.x - bounds.w : bounds.x;
      items.push(`<rect class="selection" x="${x - 2}" y="${bounds.y - 2}" width="${bounds.w + 4}" height="${bounds.h + 4}" stroke-width="${sw}" stroke-dasharray="${o.locked ? `${sw * 2} ${sw * 2}` : 'none'}"/>`);
      for (const [cx, cy] of [[x - 2, bounds.y - 2], [x + bounds.w + 2, bounds.y + bounds.h + 2]]) items.push(`<rect x="${cx - sw * 1.8}" y="${cy - sw * 1.8}" width="${sw * 3.6}" height="${sw * 3.6}" fill="var(--accent)"/>`);
    } catch {}
  }
  if (app.findingIds?.length) {
    for (const id of app.findingIds) {
      const c = objects(b).find(c => c.id === id);
      if (c) {
        const pt = rear ? mirror(c, b.w) : c;
        items.push(`<circle cx="${pt.x}" cy="${pt.y}" r="${sw * 4}" fill="var(--danger)" stroke="var(--bg)" stroke-width="${sw}"/>`);
      }
    }
  }
  const drawMeasure = (a, d) => {
    const pa = rear ? mirror(a, b.w) : a,
      pb = rear ? mirror(d, b.w) : d,
      dist = Math.hypot(a.x - d.x, a.y - d.y);
    return `<g class="measure" stroke-width="${sw}"><path d="M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}"/><circle cx="${pa.x}" cy="${pa.y}" r="${sw * 2}"/><circle cx="${pb.x}" cy="${pb.y}" r="${sw * 2}"/></g><text x="${(pa.x + pb.x) / 2}" y="${(pa.y + pb.y) / 2 - textSize}" font-size="${textSize}" text-anchor="middle" class="selection-text">${(dist / (prefs.units === 'in' ? 25.4 : 1)).toFixed(3)} ${prefs.units}</text>`;
  };
  if (app.measure?.length === 2) items.push(drawMeasure(...app.measure));else if (selection.length === 2) {
    const a = objects(b).find(o => o.id === selection[0]),
      d = objects(b).find(o => o.id === selection[1]);
    if (a && d) items.push(drawMeasure(a, d));
  }
  if (app.marquee) {
    const m = app.marquee;
    items.push(`<rect x="${Math.min(m.x, m.x2)}" y="${Math.min(m.y, m.y2)}" width="${Math.abs(m.x2 - m.x)}" height="${Math.abs(m.y2 - m.y)}" fill="var(--accent)" fill-opacity=".08" stroke="var(--accent)" stroke-width="${sw}"/>`);
  }
  if (app.guides) items.push(`<g stroke="#e9eec4" stroke-width="${sw * .7}" stroke-dasharray="${sw * 4} ${sw * 3}">${app.guides.map(g => g.axis === 'x' ? `<path d="M ${rear ? b.w - g.value : g.value} 0 V ${b.h}"/>` : `<path d="M 0 ${g.value} H ${b.w}"/>`).join('')}</g>`);
  svg.innerHTML = items.join('');
  document.getElementById('viewBadge').textContent = `${rear ? 'REAR · MIRRORED ABOUT VERTICAL CENTRE' : 'FRONT · FABRICATION ORIENTATION'} / ${b.name}`;
  document.getElementById('canvasHint').textContent = app.stage === 'rehearse' ? 'SIMULATION · Click controls to operate · Reset to start again' : app.tool === 'measure' ? 'Pick two points · Escape clears the measurement' : 'Scroll to zoom · Space + drag to pan · Double-click a part to inspect';
}
