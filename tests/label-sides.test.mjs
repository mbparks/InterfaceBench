import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './setup.mjs';
import {newProject,addComponent,starterParts,labelVisible,clone,fingerprints,baselineDiff,uid,circ} from '../dist/js/model.js';
import {validateProject} from '../dist/js/validation.js';
import {scene,rearLabelScene,textShape} from '../dist/js/geometry.js';
import {renderCanvas} from '../dist/js/canvas.js';
import {svgExport,pdfExport,fabricationZip} from '../dist/js/exports.js';
setup();
function fixture(){const p=newProject('Two-sided labels'),b=p.panels[0];b.w=120;b.h=90;const c=addComponent(p,b,starterParts[0],30,35);c.label='FABRICATED LABEL';return {p,b,c};}
function render(p,b,side){const svg={clientWidth:800,setAttribute(k,v){this[k]=v;},innerHTML:''};globalThis.document={getElementById:id=>id==='canvas'?svg:{}};renderCanvas({p,panel:b,side,prefs:{grid:5,units:'mm'},view:{x:-10,y:-10,w:140,h:110},selection:[],sim:null});return svg.innerHTML;}

test('the two component flags independently control all four fabrication and canvas combinations',()=>{
 const {p,b,c}=fixture();
 for(const front of [false,true])for(const rear of [false,true]){
  c.labelSides={front,rear};
  assert.equal(render(p,b,'front').includes('data-component-label='),front);
  const output=render(p,b,'rear');assert.equal(output.includes('data-component-label='),rear);assert.equal(output.includes('data-component-ref='),false);
  assert.equal(scene(p,b).filter(x=>x.owner===c.id&&x.layer===c.layer).length,front?1:0);
  assert.equal(scene(p,b,{side:'rear'}).length,rear?1:0);
 }
 c.labelSides={front:true,rear:true};b.layers.engrave.export=false;
 assert.equal(scene(p,b).filter(x=>x.layer==='engrave').length,0);assert.equal(rearLabelScene(b).length,0);
});

test('old panel masters migrate once into component flags without a hidden veto; malformed settings reject',()=>{
 const {p,b,c}=fixture();delete c.labelSides;const old=clone(p);
 assert.deepEqual(validateProject(p),old);assert.equal(labelVisible(b,c,'front'),true);assert.equal(labelVisible(b,c,'rear'),false);
 b.labelSides={front:false,rear:true};c.labelSides={front:true,rear:true};const before=clone(p),migrated=validateProject(p);
 assert.deepEqual(p,before);assert.equal(migrated.panels[0].labelSides,undefined);assert.deepEqual(migrated.panels[0].components[0].labelSides,{front:false,rear:true});
 migrated.panels[0].components[0].labelSides.front=true;assert.equal(labelVisible(migrated.panels[0],migrated.panels[0].components[0],'front'),true);
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(migrated))),migrated);
 for(const value of [false,[],{front:'false'},{back:true},null]){const bad=clone(migrated);bad.panels[0].components[0].labelSides=value;assert.throws(()=>validateProject(bad),/Label sides/);}
 const bad=clone(p);bad.panels[0].labelSides={front:'false'};assert.throws(()=>validateProject(bad),/Label sides/);
});

test('rear fabrication contains exactly the selected labels, without bodies, cuts, reference numbers or front artwork',()=>{
 const {p,b,c}=fixture();b.artwork.push({id:uid(),type:'text',text:'LOGO',x:80,y:20,rotation:0,size:4,color:'#233b2b',layer:'uv'});
 const before=scene(p,b);c.labelSides={front:false,rear:true};const after=scene(p,b);
 assert.deepEqual(after.filter(x=>x.layer==='cut'),before.filter(x=>x.layer==='cut'));assert.deepEqual(after.filter(x=>x.layer==='uv'),before.filter(x=>x.layer==='uv'));
 assert.equal(before.length-after.length,1);const rear=scene(p,b,{side:'rear'});assert.equal(rear.length,1);assert.deepEqual(rear[0].shape,textShape(c.label,0,0,c.labelSize,'center'));assert.equal(rear[0].layer,'engrave');
 const svg=svgExport(p,b,{side:'rear'});assert.match(svg,/rear label fabrication/);assert.doesNotMatch(svg,/<rect |<circle |ASSEMBLY|assembly guide|data-component-ref/);
});

test('rear label placement reflects an asymmetric rotated anchor while keeping readable outlined glyphs and declared origins',()=>{
 const {p,b,c}=fixture();b.w=100;c.x=25;c.y=40;c.rotation=90;c.labelX=4;c.labelY=6;c.definition.openings=[circ(6,8,0)];c.labelSides={front:false,rear:true};
 const rear=scene(p,b,{side:'rear'});assert.equal(rear.length,1);assert.deepEqual(rear[0].transform,{x:81,y:44,rotation:-90});assert.deepEqual(rear[0].shape,textShape(c.label,0,0,c.labelSize,'center'));
 for(const [origin,box] of [['top-left','0 0 100 90'],['center','-50 -45 100 90'],['bottom-left','0 -90 100 90']]){b.origin=origin;const svg=svgExport(p,b,{side:'rear',fit:3});assert.ok(svg.includes(`viewBox="${box}"`));assert.match(svg,/fit allowance per side 0 mm/);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);}
});

test('component fabrication sides change artwork freshness and baseline diff without changing cuts or wiring',()=>{
 const {p,b,c}=fixture(),original=clone(p),before=fingerprints(p);c.labelSides.front=false;
 const after=fingerprints(p);assert.equal(after.geometry,before.geometry);assert.equal(after.wiring,before.wiring);assert.notEqual(after.artwork,before.artwork);
 assert.ok(baselineDiff(p,{snapshot:original}).some(x=>x.includes(c.ref)));const middle=after.artwork;c.labelSides.rear=true;assert.notEqual(fingerprints(p).artwork,middle);
});

test('PDF and frozen ZIP supply separate manufacturing faces automatically, and no rear file when rear labels are off',async()=>{
 const {p,b,c}=fixture();c.labelSides={front:false,rear:true};
 const pdf=await PDFLib.PDFDocument.load(await pdfExport(p,b,{side:'rear',pdfMode:'sheet'}));assert.equal(pdf.getPageCount(),1);
 const before=JSON.stringify(p),result=await fabricationZip(p,{png:false,pdf:true,pdfMode:'sheet',side:'rear'}),zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
 assert.equal(JSON.stringify(p),before);for(const name of ['1-Main-panel-front.svg','1-Main-panel-rear-labels.svg','1-Main-panel-front.pdf','1-Main-panel-rear-labels.pdf'])assert.ok(zip.file(name),name);
 const manifest=JSON.parse(await zip.file('manifest.json').async('string'));assert.ok(manifest.files.some(f=>f.side==='rear'));assert.deepEqual(manifest.panels[0].labelSides,[{reference:c.ref,front:false,rear:true}]);assert.deepEqual(JSON.parse(await zip.file('project.json').async('string')),p);
 c.labelSides.rear=false;const empty=await fabricationZip(p,{png:false,pdf:false}),emptyZip=await JSZip.loadAsync(await empty.blob.arrayBuffer());assert.ok(!Object.keys(emptyZip.files).some(n=>n.includes('rear-labels')));
});
