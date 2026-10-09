import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {builtinParts,categories,partCategory,partSource,filterParts,openingSummary} from '../dist/js/component-library.js';
import {clone,newProject,addComponent,starterParts} from '../dist/js/model.js';
import {validateDefinition,validateProject} from '../dist/js/validation.js';
import {partIcon,frontBody} from '../dist/js/canvas.js';
import {commands,bbox,scene,flatten,polygonsOverlap} from '../dist/js/geometry.js';
import {svgExport,wiringCSV,pdfExport,fabricationZip} from '../dist/js/exports.js';
import {setup} from './setup.mjs';
setup();

test('267 unique definitions cover 14 categories and preserve original starter geometry',()=>{
  assert.equal(builtinParts.length,267);assert.equal(new Set(builtinParts.map(d=>d.id)).size,267);
  for(const [id] of categories)assert.ok(builtinParts.filter(d=>partCategory(d)===id).length>=12,id);
  for(const old of starterParts){const current=builtinParts.find(d=>d.id===old.id);for(const key of ['front','rear','openings','terminals','access','kind'])assert.deepEqual(current[key],old[key]);}
  assert.equal(builtinParts.filter(d=>partSource(d)==='sourced').length,2);
  for(const d of builtinParts){validateDefinition(clone(d));assert.equal(d.verified,false);if(d.id.startsWith('gen-')){assert.equal(d.provenance.status,'generic-template');assert.deepEqual(d.provenance.facts,[]);assert.match(d.source,/illustrative/);}}
});

test('all catalog parts place, round-trip and export every opening without mutating shared definitions',()=>{
  const before=JSON.stringify(builtinParts);
  for(const d of builtinParts){
    const p=newProject(d.name),b=p.panels[0];b.w=500;b.h=400;
    const c=addComponent(p,b,d,200,180);c.label='';
    assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p,d.id);
    const cut=scene(p,b).filter(s=>s.layer==='cut');assert.equal(cut.length,d.openings.length,d.id);
    for(let i=0;i<cut.length;i++)assert.deepEqual(cut[i].shape,d.openings[i],d.id);
    assert.match(svgExport(p,b),/width="500mm"/);assert.doesNotMatch(svgExport(p,b),/NaN|undefined|Infinity/);
    if(d.terminals.length)assert.ok(wiringCSV(p).split('\n').length>=d.terminals.length+1,d.id);
    c.definition.name='Instance only';c.definition.openings[0].x=999;
  }
  assert.equal(JSON.stringify(builtinParts),before);
});

test('generic hole patterns remain inside front faces and icons scale to contain geometry',()=>{
  for(const d of builtinParts.filter(d=>d.id.startsWith('gen-'))){
    const face=bbox(commands(d.front));
    for(const opening of d.openings){const b=bbox(commands(opening));assert.ok(b.x>=face.x-.001&&b.y>=face.y-.001&&b.x+b.w<=face.x+face.w+.001&&b.y+b.h<=face.y+face.h+.001,`${d.name}: cut outside face`);}
    const cuts=d.openings.map(s=>flatten(commands(s)));for(let i=0;i<cuts.length;i++)for(let j=i+1;j<cuts.length;j++)assert.equal(polygonsOverlap(cuts[i],cuts[j]),false,`${d.name}: overlapping openings ${i}/${j}`);
    const icon=partIcon(d),view=icon.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    assert.ok(view.every(Number.isFinite));assert.ok(view[2]>face.w&&view[3]>face.h,d.id);
    assert.doesNotMatch(icon,/url\(#metal\)|NaN|undefined/);
    assert.doesNotMatch(frontBody({definition:d,color:d.color},false,50,'TEST'),/NaN|undefined/);
  }
});

test('search combines category, synonyms, dimensions, source, favorites and legacy custom definitions',()=>{
  assert.equal(filterParts(builtinParts,{query:'usb type c',category:'data'}).length,1);
  assert.equal(filterParts(builtinParts,{query:'fader 100',category:'linear'}).length,2);
  assert.equal(filterParts(builtinParts,{query:'M3 standoff 20'}).length,1);
  assert.equal(filterParts(builtinParts,{query:'midi'}).length,1);
  assert.equal(filterParts(builtinParts,{query:'6.35 mono'}).length,1);
  assert.ok(filterParts(builtinParts,{query:'M8',category:'data'}).every(d=>d.openings[0].d===8));
  assert.equal(filterParts(builtinParts,{source:'sourced'}).length,2);
  const id='gen-usb-c-panel-coupler';assert.deepEqual(filterParts(builtinParts,{source:'favorites',favorites:[id]}).map(d=>d.id),[id]);
  assert.equal(filterParts(builtinParts,{source:'favorites'}).length,0);
  const legacy={...clone(starterParts[0]),id:'custom-legacy'};
  assert.equal(filterParts([...builtinParts,legacy],{source:'custom',category:'buttons'}).length,1);
  assert.match(openingSummary(builtinParts.find(d=>d.id==='gen-fan-opening-120-mm')),/4 × Ø3.5/);
  assert.equal(filterParts(builtinParts,{query:'nonexistent item'}).length,0);
});

test('complex patterns survive actual PDF and frozen fabrication ZIP',async()=>{
  const p=newProject('Catalog export study'),b=p.panels[0];b.w=500;b.h=300;
  for(const [id,x,y] of [['gen-fan-opening-120-mm',90,90],['gen-slide-potentiometer-100-mm-travel',220,90],['gen-d-sub-25-pin-flange',330,90],['gen-perforated-vent-80-mm',90,220]]){
    const d=builtinParts.find(d=>d.id===id);assert.ok(d,id);addComponent(p,b,d,x,y);
  }
  const pdf=await PDFLib.PDFDocument.load(await pdfExport(p,b,{pdfMode:'sheet'}));assert.equal(pdf.getPageCount(),1);
  const result=await fabricationZip(p,{png:false,pdf:false}),zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.deepEqual(JSON.parse(await zip.file('project.json').async('string')),p);
});

test('catalog metadata rejects malformed imports and offline cache includes the new module',()=>{
  const d=clone(builtinParts[0]);assert.throws(()=>validateDefinition({...d,tags:'USB'}),/tags/);
  assert.throws(()=>validateDefinition({...d,tags:[{}]}),/Search tag/);
  assert.throws(()=>validateDefinition({...d,visual:'script'}),/visual/);
  const sw=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');assert.ok(sw.includes("'./js/component-library.js'"));
});
