import {esc,roles} from './model.js';
const input=(label,value,attrs='',type='number')=>`<input aria-label="${esc(label)}" ${attrs} type="${type}" ${type==='number'?'step="any"':''} value="${esc(value??'')}">`;
export function openingRows(openings){return openings.map((s,i)=>{
 const field=(key,value)=>input(`Opening ${i+1} ${key} (mm)`,value,`data-opening="${key}" data-index="${i}"`);
 const editable=['circle','rect'].includes(s.type);
 return `<tr><td>${esc(s.type)} ${i+1}</td><td>${editable?field('x',s.x||0):'Path'}</td><td>${editable?field('y',s.y||0):'—'}</td><td>${editable?field(s.type==='circle'?'d':'w',s.d??s.w):'Imported geometry'}</td><td>${s.type==='rect'?field('h',s.h):'—'}</td><td>${s.type==='rect'?field('r',s.r||0):'—'}</td><td><button type="button" data-action="remove-opening" data-index="${i}" aria-label="Remove opening ${i+1}">×</button></td></tr>`;
 }).join('');}
export function terminalRows(terminals){return terminals.map((t,i)=>{
 const attrs=key=>`data-terminal="${key}" data-index="${i}"`;
 return `<tr><td><code title="Stable identity">${esc(t.id)}</code></td><td>${input(`Terminal ${i+1} name`,t.name,attrs('name'),'text')}</td><td><select aria-label="Terminal ${i+1} role" ${attrs('role')}>${roles.map(r=>`<option ${t.role===r?'selected':''}>${r}</option>`).join('')}</select></td><td>${input(`Terminal ${i+1} voltage`,t.voltage,attrs('voltage'))}</td><td><input type="checkbox" aria-label="Terminal ${i+1} required" ${attrs('required')} ${t.required!==false?'checked':''}></td><td><button type="button" data-action="remove-terminal" data-index="${i}" aria-label="Remove terminal ${i+1}">×</button></td></tr>`;
 }).join('');}
