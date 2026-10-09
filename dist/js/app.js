import {exportPinnote,exportReflex,importCopperbench,importAssignments} from './interchange.js';
import {manufacturerParts,controllerProfiles,revisionInfo,nextRevision,revisionChanges,assignmentImpact,mergeLibrary,libraryDocument} from './catalog.js';
import {openingRows, terminalRows} from './definition-editor.js';
import { VERSION, SCHEMA, clone, uid, esc, layers, layerNames, roles, starterParts, newProject, newPanel, example, addComponent, parseUnit, formatUnit, objects, fingerprints, baselineDiff, designContent, stable, rect, circ, uno, instantiateDefinition } from './model.js';
import { setFont, objectBounds, transform, mirror, boxesOverlap, flatten, commands, inside, scene } from './geometry.js';
import { validateProject, validateDefinition, importSVG } from './validation.js';
import { ProjectStore } from './storage.js';
import { runChecks } from './checks.js';
import { Rehearsal } from './rehearsal.js';
import { renderCanvas, partIcon } from './canvas.js';
import { svgExport, pdfExport, pngExport, wiringCSV, pinmapHTML, arduinoSketch, fabricationZip, download, safeName, buildSheet } from './exports.js';
const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
export const app = {
  p: newProject(),
  panelId: null,
  selection: [],
  prefs: {
    units: 'mm',
    theme: 'dark',
    mode: 'easy',
    grid: 5,
    snap: true,
    fine: .5,
    coarse: 5,
    envelopes: false,
    leftWidth: 230,
    rightWidth: 285
  },
  stage: 'arrange',
  side: 'front',
  tool: 'select',
  view: {
    x: -35,
    y: -30,
    w: 310,
    h: 210
  },
  past: [],
  future: [],
  library: clone([...starterParts,...manufacturerParts]),
  checks: [],
  inspectorTab: 'inspect',
  compare: null,
  sim: null,
  measure: [],
  history: [],
  get panel() {
    return this.p.panels.find(p => p.id === this.panelId) || this.p.panels[0];
  }
};
let store = new ProjectStore(),
  storageOK = false,
  saveTimer,
  saveChain = Promise.resolve(),
  dirty = false,
  changeCounter = 0,
  lastError = '',
  walk = 0,
  waitingWorker,
  exportAbort;
const fields = html => `<div class="fields">${html}</div>`;
function field(label, key, value, type = 'text', options = '') {
  return `<div class="field"><label for="f-${key}">${esc(label)}</label>${type === 'select' ? `<select id="f-${key}" data-field="${key}">${options}</select>` : `<input id="f-${key}" data-field="${key}" type="${type}" value="${esc(value)}" ${type === 'number' ? 'step="any"' : ''}>`}</div>`;
}
function options(values, current) {
  return values.map(v => {
    const [value, label] = Array.isArray(v) ? v : [v, v];
    return `<option value="${esc(value)}" ${value === current ? 'selected' : ''}>${esc(label)}</option>`;
  }).join('');
}
function btn(label, action, cls = '', attrs = '') {
  return `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
}
const unit = n => formatUnit(n, app.prefs.units);
function notice(text, error = false) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => $('#toast').classList.remove('visible'), error ? 9000 : 3500);
}
function saveState(s, err = false) {
  $('#saveState').textContent = s;
  $('#saveState').classList.toggle('error', err);
}
function mark() {
  dirty = true;
  changeCounter++;
  saveState('○ Unsaved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(), 450);
}
async function save() {
  clearTimeout(saveTimer);
  if (!dirty) return;
  if (!storageOK) {
    saveState('! Backup needed', true);
    return;
  }
  const p = clone(app.p),
    serial = changeCounter;
  saveState('◌ Saving…');
  const task = saveChain.catch(() => {}).then(() => store.save(p));
  saveChain = task;
  try {
    await task;
    await store.put('settings', {
      id: 'last',
      value: p.id
    });
    if (serial === changeCounter) {
      dirty = false;
      saveState('● Saved locally');
    } else if (dirty) {
      saveState('○ Unsaved');
    }
    lastError = '';
  } catch (e) {
    saveState('! Save failed', true);
    if (lastError !== e.message) {
      notice(e.message + ' Download a backup to protect this work.', true);
      lastError = e.message;
    }
  }
}
function mutate(label, fn) {
  if (app.sim && !['edit rehearsal rules', 'edit initial variables'].includes(label)) throw Error('Leave Rehearse before changing the design.');
  const before = clone(app.p);
  try {
    fn();
    app.p = validateProject(app.p);
    if (stable(designContent(before)) === stable(designContent(app.p)) && stable(before.baselines) === stable(app.p.baselines) && stable(before.acknowledgments) === stable(app.p.acknowledgments)) return;
    app.past.push({
      p: before,
      label
    });
    if (app.past.length > 40) app.past.shift();
    app.future = [];
    app.p.modified = new Date().toISOString();
    mark();
    app.checks = runChecks(app.p);
    render();
  } catch (e) {
    app.p = before;
    render();
    notice(e.message, true);
    throw e;
  }
}
function undo(redo = false) {
  const from = redo ? app.future : app.past,
    to = redo ? app.past : app.future;
  if (!from.length) return;
  const s = from.pop();
  to.push({
    p: clone(app.p),
    label: s.label
  });
  app.p = s.p;
  app.selection = app.selection.filter(id => objects(app.panel).some(o => o.id === id));
  mark();
  app.checks = runChecks(app.p);
  render();
  notice(`${redo ? 'Redid' : 'Undid'} ${s.label}`);
}
async function prefsSave() {
  applyPrefs();
  if (storageOK) await store.put('settings', {
    id: 'preferences',
    value: app.prefs
  }).catch(() => notice('Workspace preferences could not be saved.', true));
}
function applyPrefs() {
  document.documentElement.dataset.theme = app.prefs.theme;
  document.body.classList.toggle('advanced', app.prefs.mode === 'advanced');
  document.documentElement.style.setProperty('--left-width', app.prefs.leftWidth + 'px');
  document.documentElement.style.setProperty('--right-width', app.prefs.rightWidth + 'px');
  $('#mode').value = app.prefs.mode;
  $('#theme').value = app.prefs.theme;
  $('#units').value = app.prefs.units;
  $('#snap').checked = app.prefs.snap;
}
function fit(selection = false) {
  let b = {
    x: 0,
    y: 0,
    w: app.panel.w,
    h: app.panel.h
  };
  if (selection && app.selection.length) {
    const bs = objects(app.panel).filter(o => app.selection.includes(o.id)).map(o => objectBounds(o, app.p));
    const x = Math.min(...bs.map(b => b.x)),
      y = Math.min(...bs.map(b => b.y));
    b = {
      x,
      y,
      w: Math.max(...bs.map(b => b.x + b.w)) - x,
      h: Math.max(...bs.map(b => b.y + b.h)) - y
    };
    if (app.side === 'rear') b.x = app.panel.w - b.x - b.w;
  }
  const svg = $('#canvas'),
    aspect = (svg.clientWidth || 800) / (svg.clientHeight || 500);
  let w = b.w + 60,
    h = b.h + 55;
  if (w / h < aspect) w = h * aspect;else h = w / aspect;
  app.view = {
    x: b.x + b.w / 2 - w / 2,
    y: b.y + b.h / 2 - h / 2,
    w,
    h
  };
  renderCanvas(app);
}
function setStage(stage) {
  app.stage = stage;
  app.findingIds = [];
  if (stage === 'rehearse') {
    app.sim = new Rehearsal(app.p);
    app.side = 'front';
  } else app.sim = null;
  if (stage === 'define') {
    app.selection = [];
    app.inspectorTab = 'inspect';
    showInspector();
  }
  render();
  requestAnimationFrame(() => fit());
}
function showInspector() {
  document.body.classList.add('show-inspector');
  document.body.classList.remove('show-browser-mobile');
}
function select(ids, {
  toggle = false
} = {}) {
  if (toggle) {
    for (const id of ids) app.selection = app.selection.includes(id) ? app.selection.filter(x => x !== id) : [...app.selection, id];
  } else app.selection = ids;
  app.findingIds = [];
  app.inspectorTab = 'inspect';
  renderCanvas(app);
  renderRight();
  renderLeft();
  renderStatus();
}
function render() {
  applyPrefs();
  document.body.dataset.stage = app.stage;
  document.body.classList.toggle('rehearsing', !!app.sim);
  $('#projectName').textContent = app.p.name;
  $('#revision').textContent = 'REV ' + app.p.revision;
  $('#version').textContent = 'v' + VERSION;
  $('#environment').textContent = `${navigator.onLine ? 'LOCAL-FIRST' : 'OFFLINE'} · ${app.p.panels.length} PANEL${app.p.panels.length > 1 ? 'S' : ''}`;
  $('#stages').innerHTML = ['define', 'arrange', 'connect', 'rehearse', 'fabricate'].map((s, i) => btn(`<span class="number">0${i + 1}</span>${s[0].toUpperCase() + s.slice(1)}`, 'stage', s === app.stage ? 'active' : '', `data-stage="${s}"`)).join('');
  $('#undo').disabled = !app.past.length;
  $('#redo').disabled = !app.future.length;
  $('#front').classList.toggle('active', app.side === 'front');
  $('#rear').classList.toggle('active', app.side === 'rear');
  $('#selectTool').classList.toggle('active', app.tool === 'select');
  $('#panTool').classList.toggle('active', app.tool === 'pan');
  $('#measureTool').classList.toggle('active', app.tool === 'measure');
  renderLeft();
  renderRight();
  renderSurface();
  renderCanvas(app);
  renderStatus();
}
function renderStatus() {
  const s = app.selection.map(id => objects(app.panel).find(o => o.id === id)).filter(Boolean);
  $('#selectionStatus').textContent = s.length ? s.map(o => o.ref || o.text || o.type).join(' + ') + ' · ' + app.prefs.units : 'Select a part or add one from the library';
  $('#dimensions').textContent = `${unit(app.panel.w)} × ${unit(app.panel.h)} × ${unit(app.panel.thickness)} ${app.prefs.units}`;
  $('#zoomLabel').textContent = Math.round(app.panel.w / app.view.w * 100) + '%';
}
function renderLeft() {
  const b = app.panel;
  let html = `<div class="left-section"><div class="section-label">PANELS ${btn('+ Add', 'add-panel', 'small')}</div>${app.p.panels.map(p => `<button class="panel-tab ${p.id === b.id ? 'active' : ''}" data-action="panel" data-id="${p.id}"><span class="panel-icon"><i></i><i></i><i></i></span><span><strong>${esc(p.name)}</strong><small>${unit(p.w)} × ${unit(p.h)} ${app.prefs.units}</small></span></button>`).join('')}<div class="row">${btn('Panel settings', 'panel-settings', 'small')}${btn('Projects', 'home', 'small')}</div></div>`;
  if (app.stage === 'rehearse') {
    html += `<div class="left-section"><div class="section-label">LIVE VARIABLES</div>${Object.entries(app.sim.variables).map(([k, v]) => `<div class="value-line"><span>${esc(k)}</span><strong>${+v.toFixed(2)}</strong></div>`).join('')}<div class="note">Interaction rehearsal. Geometry and wiring are unchanged. This is not hardware or safety validation.</div>${btn('↺ Reset rehearsal', 'reset-sim', 'wide')}<div class="row" style="margin-top:9px">${btn('Edit rules', 'rules', 'small')}${btn('Initial values', 'variables', 'small')}</div></div><div class="left-section"><div class="section-label">EVENT TRACE</div><div class="trace">${esc(app.sim.trace.join('\n') || 'Operate a control to begin.')}</div></div>`;
  } else html += `<div class="left-section"><div class="section-label">COMPONENT LIBRARY ${btn('＋', 'custom-new', 'small', 'title="Create a custom part"')}</div><input class="search" id="partSearch" placeholder="Search parts…" aria-label="Search component library"><div class="part-grid" id="partGrid">${partsHTML('')}</div><div class="library-legend"><span>GENERIC + SOURCED PARTS</span><span>CLICK TO PLACE</span></div><details><summary>Manage custom library</summary><div class="row">${btn('Import', 'library-import', 'small')}${btn('Export', 'library-export', 'small')}</div></details></div>`;
  html += `<div class="left-section"><div class="section-label">OBJECTS <span>${objects(b).length}</span></div><input class="search" id="objectSearch" placeholder="Find a reference or label…" aria-label="Search objects"><div class="object-list" id="objectList">${objectList('')}</div><div class="row" style="margin-top:10px">${!app.sim ? btn('+ Artwork', 'artwork', 'small') + btn('Arrange', 'arrange', 'small') : ''}</div></div><div class="left-section"><div class="section-label">LAYERS <span>VIEW / LOCK / EXPORT</span></div>${layers.map(l => `<div class="layer-row"><input type="checkbox" aria-label="Show ${layerNames[l]}" data-layer="${l}" data-layer-key="visible" ${b.layers[l].visible ? 'checked' : ''}><em>${esc(layerNames[l])}</em><button data-action="layer-lock" data-layer="${l}" title="${b.layers[l].locked ? 'Unlock' : 'Lock'} ${layerNames[l]}">${b.layers[l].locked ? '▣' : '□'}</button><input type="checkbox" aria-label="Export ${layerNames[l]}" data-layer="${l}" data-layer-key="export" ${b.layers[l].export ? 'checked' : ''}></div>`).join('')}<p class="help-text">Hiding a layer only changes the canvas. Export uses the rightmost checkboxes.</p></div><div class="left-section"><div class="row">${btn('Baselines', 'baselines', 'small')}${btn('Recovery', 'recovery', 'small')}</div><div class="row advanced-only" style="margin-top:8px">${btn('Assumptions & evidence', 'registers', 'small wide')}</div></div>`;
  $('#leftContent').innerHTML = html;
}
function partsHTML(q) {
  return app.library.filter(d => (d.name+' '+(d.manufacturer||'')).toLowerCase().includes(q.toLowerCase())).map(d => `<button class="part" data-action="add-part" data-id="${esc(d.id)}" title="Add ${esc(d.name)}">${partIcon(d)}${esc(d.name)}</button>`).join('') || '<p class="empty">No matching parts.</p>';
}
function objectList(q) {
  return objects(app.panel).filter(o => `${o.ref || ''} ${o.label || o.text || o.type}`.toLowerCase().includes(q.toLowerCase())).map(o => `<button class="object-row ${app.selection.includes(o.id) ? 'active' : ''}" data-action="select-object" data-id="${o.id}" aria-pressed="${app.selection.includes(o.id)}"><span class="ref">${esc(o.ref || 'ART')}</span><span>${o.locked ? '▣ ' : ''}${esc(o.label || o.text || o.type || o.definition.name)}</span></button>`).join('') || '<div class="empty"><strong>Your blank canvas.</strong>Add a component to begin.</div>';
}
function panelInspector() {
  const b = app.panel;
  return `<div class="eyebrow">DEFINE YOUR SURFACE</div><h2>${esc(b.name)}</h2><p class="subtitle">Physical dimensions. Presentation units: ${app.prefs.units}.</p>${field('Project name', 'project.name', app.p.name)}${fields(field('Panel name', 'panel.name', b.name) + field('Revision', 'project.revision', app.p.revision))}${field('Outline shape', 'panel.shape', b.shape, 'select', options([['rounded', 'Rounded rectangle'], ['rect', 'Rectangle'], ['circle', 'Circle'], ['imported', 'Imported SVG polygon']], b.shape))}${fields(field('Width / diameter', 'panel.w', unit(b.w)) + field('Height', 'panel.h', unit(b.h)) + field('Thickness', 'panel.thickness', unit(b.thickness)) + field('Corner radius', 'panel.radius', unit(b.radius)))}${field('Material', 'panel.material', b.material)}${field('Panel color', 'panel.color', b.color, 'color')}${field('Fabrication process', 'panel.process', b.process)}<div class="section"><h3>Behind the panel</h3>${fields(field('Available depth', 'panel.depth', unit(b.depth)) + field('Minimum edge spacing', 'panel.edge', unit(b.edge)))}</div><div class="advanced-only">${field('Fabrication origin', 'panel.origin', b.origin, 'select', options([['top-left', 'Top left'], ['center', 'Panel centre'], ['bottom-left', 'Bottom left']], b.origin))}<p class="help-text">+X right, +Y down. SVG viewBox represents the selected origin; rear view never changes export orientation.</p></div><div class="row">${btn('Import outline', 'outline-import', 'small')}${btn('Mounting pattern', 'mount-pattern', 'small')}</div><div class="section"><h3>Workspace</h3>${fields(field('Grid spacing', 'prefs.grid', unit(app.prefs.grid)) + field('Fine nudge', 'prefs.fine', unit(app.prefs.fine)))}<div class="advanced-only">${field('Coarse nudge', 'prefs.coarse', unit(app.prefs.coarse))}</div><label class="checkline"><input type="checkbox" id="envelopes" ${app.prefs.envelopes ? 'checked' : ''}> Show access envelopes</label></div>${app.p.panels.length > 1 ? `<div class="section">${btn('Delete this panel', 'delete-panel', 'danger wide')}</div>` : ''}`;
}
function renderRight() {
  const selected = objects(app.panel).filter(o => app.selection.includes(o.id));
  $('#checkCount').textContent = app.checks.length;
  $('#inspectTab').classList.toggle('active', app.inspectorTab === 'inspect');
  $('#checksTab').classList.toggle('active', app.inspectorTab === 'checks');
  let html;
  if (app.inspectorTab === 'checks') {
    html = `<div class="eyebrow">FIT & DECLARED CONNECTIONS</div><h2>${app.checks.filter(f => f.severity === 'error').length} errors · ${app.checks.filter(f => f.severity === 'warning').length} warnings</h2><p class="subtitle">Confidence is shown per finding. Acknowledgments remain unresolved.</p><select id="checkFilter" class="wide" aria-label="Filter findings">${options(['all', 'error', 'warning', 'info', 'unacknowledged'], app.checkFilter || 'all')}</select><p class="help-text">Rear and access checks use conservative bounding boxes. Contours are sampled. No circuit or material-strength validation.</p>${app.checks.filter(f => !app.checkFilter || app.checkFilter === 'all' || (app.checkFilter === 'unacknowledged' ? !f.acknowledgment : f.severity === app.checkFilter)).map(f => `<article class="finding ${f.severity}"><span class="tag">${esc(f.severity)} · ${esc(f.confidence)} confidence</span><h3>${esc(f.title)}</h3><p>${esc(f.explanation)}</p><p>${esc(f.action)}</p>${f.acknowledgment ? `<p>Acknowledged: ${esc(f.acknowledgment)}</p>` : ''}<div class="row">${btn('Locate', 'finding', '', `data-id="${esc(f.key)}"`)}${btn(f.acknowledgment ? 'Edit reason' : 'Acknowledge', 'ack', '', `data-id="${esc(f.key)}"`)}</div></article>`).join('') || '<div class="empty">No findings in this filter. Unmodeled relationships have not been validated.</div>'}`;
  } else if (app.sim) {
    const o = selected[0];
    html = `<div class="eyebrow">INTERACTION REHEARSAL</div><h2>${esc(o?.ref || 'Operate your panel')}</h2><p class="subtitle">${esc(o?.label || 'Select a control on the panel or in the object list.')}</p>${o && ['pot', 'encoder'].includes(o.definition?.kind) ? `<label class="field">Value (0–100)<input id="simRange" type="range" min="0" max="100" value="${app.sim.values[o.id] || 0}"></label>` : ''}${o?.definition?.kind === 'button' ? `<div class="row">${btn('Press', 'sim-press')}${btn('Release', 'sim-release')}</div>` : ''}${o?.definition?.kind === 'toggle' ? btn('Toggle', 'sim-toggle', 'wide') : ''}<div class="note">${o ? 'Current value: ' + esc(app.sim.values[o.id] || 0) : 'Rehearsal preserves design geometry.'}<br>${esc(o ? app.sim.displays[o.id] || '' : '')}</div><div class="row">${btn('Reset', 'reset-sim')}${btn('Edit rules', 'rules')}</div><p class="help-text">Simulation only. A Stop control here is not a safety-rated stopping system.</p>`;
  } else if (!selected.length) html = panelInspector();else if (selected.length > 1) html = `<div class="eyebrow">MULTIPLE SELECTION</div><h2>${selected.length} objects</h2><p class="subtitle">Numeric edits are available individually. Arrange these objects as a set.</p><div class="row">${btn('Arrange…', 'arrange', 'primary')}${btn('Duplicate', 'duplicate')}</div><div class="section"><div class="row">${btn('Group', 'group')}${btn('Ungroup', 'ungroup')}</div><div class="row" style="margin-top:8px">${btn('Lock / unlock', 'lock')}${btn('Delete', 'delete', 'danger')}</div></div><p class="help-text">Shift-click to add or remove a selection. Arrow keys nudge; Shift uses the coarse increment. Two selected centres show a dimension on the canvas.</p>`;else {
    const o = selected[0];
    html = `<div class="eyebrow">${o.definition ? 'COMPONENT / ' + esc(o.definition.kind) : 'ARTWORK / ' + esc(o.type)}</div><div class="inspector-title"><h2>${esc(o.ref || o.type)}</h2><span class="pill">${o.locked ? 'LOCKED' : 'SELECTED'}</span></div><p class="subtitle">${esc(o.definition?.name || 'Edit geometry and fabrication intent')}</p>${fields(field('X position', 'object.x', unit(o.x)) + field('Y position', 'object.y', unit(o.y)) + field('Rotation °', 'object.rotation', o.rotation, 'number') + (o.definition ? field('Reference', 'object.ref', o.ref) : ''))}`;
    if (o.definition) {
      html += `${field('Label', 'object.label', o.label)}${fields(field('Label X offset', 'object.labelX', unit(o.labelX)) + field('Label Y offset', 'object.labelY', unit(o.labelY)) + field('Label size', 'object.labelSize', unit(o.labelSize)) + field('Face color', 'object.color', o.color, 'color'))}${field('Label layer', 'object.layer', o.layer, 'select', options(layers.map(l => [l, layerNames[l]]), o.layer))}<div class="section"><h3>Physical definition</h3><p class="help-text">${o.definition.verified ? '✓ Measured / verified by user' : o.definition.provenance?.status==='manufacturer-sourced' ? '◇ Sourced dimensions · clearance assumptions' : '△ Dimensions unverified'}<br>Rear depth ${unit(o.definition.depth)} ${app.prefs.units} · Mount ${unit(o.definition.minThickness)}–${unit(o.definition.maxThickness)} ${app.prefs.units}</p><div class="row">${btn('Edit definition', 'edit-definition', 'small')}${btn('Replace part', 'replace', 'small')}</div><div class="row" style="margin-top:8px">${btn('Save to library', 'save-library', 'small')}${btn('Check revisions', 'library-updates', 'small')}${btn('Datasheet / photo', 'part-evidence', 'small')}</div></div>`;
      if (app.sim) {
        const k = o.definition.kind;
        html += `<div class="section"><h3>Operate ${esc(o.ref)}</h3>${['pot', 'encoder'].includes(k) ? `<label class="field">Value (0–100)<input id="simRange" type="range" min="0" max="100" value="${app.sim.values[o.id] || 0}"></label>` : k === 'button' ? `<div class="row">${btn('Press', 'sim-press')}${btn('Release', 'sim-release')}</div>` : k === 'toggle' ? btn('Toggle', 'sim-toggle', 'wide') : ''}<p class="help-text">Current: ${esc(app.sim.displays[o.id] || app.sim.values[o.id] || 0)}</p></div>`;
      }
    } else {
      if (['text', 'plate'].includes(o.type)) html += field('Text', 'object.text', o.text) + field('Font size', 'object.size', unit(o.size));
      if (['line', 'border', 'plate', 'linear', 'image', 'symbol'].includes(o.type)) html += fields(field('Width', 'object.w', unit(o.w)) + field('Height', 'object.h', unit(o.h || 0)));
      if (['rotary', 'border'].includes(o.type)) html += field('Radius', 'object.r', unit(o.r));
      if (['rotary', 'linear'].includes(o.type)) html += fields(field('Tick count', 'object.count', o.count, 'number') + field('Stroke width', 'object.stroke', unit(o.stroke)));
      if (['rotary','linear'].includes(o.type)) html += btn('Ticks & legends…','legend','wide small');
      if (o.type === 'rotary') html += fields(field('Start angle °', 'object.start', o.start, 'number') + field('End angle °', 'object.end', o.end, 'number'));
      html += field('Ink color', 'object.color', o.color || '#233b2b', 'color') + field('Fabrication layer', 'object.layer', o.layer, 'select', options(layers.filter(l => !['outline'].includes(l)).map(l => [l, layerNames[l]]), o.layer));
      html += `<div class="row">${btn('Move forward', 'forward', 'small')}${btn('Move backward', 'backward', 'small')}</div>`;
    }
    html += `<div class="section"><div class="row">${btn('Duplicate', 'duplicate')}${btn('Rotate 90°', 'rotate')}</div><div class="row" style="margin-top:8px">${btn(o.locked ? 'Unlock' : 'Lock', 'lock')}${btn('Delete', 'delete', 'danger')}</div></div>`;
  }
  $('#rightContent').innerHTML = html;
}
function renderSurface() {
  const el = $('#stageSurface');
  el.hidden = !['connect', 'fabricate'].includes(app.stage);
  if (app.stage === 'connect') {
    el.innerHTML = `<div class="surface-head"><h2>Connect the panel.</h2>${btn('Controller & pins', 'controller', 'small')}${btn('App handoffs','interchange','small')}<input id="wireSearch" class="search" style="width:200px;margin:0" placeholder="Search connections…" aria-label="Search wiring"></div><p class="help-text">${esc(app.p.controller.name)} · ${app.p.controller.pins.length} declared pins. Empty assignments do not block panel fabrication.</p><div class="table-wrap"><table><thead><tr><th><button data-action="sort-wires">REFERENCE ${app.wireReverse ? '↓' : '↑'}</button></th><th>TERMINAL / ROLE</th><th>PIN</th><th>SIGNAL</th><th>BUS</th><th>PULL-UP</th><th>ACTIVE LOW</th><th>DETAILS</th></tr></thead><tbody id="wireBody">${wireTable('')}</tbody></table></div>`;
  } else if (app.stage === 'fabricate') {
    const errors = app.checks.filter(f => f.severity === 'error').length;
    el.innerHTML = `<div class="surface-head"><h2>Ready for the workbench.</h2><span class="pill">REV ${esc(app.p.revision)} · FRONT</span></div><p class="help-text">Every file in a package comes from one frozen snapshot. Canvas visibility and rear view do not change fabrication orientation.</p><div class="export-grid"><div class="export-card"><h3>Physical outputs</h3><label class="checkline"><input type="checkbox" id="out-svg" checked> Layered SVG · outlined text</label><label class="checkline"><input type="checkbox" id="out-pdf" checked> Actual-size PDF template</label><select id="pdfMode" aria-label="PDF paper format"><option value="tile">A4 tiles · 10 mm overlap</option><option value="sheet">One actual-size sheet</option></select><p class="help-text">100% scale, registration crosses and 20 mm calibration square.</p><label class="checkline"><input type="checkbox" id="out-png" checked> Transparent artwork PNG</label><label class="field">Resolution (DPI)<select id="dpi"><option>150</option><option selected>300</option><option>600</option></select></label></div><div class="export-card"><h3>Assembly & archive</h3><label class="checkline"><input type="checkbox" id="out-wiring" checked> Wiring CSV & pin-map document</label><label class="checkline"><input type="checkbox" id="out-code" checked> Arduino assignment scaffolding</label><p>Project JSON, build sheet and a file manifest are always included. Generic geometry needs physical verification.</p><div class="note">${app.p.panels.map(b => `${esc(b.name)} · ${unit(b.w)} × ${unit(b.h)} ${app.prefs.units}`).join('<br>')}</div></div></div><details class="advanced-only"><summary>Fit allowance & output inclusion</summary><p class="help-text">Fit allowance expands opening geometry per side. It is not automatic kerf compensation. Circles and rectangles only; unsupported shapes stop export.</p><label class="field">Opening allowance per side (mm)<input id="fitAllowance" type="number" step="0.01" value="0" min="-5" max="5"></label><p class="help-text">Each panel uses its export-layer checkboxes. PNG includes only selected engraving, UV, overlay and registration layers. Reference is omitted unless selected for SVG/PDF.</p></details><div class="note ${errors ? 'warning' : ''}">${errors ? `${errors} error findings need review. ` : ''}${app.checks.length} findings, including unverified dimensions. ${btn('Review checks', 'checks-tab', 'small')}</div><div class="export-actions">${btn('↓ Create fabrication ZIP', 'export-zip', 'primary')}${btn('SVG', 'export-svg')}${btn('PDF', 'export-pdf')}${btn('PNG', 'export-png')}${btn('JSON', 'backup')}${btn('App handoffs','interchange')}</div><details><summary>Export history & freshness</summary><div id="historyList">${historyHTML()}</div></details>`;
  }
}
function wireTable(q) {
  const rows = app.p.panels.flatMap(b => b.components.flatMap(c => c.definition.terminals.map(t => ({
    b,
    c,
    t,
    n: app.p.connections.find(n => n.component === c.id && n.terminal === t.id)
  })))).filter(({
    c,
    t,
    n
  }) => `${c.ref} ${t.name} ${n?.signal || ''} ${n?.pin || ''}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.c.ref.localeCompare(b.c.ref, undefined, {
    numeric: true
  }) * (app.wireReverse ? -1 : 1));
  return rows.map(({
    c,
    t,
    n
  }) => `<tr class="${app.selection.includes(c.id) ? 'selected-row' : ''}"><td>${btn(esc(c.ref), 'select-wire', 'small', `data-id="${c.id}"`)}</td><td>${esc(t.name)}<small style="display:block">${esc(t.role)} · ${t.voltage} V</small></td><td><select data-wire="pin" data-component="${c.id}" data-terminal="${esc(t.id)}" aria-label="${esc(c.ref + '.' + t.name)} pin">${options([['', 'Unassigned'], ...app.p.controller.pins.map(p => [p.id, p.id])], n?.pin || '')}</select></td><td><input data-wire="signal" data-component="${c.id}" data-terminal="${esc(t.id)}" aria-label="${esc(c.ref + '.' + t.name)} signal" value="${esc(n?.signal || '')}"></td><td><input data-wire="bus" data-component="${c.id}" data-terminal="${esc(t.id)}" aria-label="${esc(c.ref + '.' + t.name)} bus" value="${esc(n?.bus || '')}"></td><td><input type="checkbox" data-wire="pullup" data-component="${c.id}" data-terminal="${esc(t.id)}" aria-label="${esc(c.ref + '.' + t.name)} pull-up" ${n?.pullup ? 'checked' : ''}></td><td><input type="checkbox" data-wire="activeLow" data-component="${c.id}" data-terminal="${esc(t.id)}" aria-label="${esc(c.ref + '.' + t.name)} active low" ${n?.activeLow ? 'checked' : ''}></td><td>${btn('Edit', 'wire-detail', 'small', `data-component="${c.id}" data-terminal="${esc(t.id)}"`)}</td></tr>`).join('');
}
function historyHTML() {
  const fps = fingerprints(app.p);
  return app.history.filter(h => h.projectId === app.p.id).slice(-8).reverse().map(h => `<div class="note"><strong>${esc(h.name)}</strong><p>${new Date(h.date).toLocaleString()} · ${['geometry', 'artwork', 'wiring'].map(k => `${k}: ${h.fingerprints[k] === fps[k] ? 'current' : 'changed'}`).join(' · ')}</p></div>`).join('') || '<p class="help-text">No fabrication exports recorded for this project.</p>';
}
function modal(title, body, {
  large = false,
  form,
  submit = 'Apply'
} = {}) {
  const d = $('#dialog');
  $('#dialogContent').innerHTML = `<div class="modal ${large ? 'large' : ''}"><div class="modal-head"><h2>${esc(title)}</h2>${btn('×', 'close', '', 'aria-label="Close dialog"')}</div>${form ? `<form data-form="${form}">` : ''}${body}<div class="form-error" role="alert"></div>${form ? `<div class="actions">${btn('Cancel', 'close')}<button type="submit" class="primary">${esc(submit)}</button></div></form>` : ''}</div>`;
  if (!d.open) d.showModal();
  setTimeout(() => d.querySelector('input,select,textarea,button')?.focus(), 0);
}
function mf(label, name, value, type = 'text', opts = '') {
  return `<div class="field"><label for="m-${name}">${esc(label)}</label>${type === 'textarea' ? `<textarea id="m-${name}" name="${name}" rows="5">${esc(value)}</textarea>` : type === 'select' ? `<select id="m-${name}" name="${name}">${opts}</select>` : `<input id="m-${name}" name="${name}" type="${type}" value="${esc(value)}" ${type === 'number' ? 'step="any"' : ''}>`}</div>`;
}
$('#dialog').addEventListener('cancel', () => {
  if (exportAbort) exportAbort.abort();
});
function close() {
  if (exportAbort) exportAbort.abort();
  $('#dialog').close();
}
async function openProject(p, {
  fresh = false
} = {}) {
  await save();
  if (dirty) {
    download(JSON.stringify(app.p, null, 2), safeName(app.p.name) + '-unsaved-backup.json', 'application/json');
    notice('A backup of the unsaved project was downloaded before switching.');
  }
  app.p = validateProject(clone(p));
  app.hasProject = true;
  if (fresh) {
    app.p.id = uid();
    app.p.name = p.name;
  }
  app.panelId = app.p.panels[0].id;
  app.selection = [];
  app.past = [];
  app.future = [];
  app.compare = null;
  app.stage = 'arrange';
  app.side = 'front';
  app.sim = null;
  app.checks = runChecks(app.p);
  mark();
  close();
  render();
  requestAnimationFrame(() => fit());
}
async function home() {
  await save();
  const projects = storageOK ? await store.all('projects') : [];
  const d = $('#dialog');
  $('#dialogContent').innerHTML = `<div class="welcome"><div class="eyebrow">A GREEN SHOE GARAGE FIELD INSTRUMENT</div><div class="row"><h1>Give your<br>contraption a face.</h1>${app.hasProject ? btn('×', 'close', '', 'aria-label="Return to editor"') : ''}</div><p>Bring controls, materials, graphics and connections together. Design the panel. Rehearse the idea. Make something real.</p><div class="welcome-options">${btn('New panel <span>Start with a blank surface.<br>Make it your own.</span>', 'new', 'primary')}${btn('Explore an example <span>A kinetic sculpture controller.<br>Ready to take apart.</span>', 'example')}${btn('Open project <span>Pick up where you left off.<br>Import a project JSON.</span>', 'open')}</div>${projects.length ? `<div class="project-list"><div class="section-label">SAVED ON THIS DEVICE</div>${projects.sort((a, b) => b.date.localeCompare(a.date)).map(r => btn(`<span>${esc(r.project.name)}</span><small>Rev ${esc(r.project.revision)} · ${new Date(r.date).toLocaleDateString()}</small>`, 'load', '', `data-id="${r.id}"`)).join('')}</div>` : ''}<div class="row" style="margin-top:25px"><small>Local-first. No account. No telemetry.</small>${btn('Diagnostic example', 'diagnostic', 'small')}</div></div>`;
  if (!d.open) d.showModal();
}
function addPart(id) {
  const d = app.library.find(d => d.id === id);
  if (!d) return;
  let c;
  mutate('add component', () => {
    c = addComponent(app.p, app.panel, d, Math.round(app.panel.w / 2 / app.prefs.grid) * app.prefs.grid, Math.round(app.panel.h / 2 / app.prefs.grid) * app.prefs.grid);
  });
  select([c.id]);
  showInspector();
  document.body.classList.remove('show-browser-mobile');
  app.hasProject = true;
}
function duplicateSelected(pattern) {
  const selected = objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked);
  if (!selected.length) return notice('Select unlocked objects first.');
  const ids = [];
  mutate('duplicate objects', () => {
    const count = pattern?.count || 1;
    for (let i = 1; i <= count; i++) {
      const group = uid();
      for (const o of selected) {
        const c = clone(o);
        c.id = uid();
        c.group = o.group ? group : null;
        let dx = pattern?.dx ?? 10,
          dy = pattern?.dy ?? 10;
        if (pattern?.type === 'circle') {
          const a = i * 2 * Math.PI / (count + 1),
            a0 = 0;
          c.x = pattern.cx + pattern.radius * Math.cos(a);
          c.y = pattern.cy + pattern.radius * Math.sin(a);
          c.rotation = o.rotation + (pattern.rotate ? i * 360 / (count + 1) : 0);
        } else {
          c.x += dx * i;
          c.y += dy * i;
        }
        if (c.definition) {
          let n = 1,
            base = c.definition.prefix;
          while (app.p.panels.some(b => b.components.some(x => x.ref === base + n))) n++;
          c.ref = base + n;
          app.panel.components.push(c);
        } else app.panel.artwork.push(c);
        ids.push(c.id);
      }
    }
  });
  select(ids);
}
function artworkDialog() {
  modal('Add artwork', `<p>Artwork stays in physical units and uses the same origin as your cut geometry.</p><div class="export-grid">${[['text', 'Text / status label'], ['rotary', 'Rotary scale'], ['linear', 'Linear scale'], ['line', 'Line'], ['border', 'Border / group box'], ['plate', 'Identification plate'], ['symbol', 'Registration cross']].map(([type, label]) => btn(label, 'add-art', '', `data-type="${type}"`)).join('')}${btn('Import SVG', 'art-import')}${btn('Import PNG / JPEG', 'image-import')}</div>`);
}
function createArt(type) {
  const a = {
    id: uid(),
    type,
    x: app.panel.w / 2,
    y: app.panel.h / 2,
    rotation: 0,
    locked: false,
    layer: type === 'symbol' ? 'registration' : 'uv',
    color: '#253f2e',
    stroke: .4
  };
  if (['text', 'plate'].includes(type)) Object.assign(a, {
    text: type === 'plate' ? 'CONTRAPTION / 01' : 'YOUR LABEL',
    size: 5
  });
  if (['line', 'linear'].includes(type)) Object.assign(a, {
    w: 60,
    h: 0,
    count: 11
  });
  if (type === 'border' || type === 'plate') Object.assign(a, {
    w: 70,
    h: 25,
    r: 2
  });
  if (type === 'rotary') Object.assign(a, {
    r: 20,
    count: 11,
    start: -135,
    end: 135
  });
  if (type === 'symbol') Object.assign(a, {
    w: 6,
    h: 6
  });
  mutate('add artwork', () => app.panel.artwork.push(a));
  close();
  select([a.id]);
  showInspector();
}
function arrangeDialog() {
  const n = app.selection.length;
  modal('Arrange objects', `<p>${n} selected. Alignment uses component reference centres and artwork origins.</p><div class="export-grid">${[['left', 'Align left'], ['right', 'Align right'], ['top', 'Align top'], ['bottom', 'Align bottom'], ['cx', 'Centre horizontally'], ['cy', 'Centre vertically'], ['dx', 'Distribute horizontally'], ['dy', 'Distribute vertically']].map(([kind, label]) => btn(label, 'align', '', `data-kind="${kind}"`)).join('')}</div><div class="section"><h3>Repeat selection</h3>${fields(mf('Arrangement', 'pattern', 'row', 'select', options(['row', 'column', 'circle'], 'row')) + mf('Additional copies', 'count', 3, 'number') + mf('Spacing / radius (mm)', 'spacing', 30, 'number'))}<label class="checkline"><input id="patternRotate" type="checkbox"> Rotate circular copies</label>${btn('Create pattern', 'pattern', 'primary wide')}</div><div class="section"><div class="row">${btn('Group', 'group')}${btn('Ungroup', 'ungroup')}${btn('Lock / unlock', 'lock')}</div></div>`);
}
function align(kind) {
  const os = objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked);
  if (os.length < 2) return notice('Select two or more unlocked objects.');
  mutate('align objects', () => {
    const xs = os.map(o => o.x),
      ys = os.map(o => o.y),
      minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    if (['dx', 'dy'].includes(kind)) {
      const k = kind === 'dx' ? 'x' : 'y';
      os.sort((a, b) => a[k] - b[k]);
      const low = os[0][k],
        high = os.at(-1)[k];
      os.forEach((o, i) => o[k] = low + i * (high - low) / (os.length - 1));
    } else for (const o of os) {
      if (kind === 'left') o.x = minX;
      if (kind === 'right') o.x = maxX;
      if (kind === 'top') o.y = minY;
      if (kind === 'bottom') o.y = maxY;
      if (kind === 'cx') o.x = (minX + maxX) / 2;
      if (kind === 'cy') o.y = (minY + maxY) / 2;
    }
  });
}
let definitionDraft, definitionTarget;
function definitionDialog(c = null) {
  definitionTarget = c?.id || null;
  definitionDraft = clone(c?.definition || starterParts[0]);
  const d = definitionDraft;
  const shapeInputs = k => {
    const s = d[k];
    return `<h3>${k === 'front' ? 'Front face' : k === 'rear' ? 'Rear body' : 'Access envelope'}</h3>${fields(mf('Shape', k + 'Type', s.type, 'select', options(['circle', 'rect'], s.type)) + mf('Diameter / width (mm)', k + 'W', s.d || s.w, 'number') + mf('Height (mm)', k + 'H', s.h || s.d, 'number') + mf('Corner radius (mm)', k + 'R', s.r || 0, 'number'))}`;
  };
  modal(c ? 'Edit embedded part definition' : 'Create custom part', `<p>Changes affect this project instance only. Save to the library explicitly to reuse it.</p><div class="def-grid"><div>${mf('Part name', 'name', d.name)}${fields(mf('Behavior', 'kind', d.kind, 'select', options(['button', 'toggle', 'encoder', 'pot', 'led', 'display', 'connector', 'mount'], d.kind)) + mf('Reference prefix', 'prefix', d.prefix))}${shapeInputs('front')}${shapeInputs('rear')}${shapeInputs('access')}</div><div>${fields(mf('Rear depth (mm)', 'depth', d.depth, 'number') + mf('Cable bend allowance (mm)', 'bend', d.bend, 'number') + mf('Min panel thickness (mm)', 'minThickness', d.minThickness, 'number') + mf('Max panel thickness (mm)', 'maxThickness', d.maxThickness, 'number'))}${mf('Mounting reference', 'mountReference', d.mountReference)}<h3>Openings / hole pattern</h3><p>Coordinates are relative to the mounting reference. Circle: d. Rectangle / rounded slot: w, h, r. All values in mm.</p><div class="table-wrap definition-table"><table><thead><tr><th>Shape</th><th>X mm</th><th>Y mm</th><th>Ø / W mm</th><th>H mm</th><th>R mm</th><th></th></tr></thead><tbody id="openingRows">${openingRows(d.openings)}</tbody></table></div><details><summary>Advanced geometry JSON</summary>${mf('Opening geometry JSON', 'openings', JSON.stringify(d.openings, null, 2), 'textarea')}${btn('Apply JSON to table', 'opening-json', 'small')}</details><div class="row">${btn('+ Circle', 'hole-circle', 'small')}${btn('+ Slot', 'hole-slot', 'small')}${btn('Import SVG', 'hole-import', 'small')}</div><h3>Terminals</h3><div class="table-wrap definition-table"><table><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Volts</th><th>Required</th><th></th></tr></thead><tbody id="terminalRows">${terminalRows(d.terminals)}</tbody></table></div>${btn('+ Terminal', 'add-terminal', 'small')}<input type="hidden" name="terminals" value="table"><p class="help-text">Names are editable; stable IDs keep wiring attached when names change.</p></div></div><div class="section">${mf('Dimension source / measurements', 'source', d.source)}${fields(mf('Verification date', 'verifiedDate', d.verifiedDate, 'date') + mf('Notes', 'notes', d.notes || ''))}<label class="checkline"><input name="verified" type="checkbox" ${d.verified ? 'checked' : ''}> Dimensions measured / verified against this source</label></div>`, {
    large: true,
    form: 'definition',
    submit: c ? 'Update this part' : 'Create part'
  });
}
function syncDefinitionTables() {
  $('#openingRows').innerHTML = openingRows(definitionDraft.openings);
  $('#terminalRows').innerHTML = terminalRows(definitionDraft.terminals);
  $('#m-openings').value = JSON.stringify(definitionDraft.openings,null,2);
}
function legendDialog() {
  const a=app.panel.artwork.find(a=>app.selection.includes(a.id));
  if(!a || !['rotary','linear'].includes(a.type)) return;
  modal('Scale ticks & legends', `<p>${a.count} ticks. Labels follow the scale when you move, rotate, copy or export it.</p>${mf('Labels','labelMode',a.labelMode||'none','select',options(['none','numeric','custom'],a.labelMode||'none'))}${fields(mf('First value','labelMin',a.labelMin??0,'number')+mf('Last value','labelMax',a.labelMax??100,'number')+mf('Decimal places','labelDecimals',a.labelDecimals??0,'number')+mf('Label every N ticks','labelEvery',a.labelEvery??1,'number')+mf('Major tick every N','majorEvery',a.majorEvery??5,'number')+mf('Text height (mm)','legendSize',a.legendSize??3,'number')+mf('Gap beyond ticks (mm)','legendGap',a.legendGap??2,'number')+mf('Major tick length (mm)','majorLength',a.majorLength??4,'number')+mf('Minor tick length (mm)','minorLength',a.minorLength??2,'number')+mf('Prefix','labelPrefix',a.labelPrefix||'')+mf('Suffix','labelSuffix',a.labelSuffix||''))}${mf('Custom labels: one per tick, separated by |','customLabels',(a.customLabels||[]).join('|'),'textarea')}<p class="help-text">Leave an entry empty for an unlabeled tick. Custom labels need exactly ${a.count} entries.</p>`,{form:'legend',submit:'Apply legend'});
}
function replacementDialog() {
  const c = app.panel.components.find(c => app.selection.includes(c.id));
  if (!c) return;
  modal('Replace component', `<p>Placement, reference and label are preserved. Assignments survive only when terminal IDs, roles and declared voltages match.</p>${mf('Replacement', 'replacement', app.library[0].id, 'select', options(app.library.map(d => [d.id, d.name]), app.library[0].id))}<div id="replacementSummary" class="note"></div>`, {
    form: 'replace',
    submit: 'Replace component'
  });
  replacementSummary();
}
function replacementSummary() {
  const c = app.panel.components.find(c => app.selection.includes(c.id)),
    d = app.library.find(d => d.id === $('#m-replacement').value);
  const removed = assignmentImpact(app.p,c,d);
  $('#replacementSummary').textContent = `${c.definition.name} → ${d.name}. ${removed.length} incompatible assignment(s) will be removed. Opening, front face, rear body, depth and clearances will change. Review Checks after replacement.`;
}
function libraryUpdates() {
 const c=app.panel.components.find(c=>app.selection.includes(c.id));if(!c)return;
 const info=revisionInfo(c.definition),matches=app.library.filter(d=>revisionInfo(d).family===info.family&&revisionInfo(d).revision>info.revision).sort((a,b)=>revisionInfo(b).revision-revisionInfo(a).revision);
 modal('Review component revisions',`<p>${esc(c.ref)} · embedded r${info.revision}. Updating is undoable and affects this instance only.</p>${matches.map(d=>`<div class="note"><strong>${esc(d.name)} · r${revisionInfo(d).revision}</strong><p>Changed: ${esc(revisionChanges(c.definition,d).join(', ')||'metadata only')}</p><p>${assignmentImpact(app.p,c,d).length} incompatible wiring assignments will be removed.</p><p>${esc(d.revisionNote||'')}</p>${btn('Apply r'+revisionInfo(d).revision,'apply-revision','primary',`data-id="${esc(d.id)}"`)}</div>`).join('')||'<p>No newer local revision. Edit a definition and save a new library revision, or import a revision library.</p>'}`);
}
function controllerDialog() {
  const c = app.p.controller;
  modal('Controller & declared pin capabilities', `<p>Choose a sourced profile or edit your controller. Primary header capabilities are included; declared capabilities are checked, not electrically simulated.</p>${mf('Controller name', 'name', c.name)}${mf('Source / datasheet', 'source', c.source || '')}${mf('Pins: ID, Arduino code, voltage, capabilities separated by |', 'pins', c.pins.map(p => `${p.id},${p.code},${p.voltage},${p.caps.join('|')}`).join('\n'), 'textarea')}<p class="help-text">Example: D3,3,5,digitalIn|digitalOut|pwm<br>A4,A4,5,analogIn|digitalIn|digitalOut|SDA<br>Use the same physical pin ID for alternate functions to preserve conflict detection.</p><div class="row">${mf('Sourced board preset','profile','uno-r3','select',options(controllerProfiles.map(c=>[c.id,c.name]),'uno-r3'))}${btn('Load preset','controller-preset','small')}<p id="controllerNotes" class="help-text"></p>${btn('Start custom controller', 'custom-controller', 'small')}</div>`, {
    large: true,
    form: 'controller'
  });
  $('#m-pins').rows = 15;
}
let rulesDraft;
function rulesDialog() {
  rulesDraft = clone(app.p.rules);
  renderRules();
}
function renderRules() {
  const comps = app.p.panels.flatMap(b => b.components);
  modal('Rehearsal rules', `<p>Rules run once in list order for each explicit control event. They do not trigger more rules. Output does not validate hardware and is not compiled into firmware.</p><div class="table-wrap"><table><thead><tr><th>CONTROL / EVENT</th><th>OPERATION / VARIABLE</th><th>VALUE / MIN / MAX</th><th>TARGET</th><th></th></tr></thead><tbody>${rulesDraft.map((r, i) => `<tr><td><select data-rule="source" data-index="${i}" aria-label="Rule source">${options(comps.map(c => [c.id, c.ref + ' ' + c.label]), r.source)}</select><select data-rule="event" data-index="${i}" aria-label="Rule event">${options(['press', 'release', 'change'], r.event)}</select></td><td><select data-rule="op" data-index="${i}" aria-label="Rule operation">${options(['set', 'toggle', 'increment', 'map', 'clamp', 'show', 'enable', 'indicator'], r.op)}</select><select data-rule="variable" data-index="${i}" aria-label="Rule variable">${options(Object.keys(app.p.variables), r.variable)}</select></td><td>${['value', 'min', 'max'].map(k => `<input type="number" step="any" data-rule="${k}" data-index="${i}" aria-label="Rule ${k}" value="${r[k]}">`).join('')}</td><td><select data-rule="target" data-index="${i}" aria-label="Rule target">${options([['', 'No target'], ...comps.map(c => [c.id, c.ref])], r.target || '')}</select></td><td>${btn('×', 'remove-rule', 'small', `data-index="${i}" aria-label="Remove rule"`)}</td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:12px">${btn('+ Add rule', 'add-rule')}${btn('Initial variables', 'variables')}</div><p class="help-text">Map uses a 0–100 control input to the specified minimum/maximum. Set, toggle, increment and clamp change a variable. Show, enable and indicator apply its current value to a target.</p>`, {
    large: true,
    form: 'rules',
    submit: 'Save rules'
  });
}
function registers() {
  modal('Assumptions & evidence', `<p>Keep assumptions separate from verified evidence. Use a component reference, panel name or “project” as the target.</p><div class="def-grid"><div><h3>Assumptions</h3>${app.p.assumptions.map(a => `<div class="note"><strong>${esc(a.target)}</strong><p>${esc(a.text)}</p>${btn('Remove', 'remove-assumption', 'small', `data-id="${a.id}"`)}</div>`).join('')}</div><div><h3>Evidence</h3>${app.p.evidence.map(a => `<div class="note"><strong>${esc(a.target)}</strong><p>${esc(a.text)}</p><small>${esc(a.source || '')}</small>${btn('Remove', 'remove-evidence', 'small', `data-id="${a.id}"`)}</div>`).join('')}</div></div><div class="section">${fields(mf('Record type', 'recordType', 'assumptions', 'select', options([['assumptions', 'Assumption'], ['evidence', 'Evidence']], 'assumptions')) + mf('Target', 'target', 'project'))}${mf('Record', 'text', '', 'textarea')}${mf('Source / measurement reference', 'source', '')}</div>`, {
    large: true,
    form: 'register',
    submit: 'Add record'
  });
}
function baselines() {
  modal('Fabrication baselines', `<p>A baseline freezes the design, including embedded definitions. Compare without replacing your working project.</p>${app.p.baselines.map(b => `<div class="note"><strong>${esc(b.name)}</strong><p>${new Date(b.date).toLocaleString()}</p><div class="row">${btn('Compare overlay', 'compare', 'small', `data-id="${b.id}"`)}${btn('Change list', 'diff', 'small', `data-id="${b.id}"`)}${btn('Delete baseline', 'delete-baseline', 'small danger', `data-id="${b.id}"`)}</div></div>`).join('') || '<p>No named baselines yet.</p>'}${mf('New baseline name', 'name', 'Rev ' + app.p.revision + ' — fabrication')}${app.compare ? btn('Hide comparison overlay', 'clear-compare', 'small') : ''}`, {
    form: 'baseline',
    submit: 'Capture baseline'
  });
}
async function recovery() {
  const snapshots = storageOK ? (await store.all('recovery')).filter(s => s.project.id === app.p.id).sort((a, b) => b.seq - a.seq) : [];
  modal('Recover your work', `<p>Local autosave is browser storage. A JSON backup is a portable file you control. Keep one before clearing browser data.</p><div class="row">${btn('Download JSON backup', 'backup', 'primary')}${btn('Save as a new project', 'save-as')}</div><div class="section"><h3>Last good saves</h3>${snapshots.map(s => `<div class="note"><strong>Save ${s.seq}</strong> · ${new Date(s.date).toLocaleString()} ${btn('Recover as a copy', 'recover', 'small', `data-id="${s.id}"`)}</div>`).join('') || '<p>No recovery snapshots yet. Previous successful saves appear here.</p>'}</div><div class="section"><h3>Fresh start</h3><p>Create a blank project while keeping existing projects on this device.</p>${btn('New empty project', 'new')}</div>`);
}
function exportOptions() {
  const include = undefined;
  return {
    svg: $('#out-svg')?.checked !== false,
    pdf: $('#out-pdf')?.checked !== false,
    png: $('#out-png')?.checked !== false,
    wiring: $('#out-wiring')?.checked !== false,
    code: $('#out-code')?.checked !== false,
    dpi: Number($('#dpi')?.value || 300),
    pdfMode: $('#pdfMode')?.value || 'tile',
    fit: Number($('#fitAllowance')?.value || 0),
    include
  };
}
async function doExport(type) {
  const opts = exportOptions();
  if (!Number.isFinite(opts.fit) || Math.abs(opts.fit) > 5) throw Error('Fit allowance must be within ±5 mm per side.');
  if (opts.fit) {
    for (const b of app.p.panels) for (const c of b.components) for (const s of c.definition.openings) {
      if (!['circle', 'rect'].includes(s.type)) throw Error('Fit allowance requires circle / rectangle openings.');
      if (s.type === 'circle' ? s.d + 2 * opts.fit <= 0 : Math.min(s.w, s.h) + 2 * opts.fit <= 0) throw Error('Negative allowance collapses an opening.');
    }
  }
  const frozen = clone(app.p),
    b = frozen.panels.find(b => b.id === app.panel.id),
    stem = safeName(frozen.name) + '-rev-' + safeName(frozen.revision);
  exportAbort = new AbortController();
  opts.signal = exportAbort.signal;
  modal('Preparing fabrication output', `<p id="exportProgress">Freezing revision ${esc(frozen.revision)}…</p><progress style="width:100%" aria-label="Export in progress"></progress><div class="actions">${btn('Cancel', 'close')}</div>`);
  try {
    await new Promise(r => setTimeout(r, 50));
    if (type === 'zip') {
      const result = await fabricationZip(frozen, opts, s => {
        const el = $('#exportProgress');
        if (el) el.textContent = s;
      });
      if (opts.signal.aborted) throw Error('Export canceled.');
      download(result.blob, stem + '-fabrication.zip');
      const record = {
        id: uid(),
        projectId: frozen.id,
        name: stem + '-fabrication.zip',
        date: new Date().toISOString(),
        fingerprints: result.fingerprints,
        options: {
          ...opts,
          signal: undefined
        }
      };
      app.history.push(record);
      if (storageOK) await store.put('history', record).catch(() => notice('Files downloaded; export history could not be saved.', true));
    }
    if (type === 'svg') download(svgExport(frozen, b, opts), stem + '.svg', 'image/svg+xml');
    if (type === 'pdf') download(await pdfExport(frozen, b, opts), stem + '.pdf', 'application/pdf');
    if (type === 'png') download(await pngExport(frozen, b, {
      ...opts,
      include: Object.fromEntries(['uv', 'overlay', 'engrave', 'registration'].map(l => [l, b.layers[l].export]))
    }), stem + '.png', 'image/png');
    if (opts.signal.aborted) throw Error('Export canceled.');
    exportAbort = null;
    close();
    notice('Fabrication output downloaded.');
    renderSurface();
  } catch (e) {
    exportAbort = null;
    modal('Export stopped', `<p>${esc(e.message)}</p><p>Your design has not changed.</p>${btn('Return to workbench', 'close', 'primary')}`);
  }
}
let pendingInterchange;
function conversionHTML(r) {
 return `<dl class="conversion-stats">${Object.entries(r.mapped).map(([k,v])=>`<dt>${esc(k.replace(/([A-Z])/g,' $1'))}</dt><dd>${esc(v)}</dd>`).join('')}</dl><h3>Review this handoff</h3><ul>${r.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`;
}
function interchangeDialog() {
 modal('Companion app handoffs',`<p>Each export includes a native companion project, a conversion report and an INTERFACEBENCH backup.</p><div class="export-grid"><div class="export-card"><h3>PINNOTE</h3><p>Wiring assignments → harness documentation. Schema 1, tested with v2.0.0.</p>${btn('Review PINNOTE export','handoff-export','primary', 'data-target="pinnote"')}</div><div class="export-card"><h3>REFLEX</h3><p>Device inventory and eligible UNO R3 assignments. Behavior is configured in REFLEX. Schema 5, tested with v1.1.0-rc.1.</p>${btn('Review REFLEX export','handoff-export','primary','data-target="reflex"')}</div></div><div class="section"><h3>Bring work back</h3><p>Review an import before applying it. Importing a board adds a new mounting-template panel. Returned handoffs update matched wiring only.</p><div class="row">${btn('Import COPPERBENCH board','copperbench-import')}${btn('Import returned assignments','return-import')}</div><p class="help-text">COPPERBENCH: native schema-5 JSON, tested with v1.7.1. Return imports need the handoff provenance map and the original INTERFACEBENCH project/controller.</p></div>`,{large:true});
}
async function prepareHandoff(target) {
 const snapshot=clone(app.p),result=target==='pinnote'?exportPinnote(snapshot):exportReflex(snapshot);
 pendingInterchange={kind:'export',target,snapshot,...result};
 modal('Review '+target.toUpperCase()+' export',conversionHTML(result.report),{large:true,form:'handoff-export',submit:'Download handoff ZIP'});
}
async function chooseFile(kind) {
  app.importKind = kind;
  const input = $('#fileInput');
  input.value = '';
  input.accept = kind.includes('svg') || ['outline', 'holes'].includes(kind) ? '.svg,image/svg+xml' : kind === 'image' || kind === 'photo' ? 'image/png,image/jpeg' : '.json,application/json';
  input.click();
}
async function readFile(file, kind) {
  if (file.size > 25 * 1024 * 1024) throw Error('File exceeds 25 MB.');
  if (kind==='copperbench' || kind==='return') {
    const snapshot=stable(designContent(app.p));
    const result=kind==='copperbench'?importCopperbench(await file.text()):importAssignments(await file.text(),app.p);
    if(result.panel){
      const refs=new Set(app.p.panels.flatMap(b=>b.components.map(c=>c.ref)));
      for(const c of result.panel.components){let n=1;while(refs.has(c.ref))c.ref='H'+n++;refs.add(c.ref);}
      validateProject({...app.p,panels:[...app.p.panels,result.panel]});
    }
    pendingInterchange={kind,snapshot,...result};
    modal('Review companion import',conversionHTML(result.report),{large:true,form:'handoff-import',submit:kind==='copperbench'?'Add mounting-template panel':'Apply wiring assignments'});return;
  }
  if (kind === 'project') {
    const p = validateProject(JSON.parse(await file.text()));
    await openProject(p, {
      fresh: true
    });
    notice('Project imported as a separate copy.');
    return;
  }
  if (kind === 'library') {
    const data = JSON.parse(await file.text());
    if (data.format !== 'interfacebench-library' || ![1,2].includes(data.version) || !Array.isArray(data.parts)) throw Error('Unsupported component library.');
    if (data.parts.length > 200) throw Error('Library exceeds 200 parts.');
    const parts = data.parts.map(d => validateDefinition(clone(d)));
    if(data.version===2 && parts.some(d=>!d.id.startsWith('custom-')||!d.libraryId||!d.libraryRevision))throw Error('Revision libraries require custom IDs, family IDs and positive revisions.');
    if(data.version===1) for (const d of parts) { d.id='custom-'+uid(); d.libraryId=d.id; d.libraryRevision=1; }
    const merged=mergeLibrary(app.library,parts);
    if(storageOK) await store.put('library',{id:'custom',parts:merged.filter(d=>d.id.startsWith('custom-'))});
    app.library=merged;
    renderLeft();
    notice(`${parts.length} parts imported. Existing projects are unchanged.`);
    return;
  }
  if (['outline', 'svg', 'holes'].includes(kind)) {
    const asset = importSVG(await file.text());
    if (kind === 'outline') {
      if (asset.shapes.length !== 1) throw Error('Panel outline requires one closed shape.');
      const cs = commands(asset.shapes[0]);
      if (cs.at(-1)?.type !== 'Z' || cs.filter(c => c.type === 'M').length !== 1) throw Error('Panel outline must be one closed contour.');
      const points = flatten(cs, .1);
      if (points.some(p => p.x < 0 || p.y < 0 || p.x > asset.w || p.y > asset.h)) throw Error('Outline points exceed the physical SVG viewBox.');
      mutate('import panel outline', () => {
        app.panel.outline = points;
        app.panel.shape = 'imported';
        app.panel.w = asset.w;
        app.panel.h = asset.h;
      });
      fit();
    } else if (kind === 'holes') {
      const target = $('#m-openings');
      definitionDraft.openings = [...JSON.parse(target.value), ...asset.shapes];
      syncDefinitionTables();
    } else {
      let a;
      mutate('import SVG artwork', () => {
        const key = assetKey(asset);
        app.p.assets[key] = asset;
        a = {
          id: uid(),
          type: 'imported',
          asset: key,
          x: 20,
          y: 20,
          rotation: 0,
          layer: 'engrave',
          color: '#233b2b',
          stroke: .3
        };
        app.panel.artwork.push(a);
      });
      close();
      select([a.id]);
    }
    return;
  }
  if (['image', 'photo'].includes(kind)) {
    if (!['image/png', 'image/jpeg'].includes(file.type)) throw Error('Only PNG and JPEG images are supported.');
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 24000000) throw Error('Image exceeds 24 megapixels. Resize it first.');
    const can = document.createElement('canvas');
    can.width = bitmap.width;
    can.height = bitmap.height;
    can.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    const asset = {
      type: 'raster',
      data: can.toDataURL('image/png'),
      width: can.width,
      height: can.height,
      name: file.name
    };
    let a;
    mutate(kind === 'photo' ? 'attach part photo' : 'import raster artwork', () => {
      const key = assetKey(asset);
      app.p.assets[key] = asset;
      if (kind === 'photo') {
        const c = app.panel.components.find(c => app.selection.includes(c.id));
        c.definition.photo = key;
      } else {
        a = {
          id: uid(),
          type: 'image',
          asset: key,
          x: 20,
          y: 20,
          w: 50,
          h: 50 * can.height / can.width,
          rotation: 0,
          layer: 'uv'
        };
        app.panel.artwork.push(a);
      }
    });
    close();
    if (a) select([a.id]);
    notice('Image embedded in the project.');
  }
}
function assetKey(v) {
  let h = 2166136261;
  for (const c of JSON.stringify(v)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  let key = 'asset-' + (h >>> 0).toString(16);
  while (app.p.assets[key] && stable(app.p.assets[key]) !== stable(v)) key += 'x';
  return key;
}
const commandEntries = [['New project', 'new', ''], ['Open project JSON', 'open', ''], ['Projects & examples', 'home', ''], ['Download project backup', 'backup', 'Ctrl S'], ['Panel settings', 'panel-settings', ''], ['Add artwork', 'artwork', ''], ['Create custom part', 'custom-new', ''], ['Arrange / pattern', 'arrange', ''], ['Duplicate selection', 'duplicate', 'Ctrl D'], ['Delete selection', 'delete', 'Delete'], ['Rotate selection 90 degrees', 'rotate', 'R'], ['Group selection', 'group', 'Ctrl G'], ['Ungroup selection', 'ungroup', ''], ['Fit panel', 'fit', 'F'], ['Fit selection', 'fit-selection', ''], ['Front view', 'front', ''], ['Rear view', 'rear', ''], ['Rehearsal rules', 'rules', ''], ['Controller & pins', 'controller', ''], ['Check geometry & wiring', 'checks-tab', ''], ['Fabrication outputs', 'fabricate', ''], ['Assumptions & evidence', 'registers', ''], ['Baselines & comparison', 'baselines', ''], ['Recovery snapshots', 'recovery', ''], ['Undo', 'undo', 'Ctrl Z'], ['Redo', 'redo', 'Ctrl Shift Z'], ['Guided walkthrough', 'tour', ''], ['Help & shortcuts', 'help', '?']];
function commandMenu(q = '') {
  const list = commandEntries.filter(x => x[0].toLowerCase().includes(q.toLowerCase())).map(([label, action, key]) => btn(`<span>${esc(label)}</span><kbd>${esc(key)}</kbd>`, 'command', '', `data-command="${action}"`)).join('');
  if ($('#commandList') && $('#dialog').open) {
    $('#commandList').innerHTML = list;
    return;
  }
  modal('Find a command', `<input class="search" id="commandSearch" placeholder="What do you want to do?" aria-label="Search commands"><div class="command-list" id="commandList">${list}</div>`);
  $('#commandSearch').focus();
}
function help() {
  modal('A little orientation', `<p><strong>Define → Arrange → Connect → Rehearse → Fabricate.</strong> You can fabricate a panel before assigning electronics or rules.</p><div class="def-grid"><div><h3>Design</h3><p>Add parts from the library. Drag to move or edit exact positions in the inspector. Values accept <code>12.7 mm</code> and <code>0.5 in</code>. Shift-click selects several objects. Drag empty space for a marquee.</p><p>Rear view mirrors about the panel’s vertical centre. Numeric positions always refer to the front. Fabrication always exports the front orientation.</p><h3>Keyboard</h3><p>V select · H pan · M measure · F fit · R rotate<br>Arrows nudge · Shift coarse nudge<br>Ctrl/⌘ D duplicate · G group · Z undo<br>Ctrl/⌘ Shift Z redo · K commands · S backup<br>Escape cancels a drag or clears selection.</p></div><div><h3>Save and recover</h3><p>“Saved locally” means this browser, on this site address. Backup downloads a portable JSON. Recovery contains ten prior successful saves. Another tab cannot silently overwrite newer work.</p><h3>Fabrication</h3><p>SVG uses mm and outlined DejaVu Sans text. PDF prints at 100%. Measure the 20 mm calibration square. PNG is transparent RGB; no printer color profile is applied.</p><h3>Import boundaries</h3><p>SVG accepts shapes, Bézier curves, arcs and affine transforms. Artwork is normalized to monochrome geometry. Outline text and remove CSS before import. Curved panel outlines are sampled to polygons. Scripts and external resources are rejected.</p></div></div><div class="note">Checks use declared dimensions. Rear/access interference is conservative. Generic components are unverified. Rehearsal and generated Arduino scaffolding are prototypes, not safety or circuit validation.</div><div class="row">${btn('Guided walkthrough', 'tour', 'primary')}${btn('Assumptions & evidence', 'registers')}${btn('Close', 'close')}</div>`, {
    large: true
  });
}
function tour() {
  close();
  walk = 0;
  nextTour();
}
function nextTour() {
  const steps = [['define', '1 / 5 · Define a panel. Set its dimensions and rear depth in the inspector.'], ['arrange', '2 / 5 · Add a part from the library. Move it, or type exact X and Y values.'], ['connect', '3 / 5 · Assign controller pins here. This step is optional for panel fabrication.'], ['rehearse', '4 / 5 · Click a control and watch its state. Select it for a slider or press/release controls.'], ['fabricate', '5 / 5 · Review findings, choose outputs and create a fabrication ZIP.']];
  if (walk >= steps.length) {
    $('#walkthrough').hidden = true;
    document.body.classList.remove('walking');
    return;
  }
  const [stage, text] = steps[walk++];
  setStage(stage);
  $('#walkthrough').hidden = false;
  document.body.classList.add('walking');
  $('#walkthrough').innerHTML = `<p>${esc(text)}</p>${btn(walk === 5 ? 'Done' : 'Next', 'tour-next')}${btn('Dismiss', 'tour-dismiss')}`;
}
async function action(name, el) {
  const id = el?.dataset.id;
  switch (name) {
    case 'home':
      return home();
    case 'close':
      return close();
    case 'new':
      app.hasProject = true;
      return openProject(newProject());
    case 'example':
      app.hasProject = true;
      return openProject(example());
    case 'diagnostic':
      app.hasProject = true;
      return openProject(example(true));
    case 'open':
      return chooseFile('project');
    case 'load':
      {
        const p = await store.load(id);
        if (p) {
          app.hasProject = true;
          await openProject(p);
        }
        return;
      }
    case 'backup':
      download(JSON.stringify(app.p, null, 2), safeName(app.p.name) + '-rev-' + safeName(app.p.revision) + '.json', 'application/json');
      notice('Portable project backup downloaded.');
      return;
    case 'save-as':
      {
        const p = clone(app.p);
        p.name += ' — copy';
        app.hasProject = true;
        return openProject(p, {
          fresh: true
        });
      }
    case 'recover':
      {
        const r = await store.read('recovery', id);
        if (r) {
          r.project.name += ' — recovered';
          return openProject(r.project, {
            fresh: true
          });
        }
        return;
      }
    case 'stage':
      return setStage(el.dataset.stage);
    case 'fabricate':
      return setStage('fabricate');
    case 'undo':
      return undo();
    case 'redo':
      return undo(true);
    case 'commands':
      return commandMenu();
    case 'command':
      close();
      return action(el.dataset.command);
    case 'panel':
      app.panelId = id;
      app.selection = [];
      app.measure = [];
      render();
      fit();
      return;
    case 'panel-settings':
      app.selection = [];
      app.inspectorTab = 'inspect';
      renderRight();
      showInspector();
      return;
    case 'add-panel':
      {
        mutate('add panel', () => {
          const b = newPanel('Panel ' + (app.p.panels.length + 1));
          app.p.panels.push(b);
          app.panelId = b.id;
        });
        app.selection = [];
        showInspector();
        fit();
        return;
      }
    case 'delete-panel':
      return modal('Delete panel?', `<p>This removes ${esc(app.panel.name)}, its objects, connections and rules. Undo can restore the panel.</p>${btn('Delete panel', 'confirm-delete-panel', 'danger')}`);
    case 'confirm-delete-panel':
      {
        const ids = new Set(app.panel.components.map(c => c.id));
        mutate('delete panel', () => {
          app.p.panels = app.p.panels.filter(b => b.id !== app.panel.id);
          app.p.connections = app.p.connections.filter(n => !ids.has(n.component));
          app.p.rules = app.p.rules.filter(r => !ids.has(r.source) && !ids.has(r.target));
          app.panelId = app.p.panels[0].id;
        });
        close();
        fit();
        return;
      }
    case 'add-part':
      return addPart(id);
    case 'select-object':
      {
        const o = objects(app.panel).find(o => o.id === id);
        select(el._shift ? [id] : o.group ? objects(app.panel).filter(x => x.group === o.group).map(x => x.id) : [id], {
          toggle: el._shift
        });
        showInspector();
        return;
      }
    case 'select-wire':
      {
        const b = app.p.panels.find(b => b.components.some(c => c.id === id));
        app.panelId = b.id;
        select([id]);
        showInspector();
        fit(true);
        return;
      }
    case 'select-tool':
      app.tool = 'select';
      render();
      return;
    case 'pan-tool':
      app.tool = 'pan';
      render();
      return;
    case 'measure':
      app.tool = 'measure';
      app.measure = [];
      render();
      return;
    case 'front':
    case 'rear':
      if (app.sim && name === 'rear') return notice('Rehearsal uses the front view.');
      app.side = name;
      render();
      return;
    case 'fit':
      return fit();
    case 'fit-selection':
      return fit(true);
    case 'zoom-in':
      return zoom(.8);
    case 'zoom-out':
      return zoom(1.25);
    case 'focus':
      document.body.classList.toggle('focus-mode');
      requestAnimationFrame(() => fit());
      return;
    case 'collapse-left':
      if (innerWidth <= 650) {
        document.body.classList.toggle('show-browser-mobile');
        document.body.classList.remove('show-inspector');
      } else document.body.classList.toggle('collapsed-left');
      requestAnimationFrame(() => fit());
      return;
    case 'inspect-tab':
      app.inspectorTab = 'inspect';
      showInspector();
      renderRight();
      return;
    case 'checks-tab':
      app.inspectorTab = 'checks';
      showInspector();
      renderRight();
      return;
    case 'duplicate':
      return duplicateSelected();
    case 'rotate':
      return mutate('rotate selection', () => objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked).forEach(o => o.rotation = (o.rotation + 90) % 360));
    case 'delete':
      {
        const ids = new Set(objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked).map(o => o.id));
        if (!ids.size) return notice('Select unlocked objects to delete.');
        mutate('delete selection', () => {
          app.panel.components = app.panel.components.filter(o => !ids.has(o.id));
          app.panel.artwork = app.panel.artwork.filter(o => !ids.has(o.id));
          app.p.connections = app.p.connections.filter(n => !ids.has(n.component));
          app.p.rules = app.p.rules.filter(r => !ids.has(r.source) && !ids.has(r.target));
          app.selection = [];
        });
        return;
      }
    case 'group':
    case 'ungroup':
      {
        const group = name === 'group' ? uid() : null;
        return mutate(name + ' objects', () => objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked).forEach(o => o.group = group));
      }
    case 'lock':
      {
        const os = objects(app.panel).filter(o => app.selection.includes(o.id));
        const lock = os.some(o => !o.locked);
        return mutate('lock objects', () => os.forEach(o => o.locked = lock));
      }
    case 'layer-lock':
      return mutate('lock layer', () => app.panel.layers[el.dataset.layer].locked = !app.panel.layers[el.dataset.layer].locked);
    case 'artwork':
      return artworkDialog();
    case 'add-art':
      return createArt(el.dataset.type);
    case 'art-import':
      return chooseFile('svg');
    case 'outline-import':
      return chooseFile('outline');
    case 'image-import':
      return chooseFile('image');
    case 'hole-import':
      return chooseFile('holes');
    case 'forward':
    case 'backward':
      return mutate('reorder artwork', () => {
        const i = app.panel.artwork.findIndex(a => app.selection.includes(a.id)),
          j = Math.max(0, Math.min(app.panel.artwork.length - 1, i + (name === 'forward' ? 1 : -1)));
        if (i >= 0) [app.panel.artwork[i], app.panel.artwork[j]] = [app.panel.artwork[j], app.panel.artwork[i]];
      });
    case 'arrange':
      return arrangeDialog();
    case 'align':
      return align(el.dataset.kind);
    case 'pattern':
      {
        const type = $('#m-pattern').value,
          count = Number($('#m-count').value),
          spacing = Number($('#m-spacing').value);
        if (!Number.isInteger(count) || count < 1 || count > 100 || !Number.isFinite(spacing) || spacing <= 0) throw Error('Use 1–100 additional copies and positive spacing.');
        const o = objects(app.panel).find(o => app.selection.includes(o.id));
        if (!o) throw Error('Select an object first.');
        if (type === 'circle' && app.selection.length !== 1) throw Error('Circular patterns use one selected object.');
        duplicateSelected({
          type,
          count,
          dx: type === 'row' ? spacing : 0,
          dy: type === 'column' ? spacing : 0,
          radius: spacing,
          cx: o.x - spacing,
          cy: o.y,
          rotate: $('#patternRotate').checked
        });
        close();
        return;
      }
    case 'mount-pattern':
      return modal('Four corner mounting holes', `<p>Add four independent mounting-hole components. All measurements are millimetres.</p>${fields(mf('Edge inset', 'inset', 10, 'number') + mf('Hole diameter', 'diameter', 3.2, 'number'))}`, {
        form: 'mount-pattern'
      });
    case 'interchange': return interchangeDialog();
    case 'handoff-export': return prepareHandoff(el.dataset.target);
    case 'copperbench-import': return chooseFile('copperbench');
    case 'return-import': return chooseFile('return');
    case 'custom-new':
      return definitionDialog();
    case 'edit-definition':
      return definitionDialog(app.panel.components.find(c => app.selection.includes(c.id)));
    case 'hole-circle':
    case 'hole-slot':
      definitionDraft.openings.push(name === 'hole-circle' ? circ(3.2, 10, 0) : rect(8, 3, 10, 0, 1.5));
      return syncDefinitionTables();
    case 'remove-opening':
      definitionDraft.openings.splice(Number(el.dataset.index),1);
      return syncDefinitionTables();
    case 'opening-json': {
      const openings = JSON.parse($('#m-openings').value);
      validateDefinition({...definitionDraft,openings});
      definitionDraft.openings = openings;
      return syncDefinitionTables();
    }
    case 'add-terminal': {
      const terminalId='T_'+uid().replace(/-/g,'').slice(0,12);
      definitionDraft.terminals.push({id:terminalId,name:'Terminal '+(definitionDraft.terminals.length+1),role:'passive',voltage:0,required:false});
      return syncDefinitionTables();
    }
    case 'remove-terminal':
      definitionDraft.terminals.splice(Number(el.dataset.index),1);
      return syncDefinitionTables();
    case 'legend':
      return legendDialog();
    case 'save-library': {
      const c=app.panel.components.find(c=>app.selection.includes(c.id));
      if(!c)return;
      modal('Save reusable part',`<p>Placed components keep their embedded definitions. Changes reach them only through an explicit revision update.</p>${mf('Save as','saveKind','revision','select',options([['revision','New revision of this part'],['fork','Separate part family']],'revision'))}${mf('Revision note','revisionNote','')}`,{form:'save-library',submit:'Save reusable part'});return;
    }
    case 'library-updates': return libraryUpdates();
    case 'apply-revision': {
      const d=app.library.find(d=>d.id===el.dataset.id);
      const c=app.panel.components.find(c=>app.selection.includes(c.id));
      if(!d||!c)throw Error('Select a component and revision.');
      if(c.locked||app.panel.layers.cut.locked)throw Error('Unlock the part and cut layer first.');
      const remove=new Set(assignmentImpact(app.p,c,d).map(n=>n.id));
      mutate('apply library revision',()=>{c.definition=instantiateDefinition(app.p,d);app.p.connections=app.p.connections.filter(n=>!remove.has(n.id));});close();notice('Revision applied. Review the refreshed findings.');return;
    }
    case 'controller-preset': {
      const c=controllerProfiles.find(c=>c.id===$('#m-profile').value);
      $('#m-name').value=c.name;$('#m-source').value=c.source;$('#m-pins').value=c.pins.map(p=>`${p.id},${p.code},${p.voltage},${p.caps.join('|')}`).join('\n');
      $('#controllerNotes').textContent=c.notes||'Primary UNO R3 header capabilities.';return;
    }
    case 'library-export':
      download(JSON.stringify(libraryDocument(app.library), null, 2), 'interfacebench-components.json', 'application/json');
      return;
    case 'library-import':
      return chooseFile('library');
    case 'replace':
      return replacementDialog();
    case 'part-evidence':
      {
        const c = app.panel.components.find(c => app.selection.includes(c.id));
        modal('Part evidence & reference', `${mf('Datasheet URL or source reference', 'source', c.definition.source)}${mf('Measured dimensions / notes', 'notes', c.definition.notes || '', 'textarea')}${c.definition.photo ? `<img alt="Attached component reference photo" style="max-width:100%;max-height:220px" src="${esc(app.p.assets[c.definition.photo]?.data)}">` : ''}<div class="row">${btn('Attach PNG / JPEG photo', 'part-photo')}${btn('Assumptions & evidence', 'registers')}</div>`, {
          form: 'part-evidence'
        });
        return;
      }
    case 'part-photo':
      return chooseFile('photo');
    case 'controller':
      return controllerDialog();
    case 'uno':
      $('#m-name').value = uno().name;
      $('#m-source').value = uno().source;
      $('#m-pins').value = uno().pins.map(p => `${p.id},${p.code},${p.voltage},${p.caps.join('|')}`).join('\n');
      return;
    case 'custom-controller':
      $('#m-name').value = 'Custom controller';
      $('#m-source').value = 'User-declared capabilities';
      $('#m-pins').value = 'D0,0,3.3,digitalIn|digitalOut\nA0,A0,3.3,analogIn\n3V3,,3.3,power\nGND,,0,ground';
      return;
    case 'sort-wires':
      app.wireReverse = !app.wireReverse;
      renderSurface();
      return;
    case 'wire-detail':
      {
        const n = app.p.connections.find(n => n.component === el.dataset.component && n.terminal === el.dataset.terminal);
        app.wireEdit = {
          component: el.dataset.component,
          terminal: el.dataset.terminal
        };
        modal('Connection detail', `${mf('External driver / level interface', 'driver', n?.driver || '')}${mf('Assembly notes', 'notes', n?.notes || '', 'textarea')}<p>Declaring an interface records intent. Its electrical behavior remains unchecked.</p>`, {
          form: 'wire-detail'
        });
        return;
      }
    case 'rules':
      return rulesDialog();
    case 'add-rule':
      {
        const source = app.p.panels.flatMap(b => b.components)[0];
        if (!source) throw Error('Add a component before creating a rule.');
        rulesDraft.push({
          id: uid(),
          source: source.id,
          event: 'press',
          op: 'set',
          variable: Object.keys(app.p.variables)[0],
          value: 1,
          min: 0,
          max: 100,
          target: ''
        });
        renderRules();
        return;
      }
    case 'remove-rule':
      rulesDraft.splice(Number(el.dataset.index), 1);
      renderRules();
      return;
    case 'variables':
      return modal('Initial variables', `<p>One name=value per line. Names use letters, digits and underscores, beginning with a letter. Values are numeric.</p>${mf('Initial state', 'variables', Object.entries(app.p.variables).map(([k, v]) => k + '=' + v).join('\n'), 'textarea')}`, {
        form: 'variables'
      });
    case 'reset-sim':
      app.sim.reset(app.p);
      render();
      return;
    case 'sim-press':
    case 'sim-release':
    case 'sim-toggle':
      {
        const id = app.selection[0];
        if (app.sim) {
          app.sim.fire(app.p, id, name === 'sim-release' ? 'release' : name === 'sim-toggle' ? 'change' : 'press', name === 'sim-release' ? 0 : name === 'sim-toggle' ? app.sim.values[id] ? 0 : 1 : 1);
          render();
        }
        return;
      }
    case 'finding':
      {
        const f = app.checks.find(f => f.key === id);
        if (f.panel) app.panelId = f.panel;else {
          const b = app.p.panels.find(b => b.components.some(c => f.ids.includes(c.id)));
          if (b) app.panelId = b.id;
        }
        app.selection = f.ids.filter(id => objects(app.panel).some(o => o.id === id));
        app.findingIds = app.selection;
        render();
        fit(true);
        return;
      }
    case 'ack':
      {
        const f = app.checks.find(f => f.key === id);
        app.ackKey = id;
        modal('Acknowledge finding', `<p>${esc(f.title)}. This records your decision; it does not resolve or verify the condition.</p>${mf('Reason', 'reason', f.acknowledgment, 'textarea')}`, {
          form: 'ack'
        });
        return;
      }
    case 'registers':
      return registers();
    case 'remove-assumption':
    case 'remove-evidence':
      mutate('remove record', () => {
        const key = name === 'remove-assumption' ? 'assumptions' : 'evidence';
        app.p[key] = app.p[key].filter(a => a.id !== id);
      });
      registers();
      return;
    case 'baselines':
      return baselines();
    case 'compare':
      app.compare = id;
      close();
      renderCanvas(app);
      notice('Baseline overlay shown in violet.');
      return;
    case 'clear-compare':
      app.compare = null;
      close();
      renderCanvas(app);
      return;
    case 'diff':
      {
        const base = app.p.baselines.find(b => b.id === id);
        modal('Changes since ' + base.name, `<ul>${baselineDiff(app.p, base).map(s => `<li style="margin:10px 0">${esc(s)}</li>`).join('') || '<li>No design changes.</li>'}</ul>${btn('Close', 'close')}`);
        return;
      }
    case 'delete-baseline':
      mutate('delete baseline', () => app.p.baselines = app.p.baselines.filter(b => b.id !== id));
      baselines();
      return;
    case 'recovery':
      return recovery();
    case 'export-zip':
      return doExport('zip');
    case 'export-svg':
      return doExport('svg');
    case 'export-pdf':
      return doExport('pdf');
    case 'export-png':
      return doExport('png');
    case 'help':
      return help();
    case 'tour':
      return tour();
    case 'tour-next':
      return nextTour();
    case 'tour-dismiss':
      walk = 5;
      return nextTour();
    case 'update':
      await save();
      if (dirty) throw Error('Save failed. Download a backup before reloading.');
      waitingWorker?.postMessage({
        type: 'ACTIVATE'
      });
      if (!waitingWorker) location.reload();
      return;
  }
}
async function submit(form) {
  const v = Object.fromEntries(new FormData(form));
  switch (form.dataset.form) {
    case 'handoff-export': {
      const pending=pendingInterchange;if(pending?.kind!=='export')throw Error('Review a handoff first.');
      const zip=new JSZip();zip.file(pending.target+'-project.json',JSON.stringify(pending.data,null,2));zip.file('conversion-report.json',JSON.stringify(pending.report,null,2));zip.file('interfacebench-source.json',JSON.stringify(pending.snapshot,null,2));zip.file('README.txt','Open '+pending.target+'-project.json in the companion app. Read conversion-report.json. Keep interfacebench-source.json as your complete design backup. Return native JSON to the original INTERFACEBENCH project through App handoffs.');
      download(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),safeName(pending.snapshot.name)+'-'+pending.target+'-handoff.zip');close();notice('Companion handoff downloaded.');return;
    }
    case 'handoff-import': {
      const pending=pendingInterchange;if(!pending||pending.kind==='export')throw Error('Review an import first.');
      if(pending.snapshot!==stable(designContent(app.p)))throw Error('The design changed while reviewing. Import again for a current comparison.');
      mutate('import companion handoff',()=>{
        if(pending.kind==='copperbench'){app.p.panels.push(clone(pending.panel));app.panelId=pending.panel.id;app.selection=[];}
        else app.p.connections=clone(pending.project.connections);
        app.p.evidence.push({id:uid(),target:'project',text:`Companion import: ${pending.report.target}. ${pending.report.warnings.join(' ')}`,source:'Local file handoff / '+new Date().toISOString()});
      });close();fit();notice('Import applied. Undo is available; review Checks.');return;
    }
    case 'save-library': {
      const c=app.panel.components.find(c=>app.selection.includes(c.id));
      const d=nextRevision(c.definition,app.library,{fork:v.saveKind==='fork',newId:'custom-'+uid()});
      if(c.definition.photo&&app.p.assets[c.definition.photo])d.photoAsset=clone(app.p.assets[c.definition.photo]);
      d.revisionNote=v.revisionNote;validateDefinition(d);
      const next=[...app.library,d];
      if(storageOK)await store.put('library',{id:'custom',parts:next.filter(d=>d.id.startsWith('custom-'))});
      app.library=next;close();renderLeft();notice(`Saved ${d.name} r${d.libraryRevision}. Use Check revisions to update placed parts.`);return;
    }
    case 'legend': {
      const a=app.panel.artwork.find(a=>app.selection.includes(a.id));
      if(a.locked || app.panel.layers[a.layer].locked) throw Error('Unlock the scale and its layer first.');
      mutate('edit scale legend',()=>{
        for(const key of ['labelMode','labelPrefix','labelSuffix']) a[key]=v[key];
        for(const key of ['labelMin','labelMax','labelDecimals','labelEvery','majorEvery','legendSize','legendGap','majorLength','minorLength']) a[key]=Number(v[key]);
        a.customLabels=v.customLabels.split('|').map(s=>s.trim());
      });
      close(); return;
    }
    case 'definition':
      {
        const d = clone(definitionDraft);
        Object.assign(d, {
          name: v.name,
          kind: v.kind,
          prefix: v.prefix || 'C',
          mountReference: v.mountReference,
          source: v.source,
          notes: v.notes,
          verifiedDate: v.verifiedDate,
          verified: !!v.verified
        });
        if (d.verified && (!d.source.trim() || !d.verifiedDate)) throw Error('Verified definitions require a source and verification date.');
        for (const k of ['depth', 'bend', 'minThickness', 'maxThickness']) d[k] = Number(v[k]);
        for (const k of ['front', 'rear', 'access']) d[k] = v[k + 'Type'] === 'circle' ? circ(Number(v[k + 'W'])) : rect(Number(v[k + 'W']), Number(v[k + 'H']), 0, 0, Number(v[k + 'R']));
        d.openings = JSON.parse(v.openings);
        d.terminals = clone(definitionDraft.terminals);
        validateDefinition(d);
        let newId;
        mutate('edit definition', () => {
          if (definitionTarget) {
            const c = app.panel.components.find(c => c.id === definitionTarget);
            if(c.locked||app.panel.layers.cut.locked)throw Error('Unlock this part and cut layer first.');
            const remove=new Set(assignmentImpact(app.p,c,d).map(n=>n.id));
            c.definition = d;
            app.p.connections = app.p.connections.filter(n => !remove.has(n.id));
          } else {
            d.id = 'custom-' + uid();
            const c = addComponent(app.p, app.panel, d, app.panel.w / 2, app.panel.h / 2);
            newId = c.id;
          }
        });
        close();
        if (newId) select([newId]);
        return;
      }
    case 'replace':
      {
        const c = app.panel.components.find(c => app.selection.includes(c.id)),
          d = clone(app.library.find(d => d.id === v.replacement));
        if(c.locked||app.panel.layers.cut.locked)throw Error('Unlock the part and cut layer first.');
        mutate('replace component', () => {
          const remove=new Set(assignmentImpact(app.p,c,d).map(n=>n.id));
          app.p.connections = app.p.connections.filter(n => !remove.has(n.id));
          c.definition = instantiateDefinition(app.p,d);
          c.color = d.color;
        });
        close();
        return;
      }
    case 'controller':
      {
        const pins = v.pins.trim().split('\n').filter(Boolean).map(line => {
          const [id, code, voltage, caps] = line.split(',').map(s => s.trim());
          return {
            id,
            code: code || '',
            voltage: Number(voltage),
            caps: (caps || '').split('|')
          };
        });
        mutate('edit controller', () => app.p.controller = {
          name: v.name,
          source: v.source,
          verifiedDate: new Date().toISOString().slice(0, 10),
          pins
        });
        close();
        return;
      }
    case 'rules':
      mutate('edit rehearsal rules', () => app.p.rules = clone(rulesDraft));
      if (app.sim) app.sim.reset(app.p);
      close();
      render();
      return;
    case 'variables':
      {
        const vars = {};
        for (const line of v.variables.split('\n').filter(Boolean)) {
          const [key, val] = line.split('=').map(s => s.trim());
          if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(key) || !Number.isFinite(Number(val))) throw Error('Use valid variable names and numeric values.');
          vars[key] = Number(val);
        }
        if (!Object.keys(vars).length) throw Error('Keep at least one variable.');
        mutate('edit initial variables', () => app.p.variables = vars);
        if (app.sim) app.sim.reset(app.p);
        close();
        render();
        return;
      }
    case 'ack':
      if (!v.reason.trim()) throw Error('Enter a reason to acknowledge the finding.');
      mutate('acknowledge finding', () => app.p.acknowledgments[app.ackKey] = v.reason);
      close();
      return;
    case 'register':
      if (!v.text.trim()) throw Error('Enter a record.');
      mutate('add ' + v.recordType, () => app.p[v.recordType].push({
        id: uid(),
        target: v.target || 'project',
        text: v.text,
        source: v.source
      }));
      registers();
      return;
    case 'baseline':
      if (!v.name.trim()) throw Error('Enter a baseline name.');
      mutate('capture baseline', () => {
        const snapshot = clone(app.p);
        snapshot.baselines = [];
        app.p.baselines.push({
          id: uid(),
          name: v.name,
          date: new Date().toISOString(),
          snapshot
        });
      });
      close();
      notice('Fabrication baseline captured.');
      return;
    case 'mount-pattern':
      {
        const inset = Number(v.inset),
          d = Number(v.diameter);
        if (inset < d / 2 || inset >= Math.min(app.panel.w, app.panel.h) / 2 || d <= 0) throw Error('Use positive hole diameter and inset within the panel.');
        mutate('add mounting holes', () => {
          const def = clone(starterParts.find(d => d.id === 'mount'));
          def.openings = [circ(d)];
          for (const [x, y] of [[inset, inset], [app.panel.w - inset, inset], [inset, app.panel.h - inset], [app.panel.w - inset, app.panel.h - inset]]) {
            const c = addComponent(app.p, app.panel, def, x, y);
            c.label = '';
          }
        });
        close();
        return;
      }
    case 'part-evidence':
      mutate('update part evidence', () => {
        const c = app.panel.components.find(c => app.selection.includes(c.id));
        c.definition.source = v.source;
        c.definition.notes = v.notes;
      });
      close();
      return;
    case 'wire-detail':
      mutate('edit connection notes', () => {
        const n = connection(app.wireEdit.component, app.wireEdit.terminal);
        n.notes = v.notes;
        n.driver = v.driver;
      });
      close();
      return;
  }
}
function connection(component, terminal) {
  let n = app.p.connections.find(n => n.component === component && n.terminal === terminal);
  if (!n) {
    const c = app.p.panels.flatMap(b => b.components).find(c => c.id === component);
    n = {
      id: uid(),
      component,
      terminal,
      pin: '',
      signal: c.ref + '_' + terminal,
      bus: '',
      pullup: false,
      activeLow: false,
      driver: '',
      notes: ''
    };
    app.p.connections.push(n);
  }
  return n;
}
function fieldChange(el) {
  const [scope, key] = el.dataset.field.split('.');
  const lengthKeys = ['x', 'y', 'w', 'h', 'radius', 'thickness', 'depth', 'edge', 'labelX', 'labelY', 'labelSize', 'size', 'r', 'stroke', 'grid', 'fine', 'coarse'];
  const numericKeys = ['rotation', 'count', 'start', 'end'];
  let v = lengthKeys.includes(key) ? parseUnit(el.value, app.prefs.units) : numericKeys.includes(key) ? Number(el.value) : el.value;
  if (scope === 'prefs') {
    if (v <= 0 || v > 1000) throw Error('Workspace increments must be positive and at most 1000 mm.');
    app.prefs[key] = v;
    prefsSave();
    renderCanvas(app);
    return;
  }
  const object = scope === 'panel' ? app.panel : scope === 'object' ? objects(app.panel).find(o => app.selection.includes(o.id)) : app.p;
  if (scope === 'object' && (object.locked || app.panel.layers[object.definition?'cut':object.layer].locked)) throw Error('Unlock this object before editing.');
  mutate(`edit ${key}`, () => {
    if (scope === 'panel' && ['w', 'h'].includes(key) && object.shape === 'imported') {
      const ratio = v / object[key];
      object.outline = object.outline.map(p => ({
        ...p,
        [key === 'w' ? 'x' : 'y']: p[key === 'w' ? 'x' : 'y'] * ratio
      }));
    }
    object[key] = v;
    if (scope === 'panel') {
      if (key === 'shape' && v === 'imported' && !object.outline.length) throw Error('Use Import outline to load a closed SVG polygon.');
      if (object.shape === 'circle' && ['w', 'h', 'shape'].includes(key)) {
        const d = key === 'h' ? object.h : object.w;
        object.w = d;
        object.h = d;
      }
    }
  });
}
function reportError(e) {
  if ($('#dialog').open && $('.form-error')) $('.form-error').textContent = e.message;else notice(e.message, true);
  console.error(e);
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el) {
    e.preventDefault();
    el._shift = e.shiftKey;
    Promise.resolve(action(el.dataset.action, el)).catch(reportError);
  }
});
document.addEventListener('submit', e => {
  if (e.target.matches('[data-form]')) {
    e.preventDefault();
    Promise.resolve(submit(e.target)).catch(reportError);
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'partSearch') $('#partGrid').innerHTML = partsHTML(el.value);
  if (el.id === 'objectSearch') $('#objectList').innerHTML = objectList(el.value);
  if (el.id === 'wireSearch') $('#wireBody').innerHTML = wireTable(el.value);
  if (el.id === 'commandSearch') commandMenu(el.value);
  if (el.id === 'simRange' && app.sim) {
    app.sim.fire(app.p, app.selection[0], 'change', Number(el.value));
    renderCanvas(app);
    renderLeft();
  }
  if (el.dataset.rule) {
    const r = rulesDraft[Number(el.dataset.index)];
    r[el.dataset.rule] = ['value', 'min', 'max'].includes(el.dataset.rule) ? Number(el.value) : el.value;
  }
});
document.addEventListener('change', e => {
  try {
    const el = e.target;
    if (el.dataset.opening) {
      definitionDraft.openings[Number(el.dataset.index)][el.dataset.opening]=Number(el.value);
      $('#m-openings').value=JSON.stringify(definitionDraft.openings,null,2); return;
    }
    if (el.dataset.terminal) {
      definitionDraft.terminals[Number(el.dataset.index)][el.dataset.terminal]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value; return;
    }
    if (el.dataset.field) return fieldChange(el);
    if (['mode', 'theme', 'units', 'snap', 'envelopes'].includes(el.id)) {
      app.prefs[el.id === 'units' ? 'units' : el.id] = el.type === 'checkbox' ? el.checked : el.value;
      prefsSave();
      render();
    }
    if (el.dataset.layer) mutate('change layer settings', () => app.panel.layers[el.dataset.layer][el.dataset.layerKey] = el.checked);
    if (el.dataset.wire) mutate('edit wiring', () => connection(el.dataset.component, el.dataset.terminal)[el.dataset.wire] = el.type === 'checkbox' ? el.checked : el.value);
    if (el.id === 'm-replacement') replacementSummary();
    if (el.id === 'checkFilter') {
      app.checkFilter = el.value;
      renderRight();
    }
    if (el.id === 'fileInput' && el.files[0]) readFile(el.files[0], app.importKind).catch(reportError);
  } catch (err) {
    reportError(err);
  }
});
$('#inspector .inspector-tabs').addEventListener('click', e => {
  if (e.target.classList.contains('inspector-tabs')) document.body.classList.remove('show-inspector');
});
// Camera / gesture state is deliberately separate from project mutations.
let drag = null,
  space = false,
  pointers = new Map(),
  pinch = null,
  framePending = false;
function point(e, physical = true) {
  const svg = $('#canvas'),
    p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
  return physical && app.side === 'rear' ? mirror(p, app.panel.w) : {
    x: p.x,
    y: p.y
  };
}
function zoom(factor, anchor) {
  const a = anchor || {
    x: app.view.x + app.view.w / 2,
    y: app.view.y + app.view.h / 2
  };
  const w = app.view.w * factor;
  if (w < 8 || w > 20000) return;
  app.view = {
    x: a.x + (app.view.x - a.x) * factor,
    y: a.y + (app.view.y - a.y) * factor,
    w,
    h: app.view.h * factor
  };
  renderCanvas(app);
  renderStatus();
}
function scheduleCanvas() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      renderCanvas(app);
    });
  }
}
$('#canvas').addEventListener('wheel', e => {
  e.preventDefault();
  zoom(Math.exp(Math.max(-1, Math.min(1, e.deltaY * .001))), point(e, false));
}, {
  passive: false
});
$('#canvas').addEventListener('pointerdown', e => {
  if (e.button === 2) return;
  const svg = $('#canvas');
  svg.focus();
  svg.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });
  if (pointers.size === 2) {
    if (drag?.before) app.p = drag.before;
    drag = null;
    const ps = [...pointers.values()];
    pinch = {
      distance: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y),
      view: clone(app.view)
    };
    return;
  }
  const pt = point(e),
    raw = point(e, false),
    target = e.target.closest('[data-object]');
  if (app.tool === 'measure' && !app.sim) {
    if (app.measure.length === 2) app.measure = [];
    app.measure.push(pt);
    renderCanvas(app);
    return;
  }
  if (app.sim) {
    if (target) {
      const c = app.panel.components.find(c => c.id === target.dataset.object);
      if (c) {
        select([c.id]);
        showInspector();
        const k = c.definition.kind;
        if (k === 'button') {
          app.sim.fire(app.p, c.id, 'press', 1);
          drag = {
            kind: 'button',
            id: c.id
          };
        }
        if (k === 'toggle') app.sim.fire(app.p, c.id, 'change', app.sim.values[c.id] ? 0 : 1);
        if (k === 'encoder') app.sim.fire(app.p, c.id, 'change', Math.min(100, (app.sim.values[c.id] || 0) + (e.shiftKey ? -5 : 5)));
        render();
      }
    }
    return;
  }
  if (space || app.tool === 'pan' || e.button === 1) {
    drag = {
      kind: 'pan',
      raw,
      view: clone(app.view)
    };
    svg.style.cursor = 'grabbing';
    return;
  }
  if (target) {
    const o = objects(app.panel).find(o => o.id === target.dataset.object);
    if (!o) return;
    const ids = o.group ? objects(app.panel).filter(x => x.group === o.group).map(x => x.id) : [o.id];
    if (e.shiftKey) {
      select(ids, {
        toggle: true
      });
      return;
    }
    if (!app.selection.includes(o.id)) select(ids);
    const unlocked = objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked);
    if (unlocked.length) drag = {
      kind: 'move',
      pt,
      before: clone(app.p),
      objects: unlocked.map(o => ({
        id: o.id,
        x: o.x,
        y: o.y
      })),
      moved: false
    };
  } else {
    if (!e.shiftKey) select([]);
    drag = {
      kind: 'marquee',
      raw
    };
    app.marquee = {
      x: raw.x,
      y: raw.y,
      x2: raw.x,
      y2: raw.y
    };
  }
});
$('#canvas').addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });
  if (pinch && pointers.size === 2) {
    const ps = [...pointers.values()],
      d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y),
      factor = pinch.distance / d;
    if (!Number.isFinite(factor)) return;
    const v = pinch.view;
    app.view = {
      x: v.x + v.w * (1 - factor) / 2,
      y: v.y + v.h * (1 - factor) / 2,
      w: v.w * factor,
      h: v.h * factor
    };
    scheduleCanvas();
    return;
  }
  if (!drag) return;
  const pt = point(e),
    raw = point(e, false);
  if (drag.kind === 'pan') {
    app.view.x += drag.raw.x - raw.x;
    app.view.y += drag.raw.y - raw.y;
    scheduleCanvas();
  }
  if (drag.kind === 'move') {
    let dx = pt.x - drag.pt.x,
      dy = pt.y - drag.pt.y;
    const first = drag.objects[0];
    if (app.prefs.snap && !e.altKey) {
      dx = Math.round((first.x + dx) / app.prefs.grid) * app.prefs.grid - first.x;
      dy = Math.round((first.y + dy) / app.prefs.grid) * app.prefs.grid - first.y;
    }
    app.guides = [];
    if (!e.altKey) {
      const other = objects(app.panel).filter(o => !app.selection.includes(o.id));
      for (const axis of ['x', 'y']) {
        const v = first[axis] + (axis === 'x' ? dx : dy),
          near = other.find(o => Math.abs(o[axis] - v) < app.view.w / ($('#canvas').clientWidth || 800) * 4);
        if (near) {
          if (axis === 'x') dx = near.x - first.x;else dy = near.y - first.y;
          app.guides.push({
            axis,
            value: near[axis]
          });
        }
      }
    }
    for (const init of drag.objects) {
      const o = objects(app.panel).find(o => o.id === init.id);
      o.x = init.x + dx;
      o.y = init.y + dy;
    }
    drag.moved = Math.abs(dx) + Math.abs(dy) > .000001;
    scheduleCanvas();
  }
  if (drag.kind === 'marquee') {
    app.marquee.x2 = raw.x;
    app.marquee.y2 = raw.y;
    scheduleCanvas();
  }
});
function endPointer(e, cancel = false) {
  pointers.delete(e.pointerId);
  if (pinch) {
    if (pointers.size < 2) pinch = null;
    drag = null;
    return;
  }
  if (!drag) return;
  if (drag.kind === 'move') {
    if (cancel) {
      app.p = drag.before;
    } else if (drag.moved) {
      app.past.push({
        p: drag.before,
        label: 'move selection'
      });
      if (app.past.length > 40) app.past.shift();
      app.future = [];
      app.p.modified = new Date().toISOString();
      mark();
      app.checks = runChecks(app.p);
    }
  }
  if (drag.kind === 'marquee' && app.marquee && !cancel) {
    const m = app.marquee,
      r = {
        x: Math.min(m.x, m.x2),
        y: Math.min(m.y, m.y2),
        w: Math.abs(m.x2 - m.x),
        h: Math.abs(m.y2 - m.y)
      };
    if (app.side === 'rear') r.x = app.panel.w - r.x - r.w;
    app.selection = objects(app.panel).filter(o => {
      const b = objectBounds(o, app.p);
      return b.x >= r.x && b.y >= r.y && b.x + b.w <= r.x + r.w && b.y + b.h <= r.y + r.h;
    }).map(o => o.id);
  }
  if (drag.kind === 'button') app.sim.fire(app.p, drag.id, 'release', 0);
  drag = null;
  app.marquee = null;
  app.guides = [];
  $('#canvas').style.cursor = '';
  render();
}
$('#canvas').addEventListener('pointerup', e => endPointer(e));
$('#canvas').addEventListener('pointercancel', e => endPointer(e, true));
$('#canvas').addEventListener('dblclick', e => {
  if (e.target.closest('[data-object]')) showInspector();
});
$('#canvas').addEventListener('contextmenu', e => {
  e.preventDefault();
  const id = e.target.closest('[data-object]')?.dataset.object;
  if (id && !app.selection.includes(id)) select([id]);
  modal('Selection actions', `<div class="export-grid">${[['Duplicate', 'duplicate'], ['Rotate 90°', 'rotate'], ['Lock / unlock', 'lock'], ['Arrange', 'arrange'], ['Delete', 'delete']].map(([l, a]) => btn(l, 'command', '', `data-command="${a}"`)).join('')}</div>`);
});
window.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable;
  if (e.key === 'Escape' && !$('#dialog').open) {
    if (drag?.before) {
      app.p = drag.before;
      drag = null;
      app.guides = [];
      render();
      return;
    }
    app.selection = [];
    app.measure = [];
    app.marquee = null;
    document.body.classList.remove('show-inspector', 'show-browser-mobile');
    render();
    return;
  }
  if (typing || $('#dialog').open) return;
  if (app.sim && !['Escape', '?'].includes(e.key)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    action('backup');
  }
  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo(e.shiftKey);
  }
  if (mod && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    commandMenu();
  }
  if (mod && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    duplicateSelected();
  }
  if (mod && e.key.toLowerCase() === 'g') {
    e.preventDefault();
    action(e.shiftKey ? 'ungroup' : 'group');
  }
  if (mod && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    select(objects(app.panel).map(o => o.id));
  }
  if (!mod) {
    const k = e.key.toLowerCase();
    if (k === ' ') {
      e.preventDefault();
      space = true;
    }
    if (k === 'v') action('select-tool');
    if (k === 'h') action('pan-tool');
    if (k === 'm') action('measure');
    if (k === 'f') fit();
    if (k === 'r' && !app.sim) action('rotate');
    if (k === 'delete' || k === 'backspace') {
      e.preventDefault();
      action('delete');
    }
    if (k === '?') help();
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && app.selection.length && !app.sim) {
      e.preventDefault();
      const n = e.shiftKey ? app.prefs.coarse : app.prefs.fine;
      mutate('nudge selection', () => objects(app.panel).filter(o => app.selection.includes(o.id) && !o.locked && !app.panel.layers[o.definition ? 'cut' : o.layer].locked).forEach(o => {
        o.x += e.key === 'ArrowRight' ? n : e.key === 'ArrowLeft' ? -n : 0;
        o.y += e.key === 'ArrowDown' ? n : e.key === 'ArrowUp' ? -n : 0;
      }));
    }
  }
});
window.addEventListener('keyup', e => {
  if (e.key === ' ') space = false;
});
window.addEventListener('blur', () => {
  space = false;
});
for (const divider of $$('.splitter')) {
  let start;
  divider.addEventListener('pointerdown', e => {
    start = {
      x: e.clientX,
      w: divider.classList.contains('left-split') ? app.prefs.leftWidth : app.prefs.rightWidth
    };
    divider.setPointerCapture(e.pointerId);
  });
  divider.addEventListener('pointermove', e => {
    if (!start) return;
    const left = divider.classList.contains('left-split');
    app.prefs[left ? 'leftWidth' : 'rightWidth'] = Math.max(180, Math.min(440, start.w + (e.clientX - start.x) * (left ? 1 : -1)));
    applyPrefs();
  });
  divider.addEventListener('pointerup', () => {
    start = null;
    prefsSave();
    fit();
  });
  divider.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const left = divider.classList.contains('left-split'),
      key = left ? 'leftWidth' : 'rightWidth';
    app.prefs[key] = Math.max(180, Math.min(440, app.prefs[key] + (e.key === 'ArrowRight' ? 10 : -10) * (left ? 1 : -1)));
    prefsSave();
    fit();
  });
}
window.addEventListener('beforeunload', e => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});
window.addEventListener('online', render);
window.addEventListener('offline', render);
window.addEventListener('resize', () => {
  clearTimeout(app.resizeTimer);
  app.resizeTimer = setTimeout(() => fit(), 150);
});
async function boot() {
  try {
    const response = await fetch('./fonts/DejaVuSans.ttf');
    if (!response.ok) throw Error('Bundled font could not be loaded. Upload the complete server folder, including fonts/.');
    setFont(globalThis.opentype.parse(await response.arrayBuffer()));
    try {
      await store.open();
      storageOK = true;
      const [prefs, last, custom, history] = await Promise.all([store.read('settings', 'preferences'), store.read('settings', 'last'), store.read('library', 'custom'), store.all('history')]);
      if (prefs?.value) Object.assign(app.prefs, prefs.value);
      if (custom?.parts) app.library.push(...custom.parts.map(validateDefinition));
      app.history = history;
      if (last?.value) {
        const p = await store.load(last.value);
        if (p) {
          app.p = validateProject(p);
          app.hasProject = true;
        }
      }
      store.channel.onmessage = e => {
        if (e.data.id === app.p.id && e.data.seq !== (store.seq.get(app.p.id) || 0)) {
          saveState('! Changed in another tab', true);
          notice('This project changed in another tab. Reopen it from Projects, or use Recovery → Save as a new project.', true);
        }
      };
    } catch (e) {
      storageOK = false;
      notice('Local storage unavailable: ' + e.message + ' Use Backup to save your work.', true);
    }
    app.panelId = app.p.panels[0].id;
    app.checks = runChecks(app.p);
    $('#boot').hidden = true;
    $('#app').hidden = false;
    render();
    fit();
    saveState(storageOK ? app.hasProject ? '● Saved locally' : '○ Unsaved' : '! Backup needed', !storageOK);
    if (!app.hasProject) await home();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js', {
        scope: './'
      }).then(reg => {
        if (reg.waiting) {
          waitingWorker = reg.waiting;
          $('#updateBanner').hidden = false;
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorker = worker;
              $('#updateBanner').hidden = false;
            }
          });
        });
      }).catch(e => notice('Offline cache could not be installed: ' + e.message, true));
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (waitingWorker) location.reload();
      });
    }
  } catch (e) {
    $('#boot').innerHTML = `<h2>Could not open INTERFACEBENCH</h2><p>${esc(e.message)}</p><p>Serve the complete folder over localhost or HTTPS. See README.html for launch instructions.</p>`;
    console.error(e);
  }
}
// Diagnostic hook exposes data and pure operations only; no network or hidden telemetry.
window.INTERFACEBENCH = {
  app,
  store,
  save,
  mutate,
  render,
  select,
  fit,
  openProject,
  runChecks,
  validateProject,
  svgExport,
  pdfExport,
  pngExport,
  fabricationZip,
  readFile,
  doExport,
  submit,
  action
};
boot();
