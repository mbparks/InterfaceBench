// Static render of the actual canvas/export geometry; not browser interaction QA.
import fs from 'node:fs';
import {newProject,addComponent,VERSION} from '../dist/js/model.js';
import {builtinParts} from '../dist/js/component-library.js';
import {renderCanvas} from '../dist/js/canvas.js';
import {svgExport,pdfExport} from '../dist/js/exports.js';
import {setup} from '../tests/setup.mjs';
setup();
const p=newProject('Clean front · labeled rear'),b=p.panels[0];b.w=180;b.h=100;b.depth=60;
for(const [id,x,label] of [['button',40,'RESET'],['pot',90,'GAIN'],['gen-usb-c-panel-coupler',140,'USB']]){const c=addComponent(p,b,builtinParts.find(d=>d.id===id),x,45);c.label=label;c.labelSides={front:false,rear:true};}
fs.writeFileSync('examples/clean-front-labeled-rear.json',JSON.stringify(p,null,2));
fs.writeFileSync('qa/v142-front-fabrication.svg',svgExport(p,b));
fs.writeFileSync('qa/v142-rear-labels.svg',svgExport(p,b,{side:'rear'}));
fs.writeFileSync('qa/v142-rear-labels.pdf',await pdfExport(p,b,{side:'rear',pdfMode:'sheet'}));
const svg={clientWidth:1100,clientHeight:680,setAttribute(k,v){this[k]=v;},innerHTML:''};
globalThis.document={getElementById:id=>id==='canvas'?svg:{}};
for(const side of ['front','rear']){
  renderCanvas({p,panel:b,selection:[],prefs:{grid:5,units:'mm'},view:{x:-20,y:-20,w:220,h:140},side});
  const colors={'--grid':'#64765735','--muted':'#9fad95','--accent':'#c6e79a','--bg':'#15261f','--danger':'#f0a293'};
  const body=svg.innerHTML.replace(/var\((--[\w-]+)\)/g,(_,key)=>colors[key]);
  fs.writeFileSync(`qa/v142-${side}-canvas.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="700" viewBox="${svg.viewBox}"><rect x="-1000" y="-1000" width="5000" height="5000" fill="#15261f"/>${body}</svg>`);
}
console.log(`Generated ${VERSION} label-side geometry fixture.`);
