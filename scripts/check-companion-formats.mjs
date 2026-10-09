/* Independent parsers from the user-owned companion distributions, supplied separately.
   Usage: node scripts/check-companion-formats.mjs /absolute/path/to/interop-sources */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
import {example,clone,stable} from '../dist/js/model.js';import {exportPinnote,exportReflex,importCopperbench,importAssignments} from '../dist/js/interchange.js';
const dir=path.resolve(process.argv[2]||''),require=createRequire(import.meta.url),sourceFiles=[],source=(name)=>{const f=path.join(dir,name),s=fs.readFileSync(f,'utf8');sourceFiles.push({name,sha256:crypto.createHash('sha256').update(s).digest('hex')});return s;};
const pnPath=path.join(dir,'pinnote/src/core.js');source('pinnote/src/core.js');const pn=require(pnPath);
const box={structuredClone,crypto:globalThis.crypto};vm.createContext(box);for(const n of [0,1,2,3])vm.runInContext(source('reflex-'+n+'.js'),box);
const cb={structuredClone,crypto:globalThis.crypto};vm.createContext(cb);vm.runInContext(source('copperbench-2.js'),cb);
const p=example(),pnOut=exportPinnote(p),rfOut=exportReflex(p);const parsedPN=pn.parseNative(JSON.stringify(pnOut.data));assert.deepEqual(parsedPN,pnOut.data);assert.deepEqual(importAssignments(parsedPN,p).project.connections,p.connections);
const parsedRF=box.ReflexCore.parseProject(JSON.stringify(rfOut.data));assert.equal(stable(parsedRF),stable(rfOut.data));
const board=cb.CB.validateDoc(JSON.parse(fs.readFileSync(new URL('../tests/fixtures/copperbench-schema5.json',import.meta.url))));const imported=importCopperbench(board);assert.equal(imported.panel.components.length,board.holes.length);
const result={date:new Date().toISOString(),runtime:process.version,passed:true,checks:['PINNOTE 2.0.0 native parser accepts export unchanged','PINNOTE parsed export round-trips assignments exactly','REFLEX 1.1.0-rc.1 native parser accepts schema5 inventory unchanged','COPPERBENCH 1.7.1 validator accepts native fixture; mounting holes imported'],sourceFiles,browser:false};
fs.writeFileSync(new URL('../qa/companion-parsers.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
