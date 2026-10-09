import { normalizedSVG } from './svg-import.js';
import { SCHEMA, clone, layers, roles } from './model.js';
import { intersects } from './geometry.js';
const num = (v, name, min = -100000, max = 100000) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw Error(`${name}: expected a finite number from ${min} to ${max}.`);
};
const color = v => {
  if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) throw Error('Colors must be six-digit hexadecimal values.');
};
const str = (v, name, max = 4000) => {
  if (typeof v !== 'string' || v.length > max) throw Error(`${name}: invalid text.`);
};
function cleanTree(v, depth = 0) {
  if (depth > 45) throw Error('Project nesting is too deep.');
  if (!v || typeof v !== 'object') return;
  for (const k of Object.keys(v)) {
    if (['__proto__', 'prototype', 'constructor'].includes(k)) throw Error('Unsafe object key.');
    cleanTree(v[k], depth + 1);
  }
}
export function validateShape(s) {
  if (!s || !['circle', 'rect', 'polygon', 'path', 'line'].includes(s.type)) throw Error('Unsupported geometry.');
  if (s.type === 'circle') num(s.d, 'Diameter', .01, 5000);
  if (s.type === 'rect') {
    num(s.w, 'Width', .01, 5000);
    num(s.h, 'Height', .01, 5000);
    num(s.r || 0, 'Corner radius', 0, 2500);
  }
  if (['circle', 'rect', 'line'].includes(s.type)) {
    num(s.x || 0, 'X');
    num(s.y || 0, 'Y');
  }
  if (s.type === 'line') {
    num(s.w, 'Line width');
    num(s.h, 'Line height');
  }
  if (s.type === 'polygon') {
    if (!Array.isArray(s.points) || s.points.length < 3 || s.points.length > 10000) throw Error('Polygon needs 3–10,000 points.');
    for (const p of s.points) {
      num(p.x, 'Path X');
      num(p.y, 'Path Y');
    }
    const pts = s.points.slice();
    if (pts[0].x === pts.at(-1).x && pts[0].y === pts.at(-1).y) pts.pop();
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i],
        b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
      for (let j = i + 2; j < pts.length; j++) {
        if (i === 0 && j === pts.length - 1) continue;
        if (intersects(a, b, pts[j], pts[(j + 1) % pts.length])) throw Error('Self-intersecting polygons are unsupported.');
      }
    }
    if (Math.abs(area) < .000001) throw Error('Polygon has no enclosed area.');
  }
  if (s.type === 'path') {
    if (!Array.isArray(s.commands) || s.commands.length > 20000 || s.commands[0]?.type !== 'M') throw Error('Invalid path.');
    for (const c of s.commands) {
      if (!['M', 'L', 'Q', 'C', 'Z'].includes(c.type)) throw Error('Unsupported path command.');
      if (c.type !== 'Z') {
        num(c.x, 'Path X');
        num(c.y, 'Path Y');
      }
      if (['Q', 'C'].includes(c.type)) {
        num(c.x1, 'Path X1');
        num(c.y1, 'Path Y1');
      }
      if (c.type === 'C') {
        num(c.x2, 'Path X2');
        num(c.y2, 'Path Y2');
      }
    }
  }
  return s;
}
export function validateDefinition(d) {
  cleanTree(d);
  color(d.color);
  if(d.photoAsset && (d.photoAsset.type!=='raster'||typeof d.photoAsset.data!=='string'||d.photoAsset.data.length>16000000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(d.photoAsset.data)))throw Error('Library photo must be an embedded PNG or JPEG.');
  str(d.id, 'Definition ID', 200);
  str(d.name, 'Part name');
  if(d.category!==undefined)str(d.category,'Component category',100);
  if(d.tags!==undefined){if(!Array.isArray(d.tags)||d.tags.length>40)throw Error('Provide up to 40 search tags.');d.tags.forEach(t=>str(t,'Search tag',100));}
  if(d.visual!==undefined&&!['standard','outline'].includes(d.visual))throw Error('Unsupported component visual.');
  if(d.libraryId!==undefined)str(d.libraryId,'Part family',200);
  if(d.libraryRevision!==undefined){num(d.libraryRevision,'Library revision',1,100000);if(!Number.isInteger(d.libraryRevision))throw Error('Library revision must be an integer.');}
  str(d.kind, 'Part kind', 100);
  if (!['button', 'toggle', 'encoder', 'pot', 'led', 'display', 'connector', 'mount'].includes(d.kind)) throw Error('Unsupported component behavior.');
  for (const k of ['front', 'rear', 'access']) validateShape(d[k]);
  if (!Array.isArray(d.openings) || d.openings.length > 100 || !d.openings.length) throw Error('Provide 1–100 openings.');
  d.openings.forEach(s => {
    validateShape(s);
    if (s.type === 'line' || s.type === 'path' && s.commands.at(-1).type !== 'Z') throw Error('Component openings must be closed regions.');
    if(s.type==='path'){let closed=true;for(const c of s.commands){if(c.type==='M'){if(!closed)throw Error('Every opening contour must be closed.');closed=false;}if(c.type==='Z')closed=true;}if(!closed)throw Error('Every opening contour must be closed.');}
  });
  for (const k of ['depth', 'bend', 'minThickness', 'maxThickness']) num(d[k], k, 0, 5000);
  if (d.minThickness > d.maxThickness) throw Error('Mounting thickness limits are reversed.');
  if (!Array.isArray(d.terminals) || d.terminals.length > 100) throw Error('Invalid terminals.');
  const ids = new Set();
  for (const t of d.terminals) {
    str(t.id, 'Terminal id', 100);
    str(t.name, 'Terminal name', 100);
    if (ids.has(t.id)) throw Error('Duplicate terminal ID.');
    ids.add(t.id);
    if (!roles.includes(t.role)) throw Error('Unknown terminal role.');
    num(t.voltage, 'Terminal voltage', 0, 1000);
  }
  return d;
}
function validateLabelSides(o) {
  const v=o.labelSides;
  if(v===undefined)return;
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['front','rear'].includes(k)||typeof v[k]!=='boolean'))throw Error('Label sides must contain front/rear booleans.');
}
export function migrate(raw) {
  const p = clone(raw);
  if (p.app !== 'INTERFACEBENCH') throw Error('This is not an INTERFACEBENCH project.');
  if (p.schema === 1) {
    p.schema = 2;
    p.assets ??= {};
    p.acknowledgments ??= {};
    for (const b of p.panels) {
      b.origin ??= 'top-left';
      for (const c of b.components) c.definition.bend ??= 0;
    }
  }
  if (p.schema === 2) p.schema = 3;
  if (p.schema !== SCHEMA) throw Error(`Unsupported project schema ${p.schema}; this release reads schemas 1, 2 and 3.`);
  // Fold the short-lived v1.4.1 panel masters into the two component flags once.
  for(const b of p.panels||[])if(b.labelSides!==undefined){
    validateLabelSides(b);
    for(const c of b.components||[]){
      validateLabelSides(c);
      c.labelSides={front:b.labelSides.front!==false&&c.labelSides?.front!==false,rear:b.labelSides.rear!==false&&c.labelSides?.rear!==false};
    }
    delete b.labelSides;
  }
  return p;
}
export function validateProject(raw) {
  cleanTree(raw);
  const p = migrate(raw);
  str(p.id, 'Project ID', 200);
  str(p.name, 'Project name', 300);
  str(p.revision, 'Revision', 50);
  if (!Array.isArray(p.panels) || !p.panels.length || p.panels.length > 30) throw Error('A project needs 1–30 panels.');
  const ids = new Set(),
    refs = new Set(),
    components = new Map();
  function id(v) {
    str(v, 'ID', 200);
    if (ids.has(v)) throw Error(`Duplicate object ID: ${v}`);
    ids.add(v);
  }
  for (const b of p.panels) {
    id(b.id);
    validateLabelSides(b);
    color(b.color);
    str(b.name, 'Panel name', 300);
    for (const k of ['w', 'h']) num(b[k], k, 5, 3000);
    for (const k of ['radius', 'thickness', 'depth', 'edge']) num(b[k], k, 0, 5000);
    if (!['rect', 'rounded', 'circle', 'imported'].includes(b.shape)) throw Error('Unsupported panel outline.');
    if (b.shape === 'circle' && Math.abs(b.w - b.h) > .000001) throw Error('Circular panels require equal width and height.');
    if (b.shape === 'imported') validateShape({
      type: 'polygon',
      points: b.outline
    });
    if (!['top-left', 'center', 'bottom-left'].includes(b.origin)) throw Error('Unsupported origin.');
    if (!Array.isArray(b.components) || !Array.isArray(b.artwork) || b.components.length + b.artwork.length > 3000) throw Error('Panel object limit exceeded.');
    for (const layer of layers) {
      if (!b.layers?.[layer] || ['visible', 'locked', 'export'].some(k => typeof b.layers[layer][k] !== 'boolean')) throw Error('Invalid layer settings.');
    }
    for (const c of b.components) {
      id(c.id);
      validateLabelSides(c);
      color(c.color);
      str(c.ref, 'Reference', 80);
      if (refs.has(c.ref)) throw Error('Component references must be unique.');
      refs.add(c.ref);
      validateDefinition(c.definition);
      components.set(c.id, c);
      str(c.label, 'Label', 300);
      for (const k of ['x', 'y', 'rotation', 'labelX', 'labelY', 'labelSize']) num(c[k], k);
      if (c.labelSize <= 0) throw Error('Label size must be positive.');
      if (!layers.includes(c.layer)) throw Error('Unknown layer.');
    }
    for (const a of b.artwork) {
      id(a.id);
      if (a.color !== undefined) color(a.color);
      if (!['text', 'plate', 'line', 'border', 'symbol', 'rotary', 'linear', 'imported', 'image'].includes(a.type)) throw Error('Unsupported artwork.');
      for (const k of ['x', 'y', 'rotation']) num(a[k], k);
      if (!layers.includes(a.layer)) throw Error('Unknown artwork layer.');
      if (['text', 'plate'].includes(a.type)) {
        str(a.text, 'Artwork text', 1000);
        num(a.size, 'Text size', .1, 500);
      }
      for (const k of ['w', 'h', 'r', 'stroke', 'count', 'start', 'end']) if (a[k] !== undefined) num(a[k], k);
      if (['plate', 'border', 'symbol', 'linear'].includes(a.type)) num(a.w, 'Artwork width', .01, 5000);
      if (['plate', 'border'].includes(a.type)) num(a.h, 'Artwork height', .01, 5000);
      if (a.type === 'rotary') num(a.r, 'Scale radius', .01, 2500);
      if (['rotary', 'linear'].includes(a.type)) {
        num(a.count, 'Tick count', 2, 500);
        if (!Number.isInteger(a.count)) throw Error('Tick count must be an integer.');
        if(a.labelMode!==undefined && !['none','numeric','custom'].includes(a.labelMode)) throw Error('Unsupported scale labels.');
        for(const key of ['labelMin','labelMax']) if(a[key]!==undefined) num(a[key],key);
        for(const key of ['labelEvery','majorEvery']) if(a[key]!==undefined){num(a[key],key,1,500);if(!Number.isInteger(a[key]))throw Error('Tick intervals must be integers.');}
        if(a.labelDecimals!==undefined){num(a.labelDecimals,'Decimal places',0,6);if(!Number.isInteger(a.labelDecimals))throw Error('Decimal places must be an integer.');}
        for(const key of ['legendSize','majorLength','minorLength']) if(a[key]!==undefined) num(a[key],key,.1,100);
        if(a.legendGap!==undefined) num(a.legendGap,'Legend gap',0,100);
        for(const key of ['labelPrefix','labelSuffix']) if(a[key]!==undefined) str(a[key],key,40);
        if(a.customLabels!==undefined){if(!Array.isArray(a.customLabels))throw Error('Custom labels must be an array.');a.customLabels.forEach(s=>str(s,'Scale label',80));}
        if(a.labelMode==='custom' && a.customLabels?.length!==a.count) throw Error('Provide one custom label entry per tick.');
      }
      if (a.asset && !p.assets[a.asset]) throw Error('Missing embedded asset.');
      if (a.type === 'image') {
        num(a.w, 'Image width', .01, 5000);
        num(a.h, 'Image height', .01, 5000);
      }
      if (a.type === 'image' && !['uv', 'overlay', 'reference'].includes(a.layer)) throw Error('Raster images must be on UV, overlay or reference layers.');
    }
  }
  if (!Array.isArray(p.controller?.pins) || p.controller.pins.length > 1000) throw Error('Invalid controller.');
  const pinIds = new Set();
  for (const pin of p.controller.pins) {
    str(pin.id, 'Pin name', 100);
    if (pinIds.has(pin.id)) throw Error('Duplicate controller pin.');
    pinIds.add(pin.id);
    num(pin.voltage, 'Pin voltage', 0, 1000);
    if (!Array.isArray(pin.caps) || pin.caps.some(r => !roles.includes(r))) throw Error('Unsupported pin capability.');
    if (pin.code && !/^(?:[0-9]{1,3}|[A-Za-z_][A-Za-z_0-9]*)$/.test(pin.code)) throw Error('Pin code must be an integer or C identifier.');
  }
  if (!Array.isArray(p.connections) || p.connections.length > 10000) throw Error('Invalid connections.');
  const endpoints = new Set();
  for (const c of p.connections) {
    id(c.id);
    const cmp = components.get(c.component);
    if (!cmp || !cmp.definition.terminals.some(t => t.id === c.terminal)) throw Error('A connection references an unknown terminal.');
    const key = c.component + '/' + c.terminal;
    if (endpoints.has(key)) throw Error('Duplicate connection for one terminal.');
    endpoints.add(key);
    for (const k of ['pin', 'signal', 'bus', 'notes']) str(c[k] ?? '', k);
  }
  for (const [key, a] of Object.entries(p.assets)) {
    if (key.length > 200) throw Error('Invalid asset ID.');
    if (a.type === 'raster') {
      if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(a.data) || a.data.length > 16000000) throw Error('Unsafe or oversized image.');
    } else if (a.type === 'vector') {
      if (!Array.isArray(a.shapes) || a.shapes.length > 1000) throw Error('Invalid vector asset.');
      a.shapes.forEach(validateShape);
    } else throw Error('Unsupported asset type.');
  }
  if (!p.variables || typeof p.variables !== 'object' || Array.isArray(p.variables)) throw Error('Invalid variables.');
  for (const [k, v] of Object.entries(p.variables)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(k)) throw Error('Variable names must be identifiers.');
    num(v, 'Variable value');
  }
  if (!Array.isArray(p.rules) || p.rules.length > 1000) throw Error('Invalid rules.');
  for (const r of p.rules) {
    if (!components.has(r.source) || !['press', 'release', 'change'].includes(r.event) || !['set', 'toggle', 'increment', 'map', 'clamp', 'show', 'enable', 'indicator'].includes(r.op) || !Object.hasOwn(p.variables, r.variable)) throw Error('Invalid rehearsal rule.');
    for (const k of ['value', 'min', 'max']) num(r[k], `Rule ${k}`);
    if (r.min > r.max) throw Error('Rule range is reversed.');
    if (r.target && !components.has(r.target)) throw Error('Unknown rehearsal target.');
  }
  for (const k of ['assumptions', 'evidence', 'baselines']) if (!Array.isArray(p[k]) || p[k].length > 1000) throw Error(`Invalid ${k}.`);
  if (p.baselines.length > 20) throw Error('Keep at most 20 named baselines.');
  for (const b of p.baselines) {
    str(b.name, 'Baseline name', 300);
    if (!b.snapshot || b.snapshot.baselines?.length) throw Error('Nested baselines are not supported.');
    b.snapshot = validateProject(b.snapshot);
  }
  return p;
}
// Import only normalized geometry; validate the result before it reaches a project.
export function importSVG(text) {
  const asset = normalizedSVG(text);
  asset.shapes.forEach(validateShape);
  return asset;
}
export function parseStraightPath(d) {
  if (!d || /[^mMlLhHvVzZ0-9eE+.,\s-]/.test(d)) throw Error('Paths support M/L/H/V/Z only. Flatten curves to polygons before import.');
  const tokens = d.match(/[mMlLhHvVzZ]|[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?/gi) || [];
  let i = 0,
    x = 0,
    y = 0,
    cmd = '',
    points = [],
    closed = false;
  const number = () => {
    const n = Number(tokens[i++]);
    if (!Number.isFinite(n)) throw Error('Invalid SVG path coordinate.');
    return n;
  };
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M':
        if (points.length) throw Error('Only one closed subpath per imported polygon.');
      case 'L':
        {
          const nx = number(),
            ny = number();
          x = rel ? x + nx : nx;
          y = rel ? y + ny : ny;
          points.push({
            x,
            y
          });
          if (cmd.toUpperCase() === 'M') cmd = rel ? 'l' : 'L';
          break;
        }
      case 'H':
        {
          const nx = number();
          x = rel ? x + nx : nx;
          points.push({
            x,
            y
          });
          break;
        }
      case 'V':
        {
          const ny = number();
          y = rel ? y + ny : ny;
          points.push({
            x,
            y
          });
          break;
        }
      case 'Z':
        closed = true;
        if (i < tokens.length) throw Error('Multiple subpaths are unsupported.');
        break;
      default:
        throw Error('Invalid SVG path.');
    }
  }
  if (!closed || points.length < 3) throw Error('Imported paths must be closed polygons.');
  return points;
}
