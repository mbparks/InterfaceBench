import { esc, circ, rect, layers, labelVisible } from './model.js';
export const rad = d => d * Math.PI / 180;
export const transform = (x, y, o = {}) => {
  const a = rad(o.rotation || 0);
  return {
    x: (o.x || 0) + x * Math.cos(a) - y * Math.sin(a),
    y: (o.y || 0) + x * Math.sin(a) + y * Math.cos(a)
  };
};
export const mirror = (pt, w) => ({
  x: w - pt.x,
  y: pt.y
});
// Sixteen segments per circle keep PDF cubic approximation below 0.0002 mm
// even at the maximum supported 5000 mm diameter. SVG uses native circles/rects.
function arcCommands(cx, cy, r, start, end, steps = 4) {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const a = start + (end - start) * i / steps,
      b = start + (end - start) * (i + 1) / steps,
      k = 4 / 3 * Math.tan((b - a) / 4);
    out.push({
      type: 'C',
      x1: cx + r * (Math.cos(a) - k * Math.sin(a)),
      y1: cy + r * (Math.sin(a) + k * Math.cos(a)),
      x2: cx + r * (Math.cos(b) + k * Math.sin(b)),
      y2: cy + r * (Math.sin(b) - k * Math.cos(b)),
      x: cx + r * Math.cos(b),
      y: cy + r * Math.sin(b)
    });
  }
  return out;
}
export function commands(s) {
  const x = s.x || 0,
    y = s.y || 0;
  if (s.type === 'path') return s.commands;
  if (s.type === 'polygon') return s.points.map((p, i) => ({
    type: i ? 'L' : 'M',
    x: p.x,
    y: p.y
  })).concat({
    type: 'Z'
  });
  if (s.type === 'circle') {
    const r = s.d / 2;
    return [{
      type: 'M',
      x: x + r,
      y
    }, ...arcCommands(x, y, r, 0, Math.PI * 2, 16), {
      type: 'Z'
    }];
  }
  if (s.type === 'line') return [{
    type: 'M',
    x,
    y
  }, {
    type: 'L',
    x: x + s.w,
    y: y + s.h
  }];
  const l = x - s.w / 2,
    t = y - s.h / 2,
    r = Math.min(s.r || 0, s.w / 2, s.h / 2);
  return [{
    type: 'M',
    x: l + r,
    y: t
  }, {
    type: 'L',
    x: l + s.w - r,
    y: t
  }, ...arcCommands(l + s.w - r, t + r, r, -Math.PI / 2, 0), {
    type: 'L',
    x: l + s.w,
    y: t + s.h - r
  }, ...arcCommands(l + s.w - r, t + s.h - r, r, 0, Math.PI / 2), {
    type: 'L',
    x: l + r,
    y: t + s.h
  }, ...arcCommands(l + r, t + s.h - r, r, Math.PI / 2, Math.PI), {
    type: 'L',
    x: l,
    y: t + r
  }, ...arcCommands(l + r, t + r, r, Math.PI, Math.PI * 1.5), {
    type: 'Z'
  }];
}
export function mapCommands(cs, fn) {
  return cs.map(c => {
    let d = {
      type: c.type
    };
    for (const [x, y] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) if (c[x] !== undefined) {
      const p = fn(c[x], c[y]);
      d[x] = p.x;
      d[y] = p.y;
    }
    return d;
  });
}
export const worldCommands = (s, o = {}) => mapCommands(commands(s), (x, y) => transform(x, y, o));
export const num = n => +n.toFixed(5);
export const pathData = cs => cs.map(c => c.type + (['M', 'L'].includes(c.type) ? `${num(c.x)} ${num(c.y)}` : c.type === 'Q' ? `${num(c.x1)} ${num(c.y1)} ${num(c.x)} ${num(c.y)}` : c.type === 'C' ? `${num(c.x1)} ${num(c.y1)} ${num(c.x2)} ${num(c.y2)} ${num(c.x)} ${num(c.y)}` : '')).join(' ');
export function flatten(cs, step = 0.2) {
  const out = [];
  let last = {
      x: 0,
      y: 0
    },
    start = null;
  for (const c of cs) {
    if (c.type === 'Z') {
      if (start) out.push(start);
      continue;
    }
    if (c.type === 'M' || c.type === 'L') {
      last = {
        x: c.x,
        y: c.y
      };
      out.push(last);
      if (c.type === 'M') start = last;
    } else {
      const p = last;
      const approx = Math.hypot(c.x - p.x, c.y - p.y) + Math.hypot(c.x1 - p.x, c.y1 - p.y) + (c.type === 'C' ? Math.hypot(c.x2 - c.x, c.y2 - c.y) : 0);
      const n = Math.min(512, Math.max(8, Math.ceil(approx / step)));
      for (let i = 1; i <= n; i++) {
        const t = i / n,
          u = 1 - t;
        out.push(c.type === 'Q' ? {
          x: u * u * p.x + 2 * u * t * c.x1 + t * t * c.x,
          y: u * u * p.y + 2 * u * t * c.y1 + t * t * c.y
        } : {
          x: u * u * u * p.x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          y: u * u * u * p.y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y
        });
      }
      last = {
        x: c.x,
        y: c.y
      };
    }
  }
  return out;
}
export function bbox(cs) {
  const pts = flatten(cs, 1);
  if (!pts.length) return {
    x: 0,
    y: 0,
    w: 0,
    h: 0
  };
  const xs = pts.map(p => p.x),
    ys = pts.map(p => p.y);
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return {
    x,
    y,
    w: Math.max(...xs) - x,
    h: Math.max(...ys) - y
  };
}
export function inside(p, poly) {
  let v = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) v = !v;
  }
  return v;
}
export function pointSegment(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export function edgeDistance(p, poly) {
  let d = Infinity;
  for (let i = 1; i < poly.length; i++) d = Math.min(d, pointSegment(p, poly[i - 1], poly[i]));
  return d;
}
export const boxesOverlap = (a, b) => a.x < b.x + b.w - 1e-7 && a.x + a.w > b.x + 1e-7 && a.y < b.y + b.h - 1e-7 && a.y + a.h > b.y + 1e-7;
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export function intersects(a, b, c, d) {
  return cross(a, b, c) * cross(a, b, d) < -1e-9 && cross(c, d, a) * cross(c, d, b) < -1e-9;
}
export function polygonsOverlap(a, b) {
  if (a.some(p => inside(p, b)) || b.some(p => inside(p, a))) return true;
  for (let i = 1; i < a.length; i++) for (let j = 1; j < b.length; j++) if (intersects(a[i - 1], a[i], b[j - 1], b[j])) return true;
  return false;
}
export function panelShape(p) {
  if (p.shape === 'circle') return circ(p.w, p.w / 2, p.h / 2);
  if (p.shape === 'imported') return {
    type: 'polygon',
    points: p.outline
  };
  return rect(p.w, p.h, p.w / 2, p.h / 2, p.shape === 'rounded' ? p.radius : 0);
}
export function openingShapes(c, fit = 0) {
  return c.definition.openings.map(s => {
    if (!fit) return s;
    if (s.type === 'circle') return {
      ...s,
      d: s.d + 2 * fit
    };
    if (s.type === 'rect') return {
      ...s,
      w: s.w + 2 * fit,
      h: s.h + 2 * fit,
      r: Math.max(0, (s.r || 0) + fit)
    };
    throw Error('Fit compensation supports circle and rectangle openings only.');
  });
}
let font;
export function setFont(f) {
  font = f;
}
export function textShape(text, x, y, size = 3, align = 'left') {
  if (!font) throw Error('Bundled font is not ready. Reload while online once.');
  for (const ch of text) if (ch !== ' ' && !font.charToGlyphIndex(ch)) throw Error(`Bundled font does not contain “${ch}”. Use supported characters.`);
  const width = font.getAdvanceWidth(text, size);
  return {
    type: 'path',
    commands: font.getPath(text, x - (align === 'center' ? width / 2 : align === 'right' ? width : 0), y, size).commands
  };
}
export function artShapes(a, project) {
  if (a.type === 'text' || a.type === 'plate') {
    const t = textShape(a.text, a.type === 'plate' ? -a.w / 2 + 2 : 0, 0, a.size || 3);
    return a.type === 'plate' ? [{
      shape: rect(a.w, a.h, 0, 0, 1),
      fill: 'none',
      stroke: a.color,
      width: a.stroke || .3
    }, {
      shape: t,
      fill: a.color
    }] : [{
      shape: t,
      fill: a.color
    }];
  }
  if (a.type === 'line') return [{
    shape: {
      type: 'line',
      x: 0,
      y: 0,
      w: a.w,
      h: a.h
    },
    stroke: a.color,
    width: a.stroke || .3
  }];
  if (a.type === 'border') return [{
    shape: rect(a.w, a.h, 0, 0, a.r || 0),
    stroke: a.color,
    width: a.stroke || .3
  }];
  if (a.type === 'symbol') return [{
    shape: {
      type: 'line',
      x: -a.w / 2,
      y: 0,
      w: a.w,
      h: 0
    },
    stroke: a.color,
    width: .5
  }, {
    shape: {
      type: 'line',
      x: 0,
      y: -a.w / 2,
      w: 0,
      h: a.w
    },
    stroke: a.color,
    width: .5
  }];
  if (a.type === 'imported') return (project.assets[a.asset]?.shapes || []).map(s => ({
    shape: s,
    fill: a.fill ? '#ffffff' : 'none',
    stroke: a.color,
    width: a.stroke || .3
  }));
  if (a.type === 'image') return [];
  const shapes = [];
  for (let i = 0; i < a.count; i++) {
    const frac = i / (a.count - 1);
    if (a.type === 'rotary') {
      const theta = rad(a.start + frac * (a.end - a.start) - 90),
        r = a.r;
      shapes.push({
        shape: {
          type: 'line',
          x: Math.cos(theta) * r,
          y: Math.sin(theta) * r,
          w: Math.cos(theta) * (i % (a.majorEvery??5) === 0 ? (a.majorLength??4) : (a.minorLength??2)),
          h: Math.sin(theta) * (i % (a.majorEvery??5) === 0 ? (a.majorLength??4) : (a.minorLength??2))
        },
        stroke: a.color,
        width: a.stroke || .35
      });
    } else shapes.push({
      shape: {
        type: 'line',
        x: frac * a.w,
        y: 0,
        w: 0,
        h: -(i % (a.majorEvery??5) === 0 ? (a.majorLength??5) : (a.minorLength??3))
      },
      stroke: a.color,
      width: a.stroke || .35
    });
  }
  if (a.labelMode && a.labelMode !== 'none') for(let i=0;i<a.count;i++) {
    if(i % (a.labelEvery??1)) continue;
    const frac=i/(a.count-1), numeric=(a.labelMin??0)+frac*((a.labelMax??100)-(a.labelMin??0));
    const label=a.labelMode==='custom'?(a.customLabels?.[i]||''):`${a.labelPrefix||''}${numeric.toFixed(a.labelDecimals??0)}${a.labelSuffix||''}`;
    if(!label) continue;
    const distance=(a.majorLength??4)+(a.legendGap??2), theta=rad(a.start+frac*(a.end-a.start)-90);
    const x=a.type==='rotary'?Math.cos(theta)*(a.r+distance):frac*a.w;
    const y=a.type==='rotary'?Math.sin(theta)*(a.r+distance)+(a.legendSize??3)/3:-distance;
    shapes.push({shape:textShape(label,x,y,a.legendSize??3,'center'),fill:a.color});
  }
  return shapes;
}
// Rear manufacturing contains selected label paths only, positioned for rear-face-up work.
export function rearLabelScene(panel,{include}={}) {
  const enabled=include||Object.fromEntries(layers.map(l=>[l,panel.layers[l]?.export]));
  return panel.components.filter(c=>c.label&&labelVisible(panel,c,'rear')&&enabled[c.layer]).map(c=>{
    const pt=mirror(transform(c.labelX,c.labelY,c),panel.w);
    return {shape:textShape(c.label,0,0,c.labelSize,'center'),transform:{x:pt.x,y:pt.y,rotation:-c.rotation},layer:c.layer,fill:'#172c21',owner:c.id};
  });
}
export function scene(project, panel, {
  include,
  fit = 0,
  side = 'front'
} = {}) {
  if(!['front','rear'].includes(side))throw Error('Choose front or rear fabrication.');
  if(side==='rear')return rearLabelScene(panel,{include});
  const enabled = include || Object.fromEntries(layers.map(l => [l, panel.layers[l]?.export]));
  const result = [];
  const push = (shape, o, layer, style = {}, owner) => {
    if (enabled[layer]) result.push({
      shape,
      transform: o,
      layer,
      ...style,
      owner
    });
  };
  push(panelShape(panel), {}, 'outline', {
    stroke: '#000000',
    width: .15
  });
  for (const c of panel.components) {
    for (const s of openingShapes(c, fit)) push(s, c, 'cut', {
      stroke: '#000000',
      width: .15
    }, c.id);
    if (c.label && labelVisible(panel,c,'front')) push(textShape(c.label, c.labelX, c.labelY, c.labelSize, 'center'), c, c.layer, {
      fill: '#172c21'
    }, c.id);
  }
  for (const a of panel.artwork) {
    if (a.type === 'image') {
      if (enabled[a.layer]) result.push({
        image: project.assets[a.asset],
        transform: a,
        w: a.w,
        h: a.h,
        layer: a.layer,
        owner: a.id
      });
    } else for (const s of artShapes(a, project)) push(s.shape, a, a.layer, s, a.id);
  }
  return result;
}
export function svgElement(item, {
  color
} = {}) {
  const tr = item.transform || {};
  const t = `translate(${tr.x || 0} ${tr.y || 0}) rotate(${tr.rotation || 0})`;
  if (item.image) return `<image transform="${t}" x="0" y="0" width="${item.w}" height="${item.h}" href="${esc(item.image.data)}"/>`;
  const s = item.shape;
  let el;
  if (s.type === 'rect') el = `rect x="${(s.x || 0) - s.w / 2}" y="${(s.y || 0) - s.h / 2}" width="${s.w}" height="${s.h}" rx="${Math.min(s.r || 0, s.w / 2, s.h / 2)}"`;else if (s.type === 'circle') el = `circle cx="${s.x || 0}" cy="${s.y || 0}" r="${s.d / 2}"`;else el = `path d="${pathData(commands(s))}"`;
  return `<${el} transform="${t}" fill="${esc(color || item.fill || 'none')}" stroke="${esc(color || item.stroke || 'none')}" stroke-width="${item.width || 0}"/>`;
}
export function objectBounds(o, p) {
  if (o.definition) return bbox(worldCommands(o.definition.front, o));
  if (o.type === 'image') return bbox(worldCommands(rect(o.w, o.h, o.w / 2, o.h / 2), o));
  const all = artShapes(o, p).flatMap(s => worldCommands(s.shape, o));
  return bbox(all);
}
