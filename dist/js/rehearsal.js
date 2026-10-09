import { clone } from './model.js';
export class Rehearsal {
  constructor(p) {
    this.reset(p);
  }
  reset(p) {
    this.variables = clone(p.variables);
    this.values = Object.fromEntries(p.panels.flatMap(b => b.components.map(c => [c.id, c.value || 0])));
    this.enabled = {};
    this.displays = Object.fromEntries(p.panels.flatMap(b => b.components.map(c => [c.id, c.display || 'READY'])));
    this.trace = [];
  }
  fire(p, id, event, input = 0) {
    if (this.enabled[id] === false) return;
    this.values[id] = input;
    this.trace.unshift(`${event}: ${p.panels.flatMap(b => b.components).find(c => c.id === id)?.ref || id} → ${input}`);
    for (const r of p.rules.filter(r => r.source === id && r.event === event)) {
      const old = this.variables[r.variable] || 0;
      let v = old;
      if (r.op === 'set') v = r.value;
      if (r.op === 'toggle') v = old ? 0 : 1;
      if (r.op === 'increment') v = old + r.value;
      if (r.op === 'map') v = r.min + Math.max(0, Math.min(100, input)) / 100 * (r.max - r.min);
      if (r.op === 'clamp') v = Math.max(r.min, Math.min(r.max, old));
      this.variables[r.variable] = v;
      if (r.target) {
        if (r.op === 'enable') this.enabled[r.target] = !!v;else if (r.op === 'show' || r.op === 'map') this.displays[r.target] = `${r.variable.toUpperCase()} ${+v.toFixed(2)}`;else this.values[r.target] = v;
      }
      this.trace.unshift(`  ${r.op} ${r.variable} = ${+v.toFixed(3)}`);
    }
    this.trace = this.trace.slice(0, 60);
  }
}
