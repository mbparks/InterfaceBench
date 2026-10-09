import { VERSION, SCHEMA, clone, esc, layers, layerNames, fingerprints, labelSides } from './model.js';
import { scene, svgElement, worldCommands, pathData, mapCommands, transform, textShape, commands } from './geometry.js';
import { runChecks } from './checks.js';
export const safeName = s => String(s).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'panel';
export function svgExport(project, panel, opts = {}) {
  const origin = panel.origin === 'center' ? {
    x: panel.w / 2,
    y: panel.h / 2
  } : panel.origin === 'bottom-left' ? {
    x: 0,
    y: panel.h
  } : {
    x: 0,
    y: 0
  };
  const items = scene(project, panel, opts);
  const rear=opts.side==='rear';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${panel.w}mm" height="${panel.h}mm" viewBox="${-origin.x} ${-origin.y} ${panel.w} ${panel.h}">\n<title>${esc(project.name)} — ${esc(panel.name)} — Rev ${esc(project.revision)} — ${rear?'REAR LABELS':'FRONT'}</title>\n<desc>INTERFACEBENCH ${VERSION}; ${rear?'rear label fabrication; rear face up; positions reflected about vertical centre; readable glyphs; label paths only':'front fabrication view'}; +X right, +Y down; ${panel.origin} origin; fit allowance per side ${rear?0:opts.fit || 0} mm; text outlined in DejaVu Sans. Nominal geometry unless explicit allowance shown.</desc>\n<g transform="translate(${-origin.x} ${-origin.y})">${layers.map(l => `<g id="${l}" data-process="${esc(layerNames[l])}">${items.filter(i => i.layer === l).map(i => svgElement(i)).join('\n')}</g>`).join('\n')}</g>\n</svg>`;
}
export function wiringRows(project) {
  return project.panels.flatMap(b => b.components.flatMap(c => c.definition.terminals.map(t => {
    const n = project.connections.find(n => n.component === c.id && n.terminal === t.id);
    return {
      panel: b.name,
      reference: c.ref,
      terminal: t.name,
      role: t.role,
      voltage: t.voltage,
      signal: n?.signal || '',
      pin: n?.pin || '',
      bus: n?.bus || '',
      pullup: n?.pullup ? 'yes' : 'no',
      active: n?.activeLow ? 'low' : 'high',
      driver: n?.driver || '',
      notes: n?.notes || '',
      revision: project.revision
    };
  })));
}
export function wiringCSV(project) {
  const rows = wiringRows(project),
    keys = ['panel', 'reference', 'terminal', 'role', 'voltage', 'signal', 'pin', 'bus', 'pullup', 'active', 'driver', 'notes', 'revision'];
  const val = v => '"' + String(v ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
  return '# INTERFACEBENCH wiring CSV v1\r\n' + keys.join(',') + '\r\n' + rows.map(r => keys.map(k => val(r[k])).join(',')).join('\r\n');
}
export function pinmapHTML(project) {
  const rows = wiringRows(project);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(project.name)} pin map</title><style>body{font:14px system-ui;margin:30px;color:#183426}h1{font-size:28px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:8px;border-bottom:1px solid #bbc8bd}th{background:#edf3ed}@media print{thead{display:table-header-group}tr{break-inside:avoid}}</style><h1>${esc(project.name)}</h1><p>Assembly pin map · revision ${esc(project.revision)} · INTERFACEBENCH ${VERSION}</p><p>Declared assignments only. Verify hardware, current limits, polarity and external circuits before assembly.</p><table><thead><tr>${['Panel / reference', 'Terminal / role', 'Pin / signal', 'Voltage', 'Interface / notes'].map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.panel)} / ${esc(r.reference)}</td><td>${esc(r.terminal)} / ${esc(r.role)}</td><td>${esc(r.pin || 'UNASSIGNED')} / ${esc(r.signal)}</td><td>${r.voltage} V</td><td>${esc(r.driver)} ${esc(r.notes)}</td></tr>`).join('')}</tbody></table></html>`;
}
export function arduinoSketch(p) {
  const used = new Set(),
    lines = [],
    setup = [],
    loop = [];
  let unresolved = 0;
  const rows = wiringRows(p);
  for (const [i, r] of rows.entries()) {
    if (['power', 'ground', 'passive'].includes(r.role)) continue;
    const pin = p.controller.pins.find(pin => pin.id === r.pin);
    const base = (r.reference + '_' + r.terminal).replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
    let id = base;
    while (used.has(id)) id = base + '_' + i;
    used.add(id);
    if (!pin?.code || !pin.caps.includes(r.role)) {
      lines.push(`// UNRESOLVED ${id}: ${r.pin ? 'incompatible or missing pin code' : 'not assigned'}`);
      unresolved++;
      continue;
    }
    lines.push(`constexpr int PIN_${id} = ${pin.code};`);
    if (['digitalIn', 'analogIn'].includes(r.role)) {
      setup.push(`  pinMode(PIN_${id}, ${r.pullup === 'yes' && r.role === 'digitalIn' ? 'INPUT_PULLUP' : 'INPUT'});`);
      loop.push(`  const int value_${id} = ${r.role === 'analogIn' ? 'analogRead' : 'digitalRead'}(PIN_${id}); // active ${r.active}`);
    } else if (['digitalOut', 'pwm'].includes(r.role)) {
      setup.push(`  pinMode(PIN_${id}, OUTPUT);`, `  digitalWrite(PIN_${id}, ${r.active === 'low' ? 'HIGH' : 'LOW'}); // initial inactive level`);
      loop.push(`  // ${r.role === 'pwm' ? 'analogWrite' : 'digitalWrite'}(PIN_${id}, ...); // add application behavior`);
    } else lines.push(`// ${id}: ${r.role} bus signal. Add the appropriate device library and initialization.`);
  }
  const summary = runChecks(p).filter(f => f.key.startsWith('pin-') || f.key.startsWith('voltage') || f.key.startsWith('cap-')).length;
  return `/* INTERFACEBENCH ${VERSION} — ${safeName(p.name)} — revision ${safeName(p.revision)}\n * Assignment scaffolding only. Rehearsal rules are not firmware.\n * Target: ${safeName(p.controller.name)}. Requires Arduino core; no external libraries included.\n * ${unresolved} unresolved signal(s), ${summary} declared electrical conflict(s).\n * Check current limits, drivers, debounce and safety circuits before energizing hardware.\n */\n#include <Arduino.h>\n${unresolved || summary ? '#warning "Review unresolved assignments and electrical findings before use"\n' : ''}\n${lines.join('\n')}\n\nvoid setup() {\n${[...new Set(setup)].join('\n')}\n}\n\nvoid loop() {\n${loop.join('\n')}\n  delay(10);\n}\n`;
}
export async function pngExport(p, b, opts = {}) {
  const dpi = opts.dpi || 300,
    w = Math.round(b.w / 25.4 * dpi),
    h = Math.round(b.h / 25.4 * dpi);
  if (w * h > 24000000 || w > 16000 || h > 16000) throw Error('PNG exceeds 24 megapixels or 16,000 pixels on one side. Lower the DPI.');
  const source = svgExport(p, b, opts).replace(`width="${b.w}mm" height="${b.h}mm"`, `width="${w}" height="${h}"`);
  const url = URL.createObjectURL(new Blob([source], {
    type: 'image/svg+xml'
  }));
  try {
    const img = new Image();
    await new Promise((ok, no) => {
      img.onload = ok;
      img.onerror = () => no(Error('Artwork rasterization failed.'));
      img.src = url;
    });
    const can = document.createElement('canvas');
    can.width = w;
    can.height = h;
    can.getContext('2d').drawImage(img, 0, 0, w, h);
    return await new Promise((ok, no) => can.toBlob(b => b ? ok(b) : no(Error('PNG encoding failed.')), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
const mm = v => v * 72 / 25.4;
const ascii = s => String(s).replace(/[^\x20-\x7E]/g, '-');
function rgbHex(h) {
  const n = parseInt((h || '#000000').slice(1), 16);
  return globalThis.PDFLib.rgb((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
}
export async function pdfExport(project, panel, opts = {}) {
  const {
    PDFDocument,
    StandardFonts,
    rgb,
    pushGraphicsState,
    popGraphicsState,
    rectangle,
    clip,
    endPath,
    degrees
  } = globalThis.PDFLib;
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.setTitle(`${project.name} — ${panel.name} — Rev ${project.revision}`);
  pdf.setProducer(`INTERFACEBENCH ${VERSION}`);
  const tiled = opts.pdfMode !== 'sheet',
    pageW = tiled ? 210 : panel.w + 20,
    pageH = tiled ? 297 : panel.h + 62,
    usableW = pageW - 20,
    usableH = pageH - 62,
    overlap = 10,
    strideX = usableW - overlap,
    strideY = usableH - overlap,
    nx = tiled ? Math.max(1, Math.ceil((panel.w - overlap) / strideX)) : 1,
    ny = tiled ? Math.max(1, Math.ceil((panel.h - overlap) / strideY)) : 1;
  if (nx * ny > 400) throw Error('Template exceeds 400 pages. Use a smaller panel or actual-size sheet.');
  const items = scene(project, panel, opts);
  let count = 0;
  for (let row = 0; row < ny; row++) for (let col = 0; col < nx; col++) {
    if (opts.signal?.aborted) throw Error('Export canceled.');
    const page = pdf.addPage([mm(pageW), mm(pageH)]),
      ox = col * strideX,
      oy = row * strideY;
    const label = (s, x, y, size = 8) => page.drawSvgPath(pathData(commands(textShape(ascii(s), 0, 0, size / mm(1)))), {
      x: mm(x),
      y: mm(pageH - y),
      scale: mm(1),
      color: rgb(.12, .2, .14)
    });
    label(`${project.name.slice(0, 45)} / ${panel.name.slice(0, 30)} / Rev ${project.revision}`, 10, 10, 10);
    label(`${opts.side==='rear'?'REAR label fabrication':'FRONT fabrication view'} | tile ${col + 1},${row + 1} of ${nx}x${ny} | ${panel.w} x ${panel.h} mm`, 10, 16);
    label('PRINT AT 100% / ACTUAL SIZE. Disable Fit. Verify the calibration square.', 10, 21);
    page.pushOperators(pushGraphicsState(), rectangle(mm(9.8), mm(pageH - 27 - usableH - .2), mm(usableW + .4), mm(usableH + .4)), clip(), endPath());
    for (const item of items) {
      if (item.image) {
        const image = await (item.image.data.startsWith('data:image/jpeg') ? pdf.embedJpg(item.image.data) : pdf.embedPng(item.image.data));
        const pt = transform(0, item.h, item.transform);
        page.drawImage(image, {
          x: mm(10 - ox + pt.x),
          y: mm(pageH - 27 + oy - pt.y),
          width: mm(item.w),
          height: mm(item.h),
          rotate: degrees(-(item.transform.rotation || 0))
        });
      } else {
        const cs = worldCommands(item.shape, item.transform);
        page.drawSvgPath(pathData(cs), {
          x: mm(10 - ox),
          y: mm(pageH - 27 + oy),
          scale: mm(1),
          color: item.fill && item.fill !== 'none' ? rgbHex(item.fill) : undefined,
          borderColor: item.stroke && item.stroke !== 'none' ? rgbHex(item.stroke) : undefined,
          borderWidth: item.width || 0
        });
      }
    }
    // Shared physical crosshairs at every tile overlap corner, clipped to print window.
    if(opts.side!=='rear')for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < Math.ceil(panel.h / 40); iy++) {
      const x = ix * strideX + 5,
        y = iy * 40 + 5;
      page.drawSvgPath(`M ${x - 2} ${y} L ${x + 2} ${y} M ${x} ${y - 2} L ${x} ${y + 2}`, {
        x: mm(10 - ox),
        y: mm(pageH - 27 + oy),
        scale: mm(1),
        borderColor: rgb(.45, .45, .45),
        borderWidth: .12
      });
    }
    page.pushOperators(popGraphicsState());
    page.drawRectangle({
      x: mm(10),
      y: mm(8),
      width: mm(20),
      height: mm(20),
      borderColor: rgb(0, 0, 0),
      borderWidth: .4
    });
    label('20 x 20 mm', 34, pageH - 20);
    label(`Calibration | ${tiled ? '10 mm overlap' : 'single actual-size sheet'} | page ${++count}/${nx * ny}`, 34, pageH - 14);
    label(opts.side==='rear'?'Rear face up. Reflected placement; readable label paths. No cutting geometry.':`Cut allowance ${opts.fit || 0} mm/side. Text outlined. No printer color profile.`, 34, pageH - 8, 7);
    await new Promise(r => setTimeout(r, 0));
  }
  return await pdf.save();
}
export function buildSheet(p) {
  const findings = runChecks(p);
  return `INTERFACEBENCH ${VERSION}\n${p.name} — Revision ${p.revision}\n\nFABRICATION\nFront orientation; +X right / +Y down. Every panel uses its declared origin across SVG outputs.\nCheck dimensions on actual hardware. Generic part definitions are unverified.\nPrint PDF at 100%; measure its 20 mm calibration square.\nLabel on Front / Label on Rear controls fabrication on each face. Rear label artwork is positioned for rear-face-up marking: turn the panel left-to-right about its vertical centreline. Glyphs remain readable.\n\nLABEL SIDES\n${p.panels.map(b=>`${b.name}: `+b.components.map(c=>`${c.ref} front=${labelSides(c).front?'on':'off'} rear=${labelSides(c).rear?'on':'off'}`).join('; ')).join('\n')}\n\nPANELS\n${p.panels.map(b => `${b.name}: ${b.w} x ${b.h} x ${b.thickness} mm, ${b.material}, ${b.process}; ${b.depth} mm rear depth`).join('\n')}\n\nCOMPONENTS / QUANTITIES\n${p.panels.map(b => {
    const map = new Map();
    for (const c of b.components) {
      const k = c.definition.name;
      const g = map.get(k) || [];
      g.push(c.ref);
      map.set(k, g);
    }
    return `${b.name}\n` + [...map].map(([name, refs]) => `${refs.length} x ${name}: ${refs.join(', ')}`).join('\n');
  }).join('\n')}\nMounting holes are geometry only: select suitable screws, washers, nuts and spacers for actual material and thickness.\n\nFINDINGS (${findings.length})\n${findings.map(f => `[${f.severity.toUpperCase()} / ${f.confidence}] ${f.title}\n${f.explanation}\nAction: ${f.action}${f.acknowledgment ? '\nAcknowledged (unresolved): ' + f.acknowledgment : ''}`).join('\n\n')}\n\nASSUMPTIONS\n${p.assumptions.map(a => a.text).join('\n')}\n\nEVIDENCE\n${p.evidence.map(a => a.text + ' ' + (a.source || '')).join('\n')}\n`;
}
export async function fabricationZip(project, opts = {}, progress = () => {}) {
  const snapshot = clone(project),
    zip = new globalThis.JSZip(),
    files = [],
    manifest = {
      format: 'interfacebench-fabrication',
      version: 1,
      appVersion: VERSION,
      schema: SCHEMA,
      project: snapshot.name,
      revision: snapshot.revision,
      created: new Date().toISOString(),
      orientation: 'front files: +X right / +Y down; rear-label files: rear face up, X positions reflected about vertical centre, readable glyphs',
      options: {
        ...opts,
        signal: undefined
      },
      panels: snapshot.panels.map(b => ({
        name: b.name,
        widthMM: b.w,
        heightMM: b.h,
        origin: b.origin,
        labelSides: b.components.map(c=>({reference:c.ref,...labelSides(c)})),
        layers: opts.include || b.layers
      })),
      files: []
    };
  const add = async (name, data) => {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
    zip.file(name, bytes);
    const sha256 = globalThis.crypto?.subtle ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(n => n.toString(16).padStart(2, '0')).join('') : null;
    files.push({
      name,
      side: /-rear-labels\./.test(name)?'rear':/-front(?:-artwork)?\./.test(name)?'front':undefined,
      bytes: bytes.length,
      sha256
    });
  };
  let i = 0;
  for (const b of snapshot.panels) {
    if (opts.signal?.aborted) throw Error('Export canceled.');
    const stem = `${++i}-${safeName(b.name)}`;
    progress(`Exporting ${b.name} (${i}/${snapshot.panels.length})`);
    const artworkLayers=opts.include||Object.fromEntries(['uv','overlay','engrave','registration'].map(l=>[l,b.layers[l].export]));
    for(const side of ['front','rear']){
      if(side==='rear'&&!scene(snapshot,b,{side,include:opts.include}).length)continue;
      const faceOpts={...opts,side},suffix=side==='front'?'front':'rear-labels';
      if(opts.svg!==false)await add(`${stem}-${suffix}.svg`,svgExport(snapshot,b,faceOpts));
      if(opts.pdf!==false)await add(`${stem}-${suffix}.pdf`,await pdfExport(snapshot,b,faceOpts));
      if(opts.png!==false)await add(`${stem}-${side==='front'?'front-artwork':'rear-labels'}.png`,await pngExport(snapshot,b,{...faceOpts,include:artworkLayers}));
    }
  }
  if (opts.wiring !== false) {
    await add('wiring.csv', wiringCSV(snapshot));
    await add('pin-map.html', pinmapHTML(snapshot));
  }
  if (opts.code !== false) await add(`${safeName(snapshot.name)}/${safeName(snapshot.name)}.ino`, arduinoSketch(snapshot));
  await add('project.json', JSON.stringify(snapshot, null, 2));
  await add('build-sheet.txt', buildSheet(snapshot));
  manifest.files = files;
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  progress('Packing files…');
  if (opts.signal?.aborted) throw Error('Export canceled.');
  return {
    blob: await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE'
    }),
    snapshot,
    manifest,
    fingerprints: fingerprints(snapshot)
  };
}
export function download(data, name, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], {
    type
  });
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
