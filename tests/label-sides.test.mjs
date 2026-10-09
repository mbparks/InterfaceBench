import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './setup.mjs';
import {newProject,addComponent,starterParts,labelVisible,clone,fingerprints,baselineDiff,uid,circ} from '../dist/js/model.js';
import {validateProject} from '../dist/js/validation.js';
import {scene,rearAssemblyScene,bbox,worldCommands,textShape} from '../dist/js/geometry.js';
import {renderCanvas} from '../dist/js/canvas.js';
import {svgExport,pdfExport,fabricationZip} from '../dist/js/exports.js';
setup();
function fixture(){const p=newProject('Two-sided labels'),b=p.panels[0];b.w=120;b.h=90;const c=addComponent(p,b,starterParts[0],30,35);c.label='ASSEMBLY LABEL';return {p,b,c};}
function render(p,b,side){const svg={clientWidth:800,setAttribute(k,v){this[k]=v;},innerHTML:''};globalThis.document={getElementById:id=>id==='canvas'?svg:{}};renderCanvas({p,panel:b,side,prefs:{grid:5,units:'mm'},view:{x:-10,y:-10,w:140,h:110},selection:[],sim:null});return svg.innerHTML;}

test('all front/rear combinations independently control canvas labels and rear references',()=>{
  const {p,b,c}=fixture();
  for(const front of [false,true])for(const rear of [false,true]){
    b.labelSides={front,rear};
    assert.equal(render(p,b,'front').includes('data-component-label='),front);
    const output=render(p,b,'rear');assert.equal(output.includes('data-component-label='),rear);assert.equal(output.includes('data-component-ref='),rear);
    assert.equal(scene(p,b).filter(x=>x.owner===c.id&&x.layer===c.layer).length,front?1:0);
    assert.equal(rearAssemblyScene(b).filter(x=>x.annotation).length,rear?2:0);
  }
  b.labelSides={front:true,rear:true};c.labelSides={front:false,rear:true};assert.equal(labelVisible(b,c,'front'),false);assert.equal(labelVisible(b,c,'rear'),true);
  b.labelSides.rear=false;assert.equal(labelVisible(b,c,'rear'),false);
  b.labelSides.rear=true;b.layers.engrave.visible=false;b.layers.engrave.export=false;
  assert.equal(render(p,b,'rear').includes('data-component-label='),true);assert.equal(rearAssemblyScene(b).filter(x=>x.annotation).length,2);
});

test('legacy projects default to both sides; side settings round-trip and reject malformed imports',()=>{
  const {p,b,c}=fixture();delete b.labelSides;delete c.labelSides;const old=clone(p);
  assert.deepEqual(validateProject(p),old);assert.equal(labelVisible(b,c,'front'),true);assert.equal(labelVisible(b,c,'rear'),true);
  b.labelSides={front:false,rear:true};c.labelSides={front:true,rear:false};assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);
  for(const value of [false,[],{front:'false'},{back:true},null]){const bad=clone(p);bad.panels[0].labelSides=value;assert.throws(()=>validateProject(bad),/Label sides/);}
  const bad=clone(p);bad.panels[0].components[0].labelSides={rear:0};assert.throws(()=>validateProject(bad),/Label sides/);
});

test('front labels can be omitted without changing cut geometry or independent artwork',()=>{
  const {p,b,c}=fixture();b.artwork.push({id:uid(),type:'text',text:'LOGO',x:80,y:20,rotation:0,size:4,color:'#233b2b',layer:'uv'});
  const before=scene(p,b),svg=svgExport(p,b);b.labelSides.front=false;
  const after=scene(p,b);assert.deepEqual(after.filter(x=>x.layer==='cut'),before.filter(x=>x.layer==='cut'));assert.deepEqual(after.filter(x=>x.layer==='uv'),before.filter(x=>x.layer==='uv'));
  assert.equal(before.length-after.length,1);assert.notEqual(svgExport(p,b),svg);assert.match(svgExport(p,b),/front fabrication view/);
  c.labelSides.rear=false;assert.deepEqual(scene(p,b),after);
});

test('rear assembly reflects asymmetric cut positions but keeps rotated label glyphs readable',()=>{
  const {p,b,c}=fixture();b.w=100;c.x=25;c.y=40;c.rotation=90;c.labelX=4;c.labelY=6;c.definition.openings=[circ(6,8,0)];b.labelSides.front=false;
  const rear=rearAssemblyScene(b),cut=rear.find(x=>x.layer==='cut'),bounds=bbox(worldCommands(cut.shape,cut.transform));
  for(const [key,expected] of Object.entries({x:72,y:45,w:6,h:6}))assert.ok(Math.abs(bounds[key]-expected)<1e-8,key);
  const label=rear.find(x=>x.annotation==='label');assert.deepEqual(label.transform,{x:81,y:44,rotation:-90});assert.deepEqual(label.shape,textShape(c.label,0,0,c.labelSize,'center'));
  const svg=svgExport(p,b,{view:'rear-assembly',fit:3});assert.match(svg,/REAR ASSEMBLY GUIDE/);assert.match(svg,/not a cutting template/);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
});

test('label switches affect artwork freshness and baseline diff without changing cuts or wiring',()=>{
  const {p,b,c}=fixture(),original=clone(p),before=fingerprints(p);b.labelSides.front=false;
  const after=fingerprints(p);assert.equal(after.geometry,before.geometry);assert.equal(after.wiring,before.wiring);assert.notEqual(after.artwork,before.artwork);
  assert.ok(baselineDiff(p,{snapshot:original}).some(x=>x.includes('labelSides')));
  const middle=after.artwork;c.labelSides.rear=false;assert.notEqual(fingerprints(p).artwork,middle);
});

test('rear PDF and frozen ZIP preserve independent settings and separate assembly files',async()=>{
  const {p,b}=fixture();b.labelSides={front:false,rear:true};
  const pdf=await PDFLib.PDFDocument.load(await pdfExport(p,b,{view:'rear-assembly',pdfMode:'sheet'}));assert.equal(pdf.getPageCount(),1);
  const before=JSON.stringify(p),result=await fabricationZip(p,{png:false,pdf:false,rearAssembly:true}),zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.equal(JSON.stringify(p),before);assert.ok(zip.file('1-Main-panel.svg'));assert.ok(zip.file('1-Main-panel-rear-assembly.svg'));
  const manifest=JSON.parse(await zip.file('manifest.json').async('string'));assert.match(manifest.orientation,/front/);assert.match(manifest.rearAssemblyOrientation,/not cutting/);assert.deepEqual(manifest.panels[0].labelSides,{front:false,rear:true});
  assert.deepEqual(JSON.parse(await zip.file('project.json').async('string')),p);
});
