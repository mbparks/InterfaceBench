/* Dimension facts transcribed 2026-10-09 from manufacturer drawings.
   Clearances are planning assumptions; no physical measurement is claimed. */
import {clone,uno,circ,stable} from './model.js';
const date='2026-10-09';
const terminal=(id,role,voltage=0)=>({id,name:id,role,voltage,required:false});
function part(id,name,front,opening,depth,maxThickness,terminals,source,notes){return {
 id,name,kind:'button',prefix:'SW',color:'#b7c9c1',front:circ(front),openings:[circ(opening)],rear:circ(opening+4),access:circ(front+14),depth,bend:10,minThickness:1,maxThickness,mountReference:'Centre of panel cutout',terminals,
 verified:false,verifiedDate:'',source,notes,manufacturer:'E-Switch',partNumber:name.split(' ').at(-1),sourceChecked:date,
 libraryId:id,libraryRevision:1,
 provenance:{status:'manufacturer-sourced',checked:date,facts:['front.d','openings[0].d','maxThickness'],assumptions:['Rear/access envelopes are conservative planning allowances.','Depth includes a conservative allowance; confirm the purchased variant.','Contact pins are passive; assign circuit roles and voltage explicitly.']}
};}
export const manufacturerParts=[
 part('eswitch-pv6f240ss-341','E-Switch PV6F240SS-341',18,16,30,10,[terminal('1','passive'),terminal('2','passive'),terminal('LED+','passive',2.8),terminal('LED-','ground')],
 'https://configured-product-images.s3.amazonaws.com/2D/specs/PV6F240SS-341.pdf',
 'Drawing D, 2025-04-08: 18 mm bezel, 16 +0.2/-0 mm opening; 1–10 mm panel. Blue LED 2.8 V, 20 mA; current limiting required. Rear Ø20, access Ø32, depth30 and bend10 are planning allowances, not manufacturer dimensions.'),
 part('eswitch-pv7f2y0ss-335','E-Switch PV7F2Y0SS-335',25,22,38,8,[terminal('1','passive'),terminal('2','passive'),terminal('3','passive'),terminal('4','passive'),terminal('LED+','passive',24),terminal('LED-','ground')],
 'https://configured-product-images.s3.amazonaws.com/2D/specs/PV7F2Y0SS-335.pdf',
 'Drawing B, 2026-01-08: 25 mm bezel, 22 +0.2/-0 mm opening, max panel8 mm. 1–2 normally closed and 3–4 normally open momentary contacts. 24 V green illumination needs an interface to logic. Rear Ø26, access Ø39, depth38, bend10 and minimum panel1 are planning assumptions.')
];
export const controllerProfiles=[{id:'uno-r3',...uno()},
 {id:'uno-r4-minima',...uno(),name:'Arduino UNO R4 Minima',source:'https://docs.arduino.cc/resources/pinouts/ABX00080-full-pinout.pdf',verifiedDate:date,notes:'5 V GPIO. Primary header functions only. A4/A5 also serve SDA/SCL; aliases share one identity. DAC/CAN/OPAMP are outside this capability model. UNO R4 GPIO current limits differ from R3.'},
 {id:'nano-every',...uno(),name:'Arduino Nano Every',source:'https://docs.arduino.cc/resources/pinouts/ABX00028-full-pinout.pdf',verifiedDate:date,notes:'5 V GPIO. PWM on D3/D5/D6/D9/D10; D11 is not PWM. A6/A7 support analog and digital I/O.',pins:uno().pins.map(p=>p.id==='D11'?{...p,caps:p.caps.filter(c=>c!=='pwm')}:p).concat([6,7].map(i=>({id:'A'+i,code:'A'+i,voltage:5,caps:['analogIn','digitalIn','digitalOut']})))}
];
export function revisionInfo(d){return {family:d.libraryId||d.id,revision:d.libraryRevision||1};}
export function nextRevision(d,library,{fork=false,newId}={}){
 const out=clone(d), info=revisionInfo(d);
 out.libraryId=fork?(newId||'custom-'+globalThis.crypto.randomUUID()):info.family;
 out.libraryRevision=fork?1:Math.max(0,...library.filter(x=>revisionInfo(x).family===info.family).map(x=>revisionInfo(x).revision))+1;
 out.id=`custom-${out.libraryId}-r${out.libraryRevision}`;out.revisionDate=new Date().toISOString();return out;
}
export function revisionChanges(a,b){const changes=[];for(const k of ['name','front','openings','rear','access','depth','bend','minThickness','maxThickness','terminals','source','notes'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))changes.push(k);return changes;}
export function assignmentImpact(project,component,definition){
 return project.connections.filter(n=>n.component===component.id).filter(n=>{const old=component.definition.terminals.find(t=>t.id===n.terminal),next=definition.terminals.find(t=>t.id===n.terminal);return !next||next.role!==old?.role||next.voltage!==old?.voltage;});
}
export function mergeLibrary(current,incoming){
 const result=clone(current);for(const d of incoming){const info=revisionInfo(d),existing=result.find(x=>{const old=revisionInfo(x);return info.family===old.family&&info.revision===old.revision;});if(existing){if(stable(existing)!==stable(d))throw Error(`Conflicting library revision: ${d.name} r${info.revision}. Import as a new family instead.`);}else result.push(clone(d));}return result;
}

export function libraryDocument(parts){return {format:'interfacebench-library',version:2,parts:parts.filter(d=>d.id.startsWith('custom-')).map(d=>({...clone(d),libraryId:revisionInfo(d).family,libraryRevision:revisionInfo(d).revision}))};}
