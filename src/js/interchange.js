/* Version-bounded companion adapters. See docs/INTERCHANGE.md for mapping/loss contracts. */
import {VERSION,clone,uid,newPanel,starterParts,addComponent,stable} from './model.js';
import {validateProject,validateShape} from './validation.js';
const provenance=p=>({version:1,producer:'INTERFACEBENCH',producerVersion:VERSION,projectId:p.id,revision:p.revision,controller:stable(p.controller),created:new Date().toISOString()});
const report=(target,mapped,warnings)=>({format:'interfacebench-conversion-report',version:1,target,created:new Date().toISOString(),mapped,warnings});
function guarded(raw){
 const text=typeof raw==='string'?raw:JSON.stringify(raw);if(text.length>25000000)throw Error('Interchange file exceeds 25 MB.');
 return JSON.parse(text,(k,v)=>{if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe interchange key.');return v;});
}
const id=prefix=>prefix+'_'+uid().replace(/[^a-zA-Z0-9_-]/g,'');
function pnConnector(ref,labels,opts={}) {return {id:id('c'),ref,name:ref,kind:'connector',family:'Custom',manufacturer:'',part:'',contactPart:'',supplier:'',layout:'single',orientation:'unknown',transform:'none',pin1:'',key:'',source:'',verified:false,photo:'',hotspots:{},notes:'',pins:labels.map(label=>({id:id('p'),label:String(label),function:'',occupancy:null,accessible:true,required:false,x:null,y:null,notes:''})),...opts};}
export function exportPinnote(raw){
 const p=validateProject(raw),date=new Date().toISOString(),meta=provenance(p),warnings=['Wire lengths, gauges, connector viewing directions and physical terminal locations are unspecified.','Component-to-controller assignments are documented as separate physical wire segments; review actual splices and harness construction.','Panel geometry, artwork and rehearsal rules remain in the accompanying INTERFACEBENCH backup.'];
 const out={format:'pinnote.project',schemaVersion:1,appVersion:'2.0.0',id:id('project'),title:p.name,code:'IB-'+p.revision,revision:p.revision,state:'As designed',description:'INTERFACEBENCH wiring handoff. '+warnings.join(' '),createdAt:date,updatedAt:date,sample:false,connectors:[],wires:[],cables:[],extras:[],layout:{nodes:{},labels:{}},records:[],assets:{},vocab:{color:['Red','Black','White','Green','Blue','Yellow'],gauge:['24 AWG','22 AWG','20 AWG'],manufacturer:[],supplier:[],family:['Custom'],treatment:['Unspecified','Solder','Crimp contact']},bench:{},benchCursor:'',sessions:[],baselines:[],labelSettings:{paper:'A4',kind:'ends',width:88,height:16,margin:10,gap:2,columns:2,copies:1,skip:0,font:9,pattern:'{wire}\n{end} → {opposite}'}};
 const comps=p.panels.flatMap(b=>b.components).filter(c=>c.definition.terminals.length);
 if(comps.length>=500||p.connections.length>5000)throw Error('PINNOTE limits this handoff to 499 components and 5000 wires.');
 let ref='CTRL';while(comps.some(c=>c.ref===ref))ref+='1';
 const ctrl=pnConnector(ref,p.controller.pins.map(t=>t.id),{name:p.controller.name,source:p.controller.source||'User-declared controller'});out.connectors.push(ctrl);out.layout.nodes[ctrl.id]={x:700,y:100};
 meta.controllerPins=Object.fromEntries(ctrl.pins.map((pin,i)=>[pin.id,p.controller.pins[i].id]));meta.controllerConnector=ctrl.id;meta.terminals={};meta.connections={};
 const targets=new Map();comps.forEach((c,index)=>{const cc=pnConnector(c.ref,c.definition.terminals.map(t=>t.id),{name:c.label||c.definition.name,source:c.definition.source||'Embedded definition',notes:c.definition.notes||''});out.connectors.push(cc);out.layout.nodes[cc.id]={x:100+(index%2)*260,y:100+Math.floor(index/2)*180};cc.pins.forEach((pin,i)=>{const t=c.definition.terminals[i];pin.function=t.name+' / '+t.role;pin.required=t.required!==false;meta.terminals[pin.id]={connector:cc.id,component:c.id,terminal:t.id,role:t.role,voltage:t.voltage};targets.set(c.id+'/'+t.id,{connector:cc.id,pin:pin.id});});});
 for(const n of p.connections){const from=targets.get(n.component+'/'+n.terminal);if(!from)continue;const pin=ctrl.pins.find(x=>x.label===n.pin);if(n.pin&&!pin){warnings.push(`Skipped unknown controller assignment ${n.signal}: ${n.pin}.`);continue;}if(!n.pin)continue;
 const w={id:id('w'),ref:'W'+String(out.wires.length+1).padStart(3,'0'),from,to:{connector:ctrl.id,pin:pin.id},signal:n.signal,color:'',gauge:'',lengthMm:null,cableId:'',conductor:'',pair:'',role:'wire',fromTreatment:'Unspecified',toTreatment:'Unspecified',notes:n.notes||''};out.wires.push(w);meta.connections[w.id]=n.id;}
 out.interfacebench=meta;return {data:out,report:report('PINNOTE 2.0.0 / schema 1',{connectors:out.connectors.length,wires:out.wires.length},warnings)};
}
const reflexInput=(id,name,type)=>({id,name,type,unit:type==='analog'?'%':'state',rawMin:0,rawMax:type==='analog'?1023:1,calMin:0,calMax:type==='analog'?1023:1,unitMin:0,unitMax:type==='analog'?100:1,lowLabel:'low',highLabel:'high',invert:false,clamp:true,deadzone:0,smoothingMs:0,threshold:.5,hysteresis:.08,debounceMs:40,staleMs:500,initial:0});
export function exportReflex(raw){
 const p=validateProject(raw),meta=provenance(p),warnings=['Device inventory only: event-driven rehearsal rules are not translated into continuous mappings or motion sequences.','Power/ground wiring, mechanical geometry, displays and connectors remain in the INTERFACEBENCH backup.','REFLEX 1.1.0-rc.1 reserves UNO PWM D9/D10 for its servo runtime; unsupported pins are left unassigned.'];
 const out={format:'reflex-project',schemaVersion:5,appVersion:'1.1.0-rc.1',name:p.name.slice(0,100),scene:'bench',hardware:{board:'uno-r3',channels:[]},inputs:[],outputs:[],mappings:[],poses:[],sequences:[],feedback:[],recordingRefs:[],assumptions:'Imported device inventory. Configure and verify behavior in REFLEX before hardware use.'};
 meta.channels={};const sourceUno=p.controller.name==='Arduino UNO R3',used=new Set();if(!sourceUno)warnings.push('Source controller is not UNO R3. This template uses UNO R3 with all hardware pins unassigned. Select and review the target controller in REFLEX.');
 for(const c of p.panels.flatMap(b=>b.components)){
 const kind=c.definition.kind;if(!['button','toggle','pot','encoder','led'].includes(kind)){warnings.push(`Omitted ${c.ref}: ${kind} has no matching REFLEX device type.`);continue;}
 // One channel per relevant electrical terminal; quadrature is not a numeric encoder in REFLEX.
 const ts=c.definition.terminals.filter(t=>kind==='led'?['digitalOut','pwm'].includes(t.role):['digitalIn','analogIn'].includes(t.role));
 if(!ts.length)warnings.push(`${c.ref}: no supported input/output terminal roles; assign roles before exporting this device.`);
 if(kind==='encoder')warnings.push(`${c.ref}: encoder A/B become separate digital channels; quadrature decoding is not transferred.`);
 for(const t of ts){const type=kind==='led'?'led':t.role==='analogIn'?'analog':'digital',channel='ch'+(Object.keys(meta.channels).length+1),name=(c.ref+' '+(c.label||c.definition.name)+' '+t.name).slice(0,100);
 if(type==='led')out.outputs.push({id:channel,name,type,min:0,max:100,safe:0,rate:300,easeMs:0});else out.inputs.push(reflexInput(channel,name,type));
 const n=p.connections.find(n=>n.component===c.id&&n.terminal===t.id),match=n?.pin.match(type==='analog'?/^A([0-5])$/:/^D(\d+)$/),pin=match?Number(match[1]):null;
 meta.channels[channel]={component:c.id,terminal:t.id,role:t.role,voltage:t.voltage,type};
 const allowed=type==='analog'?pin!==null:type==='led'?[3,5,6,11].includes(pin):pin>=2&&pin<=12;
 const assignedType=type==='led'?'led':'input',capacity=out.hardware.channels.filter(a=>meta.channels[a.id]&&(meta.channels[a.id].type==='led'?'led':'input')===assignedType).length;
 if(sourceUno&&allowed&&capacity<6&&!used.has((type==='analog'?'A':'D')+pin)){out.hardware.channels.push({id:channel,pin});used.add((type==='analog'?'A':'D')+pin);}else if(n?.pin)warnings.push(`${c.ref}:${t.id} (${n.pin}) left unassigned; review REFLEX runtime capabilities.`);
 if(n?.activeLow)warnings.push(`${c.ref}:${t.id}: active-low semantics need review in REFLEX; no automatic inversion is applied.`);
 }}
 if(out.inputs.length>16||out.outputs.length>16)throw Error('REFLEX handoff supports at most 16 inputs and 16 outputs. Reduce the device inventory first.');
 if(p.rules.length)warnings.push(`${p.rules.length} rehearsal rule(s) omitted from REFLEX; the source backup retains them.`);
 if(p.name.length>100)warnings.push('Project name shortened to the REFLEX 100-character limit.');
 out.assumptions+='\n'+warnings.join('\n');out.interfacebench=meta;
 return {data:out,report:report('REFLEX 1.1.0-rc.1 / schema 5',{inputs:out.inputs.length,outputs:out.outputs.length,pinAssignments:out.hardware.channels.length,rules:0},warnings)};
}
export function importCopperbench(raw){
 const data=guarded(raw);if(data.app!=='COPPERBENCH'||data.schema!==5)throw Error('Use a native COPPERBENCH schema-5 JSON backup. CaseBench handoffs and unknown schemas are not accepted.');
 const finite=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('Invalid Copperbench '+label);return v;};
 const b=data.board;if(!b)throw Error('Missing Copperbench board.');const panel=newPanel((data.title||'PCB').slice(0,220)+' · mounting template');panel.w=finite(b.width,5,600,'width');panel.h=finite(b.height,5,600,'height');panel.shape=b.shape==='polygon'?'imported':b.shape;panel.radius=finite(b.radius,0,300,'radius');panel.material='Mounting template — choose material';panel.process='Reference / drilling template';panel.color='#b2c7aa';if(b.shape==='polygon'){validateShape({type:'polygon',points:b.points});panel.outline=clone(b.points);}
 for(const k of ['parts','holes','cutouts'])if(!Array.isArray(data[k])||data[k].length>1000)throw Error('Invalid Copperbench '+k+' collection.');
 const embeddedHoles=data.parts.flatMap(part=>{if(part.mountingHoles===undefined)return [];if(!Array.isArray(part.mountingHoles)||part.mountingHoles.length>100)throw Error('Invalid embedded mounting holes.');return part.mountingHoles.map((h,i)=>{const a=finite(part.rotation,-36000,36000,'mounting rotation')*Math.PI/180, x=finite(h.x,-10000,10000,'mounting X')*(part.side==='bottom'?-1:1),y=finite(h.y,-10000,10000,'mounting Y');return {...h,x:part.x+x*Math.cos(a)-y*Math.sin(a),y:part.y+x*Math.sin(a)+y*Math.cos(a),id:part.id+':mount'+i,slot:0,rotation:0};});});
 const fake={panels:[panel]},warnings=['Board dimensions and non-plated mounting holes are copied in millimetres, in the source top view.','PCB copper, pad drills, vias, electrical nets and firmware are not imported.','Part body outlines are reference-only rectangles; confirm real connector overhangs, heights and clearance before fabrication.','The new template uses editable panel material/thickness defaults, not the PCB stackup.'];
 for(const h of [...data.holes,...embeddedHoles]){if(h.plated)throw Error('Standalone plated holes are unsupported.');const d=clone(starterParts.find(d=>d.kind==='mount')),diam=finite(h.drill,.01,100,'drill'),slot=finite(h.slot||0,0,200,'slot');d.id='cb-hole-'+uid();d.name='PCB mounting hole';d.source=`COPPERBENCH ${data.version||'schema 5'} / ${String(data.title||'board').slice(0,300)} / ${h.id}`;d.openings=[slot>0?{type:'rect',x:0,y:0,w:slot+diam,h:diam,r:diam/2}:{type:'circle',x:0,y:0,d:diam}];d.front=clone(d.openings[0]);const c=addComponent(fake,panel,d,finite(h.x,-10000,10000,'hole X'),finite(h.y,-10000,10000,'hole Y'));c.rotation=finite(h.rotation||0,-36000,36000,'hole rotation');c.label='';c.sourceId=h.id;}
 for(const part of data.parts){finite(part.body?.w,.05,500,'body width');finite(part.body?.h,.05,500,'body height');const x=finite(part.x,-10000,10000,'part X'),y=finite(part.y,-10000,10000,'part Y'),rotation=finite(part.rotation,-36000,36000,'rotation');panel.artwork.push({id:uid(),type:'border',x,y,w:part.body.w,h:part.body.h,r:0,rotation,layer:'reference',color:'#607565',stroke:.35,sourceId:part.id},{id:uid(),type:'text',x,y,size:2.5,text:String(part.ref||'Part').slice(0,100),rotation,layer:'reference',color:'#364c3d'});}
 if(data.cutouts.length)warnings.push(`${data.cutouts.length} board cutout(s) not converted to drilling operations. Inspect the source board if they affect mounting.`);
 panel.source={app:'COPPERBENCH',schema:5,id:data.id,version:data.version,boardThickness:b.thickness};
 return {panel,report:report('INTERFACEBENCH mounting template',{mountingHoles:panel.components.length,referenceBodies:data.parts.length,widthMm:panel.w,heightMm:panel.h},warnings)};
}
// Return imports change assignments only. They require the original handoff metadata.
export function importAssignments(raw,current){
 const data=guarded(raw),p=validateProject(current),meta=data.interfacebench;
 if(!meta||meta.version!==1||meta.projectId!==p.id)throw Error('Return this handoff to its original INTERFACEBENCH project. The provenance map is missing or belongs to another project.');
 if(meta.controller!==stable(p.controller))throw Error('Controller declarations changed since handoff. Export a fresh handoff first.');
 const comps=new Map(p.panels.flatMap(b=>b.components).map(c=>[c.id,c])),newAssignments=[],covered=new Set();
 function binding(m){const c=comps.get(m?.component),t=c?.definition.terminals.find(t=>t.id===m.terminal);if(!t||t.role!==m.role||t.voltage!==m.voltage)throw Error('A mapped terminal changed or is missing. Export a fresh handoff.');return [c,t];}
 function add(m,pin,signal,notes){const [c,t]=binding(m),key=c.id+'/'+t.id;if(newAssignments.some(n=>n.component+'/'+n.terminal===key))throw Error('Multiple physical wires map to one INTERFACEBENCH terminal. Keep this harness in PINNOTE.');if(!p.controller.pins.some(p=>p.id===pin))throw Error('Unknown returned controller pin: '+pin);const old=p.connections.find(n=>n.component===c.id&&n.terminal===t.id);newAssignments.push({...old,id:old?.id||uid(),component:c.id,terminal:t.id,pin,signal:signal??old?.signal??c.ref+'_'+t.id,bus:old?.bus||'',notes:notes??old?.notes??'',pullup:old?.pullup||false,activeLow:old?.activeLow||false,driver:old?.driver||''});}
 if(data.format==='pinnote.project'&&data.schemaVersion===1){
 if(!meta.terminals||!meta.controllerPins||!Array.isArray(data.wires)||data.wires.length>5000||!Array.isArray(data.connectors))throw Error('Invalid PINNOTE handoff.');
 for(const m of Object.values(meta.terminals)){binding(m);covered.add(m.component+'/'+m.terminal);}
 const ends=new Map(data.connectors.flatMap(c=>(c.pins||[]).map(t=>[c.id+'/'+t.id,t])));
 for(const wire of data.wires){const f=wire.from,t=wire.to;if(f?.intentionallyOpen||t?.intentionallyOpen)continue;
 if(!ends.has(f?.connector+'/'+f?.pin)||!ends.has(t?.connector+'/'+t?.pin))throw Error('A PINNOTE wire references an absent pin.');
 const ce=f.connector===meta.controllerConnector?f:t.connector===meta.controllerConnector?t:null,other=ce===f?t:f,m=meta.terminals[other.pin];if(!ce||!m||m.connector!==other.connector)throw Error('This harness contains a non-controller connection; retain it in PINNOTE.');add(m,meta.controllerPins[ce.pin],wire.signal,wire.notes);
 }
 }else if(data.format==='reflex-project'&&data.schemaVersion===5){
 if(data.hardware?.board!=='uno-r3'||p.controller.name!=='Arduino UNO R3')throw Error('Returned REFLEX assignments require the original UNO R3 controller.');
 if(!meta.channels||!Array.isArray(data.hardware.channels)||data.hardware.channels.length>32)throw Error('Invalid REFLEX handoff.');
 for(const m of Object.values(meta.channels)){binding(m);covered.add(m.component+'/'+m.terminal);}
 for(const a of data.hardware.channels){const m=meta.channels[a.id],channel=[...(data.inputs||[]),...(data.outputs||[])].find(c=>c.id===a.id);if(!m||!channel||channel.type!==m.type||!Number.isInteger(a.pin))throw Error('Unknown or changed REFLEX channel.');add(m,(m.type==='analog'?'A':'D')+a.pin);}
 }else throw Error('Unsupported return format/schema. Use PINNOTE schema1 or REFLEX schema5 native JSON.');
 const old=p.connections.filter(n=>covered.has(n.component+'/'+n.terminal));p.connections=p.connections.filter(n=>!covered.has(n.component+'/'+n.terminal)).concat(newAssignments);validateProject(p);
 return {project:p,report:report('INTERFACEBENCH wiring assignments',{previousAssignments:old.length,returnedAssignments:newAssignments.length,removedAssignments:old.filter(n=>!newAssignments.some(x=>x.component===n.component&&x.terminal===n.terminal)).length},['Only mapped wiring assignments change. Geometry, artwork and rehearsal rules are retained.','New companion channels/connectors without a handoff binding require manual mapping.','Review Checks for returned pin conflicts or capability mismatches.'])};
}
