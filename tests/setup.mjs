import fs from 'node:fs';
import {createRequire} from 'node:module';
import {setFont} from '../dist/js/geometry.js';
export function loadVendor(file){const mod={exports:{}};new Function('module','exports','require',fs.readFileSync(new URL('../dist/vendor/'+file,import.meta.url),'utf8'))(mod,mod.exports,createRequire(import.meta.url));return mod.exports;}
export function setup(){globalThis.opentype=loadVendor('opentype.min.js');globalThis.PDFLib=loadVendor('pdf-lib.min.js');globalThis.JSZip=loadVendor('jszip.min.js');const data=fs.readFileSync(new URL('../dist/fonts/DejaVuSans.ttf',import.meta.url));setFont(opentype.parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)));}
