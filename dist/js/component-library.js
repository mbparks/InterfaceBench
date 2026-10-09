/* Generic planning geometry, not a catalog of certified manufacturer footprints. */
import {clone, circ, rect, starterParts} from './model.js';
import {manufacturerParts} from './catalog.js';

export const categories = [
  ['buttons','Pushbuttons'], ['switches','Switches & selectors'],
  ['rotary','Knobs & rotary controls'], ['linear','Faders & joysticks'],
  ['indicators','Indicators & sound'], ['displays','Displays & meters'],
  ['audio','Audio & coax connectors'], ['data','Data & multipin connectors'],
  ['power','Power & protection'], ['sensors','Sensors & apertures'],
  ['cable','Cable entry & routing'], ['mounting','Fasteners & mounting'],
  ['ventilation','Fans & ventilation'], ['carriers','Board & module carriers']
];
const categoryNames = Object.fromEntries(categories);
const starterCategories = {button:'buttons',stop:'buttons',toggle:'switches',encoder:'rotary',pot:'rotary',led:'indicators',display:'displays',connector:'data',usb:'data',mount:'mounting'};
const kindCategories = {button:'buttons',toggle:'switches',encoder:'rotary',pot:'rotary',led:'indicators',display:'displays',connector:'data',mount:'mounting'};
export const partCategory = d => categoryNames[d.category] ? d.category : starterCategories[d.id] || kindCategories[d.kind] || 'mounting';
export const categoryLabel = d => categoryNames[partCategory(d)];
export const partSource = d => d.id.startsWith('custom-') ? 'custom' : d.provenance?.status === 'manufacturer-sourced' ? 'sourced' : 'generic';
export const sourceLabel = d => ({custom:'Custom',sourced:'Sourced',generic:'Generic'})[partSource(d)];
const terminal = (name,role='passive',voltage=0) => ({id:name,name,role,voltage,required:true});
const pins = n => Array.from({length:n},(_,i)=>terminal(`P${i+1}`));
const signal = () => [terminal('SIG','digitalIn',5),terminal('GND','ground',5)];
const analog = () => [terminal('WIPER','analogIn',5),terminal('VCC','power',5),terminal('GND','ground',5)];
const encoder = () => [terminal('A','digitalIn',5),terminal('B','digitalIn',5),terminal('SW','digitalIn',5),terminal('GND','ground',5)];
const holes = (w,h,d=3.2) => [-1,1].flatMap(x=>[-1,1].map(y=>circ(d,x*w/2,y*h/2)));
const pair = (pitch,d=3.2) => [circ(d,-pitch/2),circ(d,pitch/2)];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const colors = {buttons:'#79ac8c',switches:'#c8ced0',rotary:'#d8ddcb',linear:'#b5c9b3',indicators:'#c2ee84',displays:'#597568',audio:'#9baba2',data:'#9baba2',power:'#d3a47f',sensors:'#a7bacc',cable:'#868f83',mounting:'#adb1a7',ventilation:'#91a494',carriers:'#75a88a'};
const generic = [];
function add(category,name,front,openings,rear,depth,terminals=[],extra={}) {
  const kind=extra.kind||(['mounting','ventilation','carriers'].includes(category)?'mount':'connector');
  generic.push({id:`gen-${slug(name)}`,name,category,tags:[],kind,visual:'outline',front,
    openings:Array.isArray(openings)?openings:[openings],rear,
    access:front.type==='circle'?circ(Math.max(front.d,rear.d||Math.max(rear.w,rear.h))+10):rect(Math.max(front.w,rear.w||rear.d)+10,Math.max(front.h,rear.h||rear.d)+10),
    depth,bend:0,minThickness:0,maxThickness:8,mountReference:'Template centre; opening offsets are in mm',
    terminals,prefix:({buttons:'SW',switches:'SW',rotary:'RV',linear:'RV',indicators:'IND',displays:'DS',audio:'J',data:'J',power:'PWR',sensors:'SEN',cable:'CBL',mounting:'H',ventilation:'FAN',carriers:'PCB'})[category],
    color:colors[category],verified:false,verifiedDate:'',libraryRevision:1,
    source:'Generic planning template — illustrative dimensions, not a manufacturer drawing.',
    notes:'Measure the selected hardware and edit this definition before fabrication. Front, cutouts, hole pitch, rear envelope, depth, access and panel limits are planning assumptions. P-number terminals are placeholders, not a connector pinout. Passive 0 V means voltage is unspecified, not a voltage rating. Active 5 V terminals are example logic assumptions. No circuit or hardware behavior is inferred from geometry.',
    provenance:{status:'generic-template',facts:[],assumptions:['All dimensions','Mounting limits','Terminal count and identity','Electrical roles and voltages']},...extra});
}
function round(category,name,face,cut,body,depth,terminals=[],extra={}) {add(category,name,circ(face),circ(cut),circ(body),depth,terminals,extra);}
function box(category,name,w,h,cw,ch,depth,terminals=[],extra={}) {add(category,name,rect(w,h,0,0,2),rect(cw,ch,0,0,Math.min(1,ch/2)),rect(w,h),depth,terminals,extra);}
function flanged(category,name,w,h,cut,pitch,depth,n,tags=[]) {add(category,name,rect(w,h,0,0,2),[cut,...pair(pitch)],rect(w,h),depth,pins(n),{tags});}

// Each variant changes physical geometry or contact topology, not just its color.
for (const [cut,face,depth] of [[6,9,12],[8,11,15],[10,14,18],[12,16,20],[16,20,24],[19,23,28],[22,29,32],[30,38,38]])
  round('buttons',`Momentary pushbutton · ${cut} mm`,face,cut,cut+1,depth,signal(),{kind:'button',visual:'standard',tags:['switch','push','normally open','NO']});
for (const cut of [12,16,19,22]) round('buttons',`Illuminated pushbutton · ${cut} mm`,cut+5,cut,cut+2,30,[...signal(),terminal('LED+'),terminal('LED−')],{kind:'button',visual:'standard',tags:['lit','light','lamp']});
for (const cut of [12,16,22]) round('buttons',`Latching pushbutton · ${cut} mm`,cut+6,cut,cut+2,32,pins(2),{kind:'toggle',tags:['push on push off','locking']});
for (const [name,face,cut,n] of [['Mushroom pushbutton',40,22,2],['Mushroom twist-release',40,22,4],['Guarded pushbutton',32,16,2],['Square pushbutton',18,12,2]])
  add('buttons',name,name.startsWith('Square')?rect(face,face):circ(face),circ(cut),circ(cut+4),35,pins(n),{tags:['switch','operator','generic contacts']});

for(const [name,w,h,cut,n] of [['Mini toggle SPST',12,18,6,2],['Mini toggle SPDT',12,18,6,3],['Mini toggle DPDT',14,21,6,6],['Heavy toggle SPST',19,30,12,2],['Heavy toggle SPDT',19,30,12,3],['Heavy toggle DPDT',21,32,12,6],['Toggle DPDT centre-off',21,32,12,6],['Guarded toggle switch',27,40,12,3]])
  add('switches',name,rect(w,h),circ(cut),rect(w,h),28,pins(n),{kind:'toggle',tags:['lever','switch','on off']});
for(const [name,w,h,cw,ch,n] of [['Mini rocker SPST',15,21,12,18,2],['Rocker SPDT',17,24,13,19,3],['Rocker DPST',24,31,19,27,4],['Illuminated rocker',24,31,19,27,3],['Rocker centre-off DPDT',24,31,19,27,6],['Slide switch SPDT',21,10,12,4,3],['Slide switch DPDT',27,13,15,5,6]])
  box('switches',name,w,h,cw,ch,22,pins(n),{kind:'toggle',tags:['switch','on off','rectangular']});
for(const [name,cut,n] of [['Key switch 2-position',12,2],['Key switch 3-position',19,3],['Selector 2-position',22,3],['Selector 3-position',22,4],['Rotary switch 1-pole 6-way',10,7],['Rotary switch 2-pole 6-way',10,14],['Rotary switch 1-pole 12-way',10,13]])
  round('switches',name,cut+14,cut,cut+12,32,pins(n),{tags:['rotary','selector','contacts']});

for(const face of [12,16,20,25,30,40]) round('rotary',`Potentiometer knob · ${face} mm`,face,7,18,23,analog(),{kind:'pot',visual:'standard',tags:['pot','variable resistor','analog','dial']});
for(const [name,cut,body,depth,n] of [['Dual-gang potentiometer',7,24,32,6],['Potentiometer with switch',7,24,33,5],['Multi-turn potentiometer',10,25,38,3],['Precision vernier dial',10,32,40,3]])
  round('rotary',name,36,cut,body,depth,pins(n),{kind:'pot',visual:'standard',tags:['pot','analog','dial']});
for(const face of [15,20,30,40]) round('rotary',`Push rotary encoder · ${face} mm`,face,7,18,22,encoder(),{kind:'encoder',visual:'standard',prefix:'ENC',tags:['quadrature','incremental','dial']});
round('rotary','Large handwheel encoder',60,10,38,38,pins(6),{prefix:'ENC',tags:['jog','quadrature','hand wheel']});

for(const travel of [20,30,45,60,100]) add('linear',`Slide potentiometer · ${travel} mm travel`,rect(18,travel+20),[rect(3,travel+4,0,0,1.5),circ(3.2,0,-(travel+12)/2),circ(3.2,0,(travel+12)/2)],rect(17,travel+20),18,analog(),{kind:'pot',tags:['fader','slider','linear','analog']});
for(const travel of [60,100]) add('linear',`Motorized fader · ${travel} mm travel`,rect(20,travel+30),[rect(4,travel+4,0,0,2),circ(3.2,0,-(travel+20)/2),circ(3.2,0,(travel+20)/2)],rect(25,travel+35),30,pins(8),{tags:['slider','motor','touch']});
for(const [name,w,h,cut,n] of [['Mini joystick',28,28,18,5],['Thumb joystick with push',35,35,22,7],['Two-axis panel joystick',50,50,30,5],['Arcade joystick',65,65,24,8],['Navigation thumbwheel',32,20,12,3]])
  add('linear',name,rect(w,h,0,0,3),[circ(cut),...holes(w-10,h-10)],rect(w,h),32,pins(n),{tags:['XY','game','input','directional']});

for(const cut of [3,5,6,8,10,12,16,22]) round('indicators',`LED indicator · ${cut} mm`,cut+3,cut,cut,18,[terminal('ANODE','digitalOut',5),terminal('GND','ground',5)],{kind:'led',visual:'standard',prefix:'LED',tags:['pilot','lamp','light']});
round('indicators','RGB indicator · 10 mm',14,10,11,20,pins(4),{tags:['red green blue','multicolor','light']});
round('indicators','Dual-color indicator · 8 mm',11,8,8,18,pins(3),{tags:['bi-color','light']});
for(const cut of [16,22,30]) round('indicators',`Panel buzzer · ${cut} mm`,cut+7,cut,cut+3,28,pins(2),{tags:['piezo','sound','alarm']});
for(const size of [28,40,57]) add('indicators',`Speaker grille · ${size} mm`,circ(size+10),[circ(size),...holes((size+4)/Math.sqrt(2),(size+4)/Math.sqrt(2),3.2)],circ(size+10),22,pins(2),{tags:['audio','sound','speaker']});
round('indicators','Stack-light base · 22 mm',40,22,28,30,pins(5),{tags:['tower','signal','beacon','lamp']});

for(const [name,w,h,cw,ch,n] of [
  ['Small OLED window',32,20,26,14,4],['Wide OLED window',44,23,36,15,4],['OLED module bezel',40,32,30,22,7],
  ['LCD 8 × 2 bezel',58,32,40,16,16],['LCD 16 × 2 bezel',85,40,65,17,16],['LCD 20 × 4 bezel',102,66,78,28,16],
  ['Graphic LCD 128 × 64 bezel',98,70,72,40,20],['TFT small portrait bezel',40,52,30,40,10],['TFT square bezel',48,48,38,38,10],
  ['TFT medium portrait bezel',58,78,46,62,14],['TFT landscape bezel',110,73,98,58,14],['Touchscreen wide bezel',166,108,154,86,14],
  ['Seven-segment single digit',20,28,14,20,10],['Seven-segment four digits',56,27,48,19,12],['LED bargraph window',38,16,28,8,12],
  ['Digital panel voltmeter',48,29,45,26,3],['Digital panel ammeter',48,29,45,26,5],['Analog meter bezel',65,56,50,40,2]])
  box('displays',name,w,h,cw,ch,20,pins(n),{kind:'display',tags:['screen','readout','window','bezel']});
round('displays','Round display bezel · 40 mm',48,40,46,20,pins(8),{tags:['screen','circular','gauge']});
round('displays','Round analog gauge · 52 mm',60,52,56,45,pins(2),{tags:['meter','dial','instrument']});

for(const [name,face,cut,body,depth,n,tags] of [
  ['3.5 mm TS audio jack',10,6,10,20,2,['mono','headphone']],['3.5 mm TRS audio jack',10,6,10,23,3,['stereo','headphone']],['3.5 mm TRRS audio jack',10,6,10,25,4,['headset']],
  ['6.35 mm TS audio jack',16,10,16,30,2,['quarter inch','mono']],['6.35 mm TRS audio jack',16,10,16,32,3,['quarter inch','stereo']],
  ['RCA phono socket',12,8,12,23,2,['cinch']],['BNC bulkhead',18,12,16,28,2,['coax','bayonet']],['SMA bulkhead',10,6.5,10,16,2,['RF','coax']],
  ['TNC bulkhead',20,14,18,30,2,['RF','coax']],['F-type bulkhead',14,9.5,12,24,2,['coax','antenna']],['Banana socket 4 mm',12,8,10,25,1,['binding post','test']],
  ['Banana socket 2 mm',8,5,7,16,1,['test']],['Insulated binding post',16,8,12,32,1,['terminal','test']],['DIN audio 5-pin',20,16,20,27,5,['MIDI']],['Mini-DIN 6-pin',14,10,14,23,6,['PS2']]])
  round('audio',name,face,cut,body,depth,pins(n),{tags});
for(const [name,n] of [['XLR 3-pin flange',3],['XLR 4-pin flange',4],['XLR 5-pin flange',5],['SpeakON-style flange',4]])
  add('audio',name,rect(31,36,0,0,2),[circ(24),circ(3.2,-12,-12),circ(3.2,12,12)],rect(31,36),32,pins(n),{tags:['audio','round flange','socket']});

for(const [name,w,h,cw,ch,pitch,n,tags] of [
  ['USB-A panel coupler',35,16,15,8,27,4,['USB','serial']],['USB-B panel coupler',36,22,13,13,28,4,['USB','printer']],['USB-C panel coupler',30,16,10,5,23,24,['USB','type C']],
  ['Micro-USB panel coupler',27,14,8,4,20,5,['USB']],['RJ45 panel coupler',40,25,17,16,32,8,['ethernet','network']],['RJ11 panel coupler',34,23,13,14,26,6,['telephone']],
  ['HDMI panel coupler',40,18,16,7,32,19,['video']],['DisplayPort panel coupler',42,19,17,7,34,20,['video']],
  ['D-sub 9-pin flange',34,18,20,10,25,9,['DB9','DE9','serial']],['D-sub 15-pin flange',42,18,28,10,33,15,['DB15','DA15']],
  ['High-density D-sub 15-pin',34,18,20,10,25,15,['VGA','HD15']],['D-sub 25-pin flange',59,18,45,10,50,25,['DB25','parallel']],
  ['D-sub 37-pin flange',76,18,62,10,67,37,['DB37']],['IDC ribbon bulkhead 10-pin',34,16,20,10,27,10,['ribbon','IDC']],
  ['IDC ribbon bulkhead 20-pin',47,16,33,10,40,20,['ribbon','IDC']]])
  flanged('data',name,w,h,rect(cw,ch,0,0,1),pitch,28,n,tags);
for(const [cut,n] of [[8,3],[8,4],[12,4],[12,5],[12,8],[16,2],[16,4],[16,6],[16,8],[20,4],[20,7],[20,12]])
  round('data',`Circular multipin · ${cut} mm / ${n} contacts`,cut+6,cut,cut+2,30,pins(n),{tags:['aviation','bulkhead','circular',`M${cut}`,`GX${cut}`,'connector family placeholder']});
for(const n of [2,3,4,6,8,12]) box('data',`Pluggable terminal block · ${n} ways`,n*5+8,16,n*5+2,10,22,pins(n),{tags:['screw','terminal','Euroblock','Phoenix-style']});

for(const [name,face,cut,body,depth,n] of [['DC barrel socket 2-terminal',14,8,12,23,2],['DC barrel socket switched',14,8,12,23,3],['Panel fuse holder · 5 × 20',16,12,14,38,2],['Panel fuse holder · 6 × 32',20,16,18,50,2],['Reset circuit breaker · 10 mm',16,10,18,32,2],['Reset circuit breaker · 12 mm',19,12,21,38,2]])
  round('power',name,face,cut,body,depth,pins(n),{tags:['power','protection','rating unspecified']});
for(const [name,w,h,cw,ch,depth,n] of [['IEC C14-style inlet',50,30,28,20,32,3],['IEC C8-style inlet',33,20,22,12,25,2],['IEC C20-style inlet',48,36,34,27,38,3],['Fused inlet module',54,58,48,52,48,5],['Switched inlet module',58,50,50,42,45,5],['XT30-style panel connector',25,16,13,8,22,2],['XT60-style panel connector',34,22,18,11,26,2],['XT90-style panel connector',42,27,24,16,30,2],['Powerpole-style pair',38,26,30,18,32,2],['Two-pole power terminal',28,22,18,12,24,2]])
  box('power',name,w,h,cw,ch,depth,pins(n),{tags:['power','supply','rating unspecified']});

for(const [name,face,cut,depth,n,tags] of [['Capacitive touch electrode',25,12,10,3,['touch','contact']],['Piezo sensor disk mount',35,27,8,2,['vibration','knock']],['Light sensor window',16,10,12,3,['LDR','photodiode','lux']],['Infrared receiver window',16,8,15,3,['IR','remote']],['PIR dome mount',32,23,25,3,['motion','infrared']],['Proximity sensor · 8 mm',14,8,35,3,['inductive','capacitive']],['Proximity sensor · 12 mm',19,12,40,3,['inductive']],['Proximity sensor · 18 mm',27,18,45,3,['inductive']],['Temperature probe gland',16,10,30,2,['thermistor','RTD']],['Microphone capsule mount',14,10,15,3,['sound','audio']]])
  round('sensors',name,face,cut,face,depth,pins(n),{tags});
add('sensors','Ultrasonic dual aperture',rect(48,26),[circ(16,-13),circ(16,13),...holes(40,18,2.2)],rect(48,26),20,pins(4),{tags:['distance','range','sonar']});
box('sensors','Time-of-flight sensor window',23,18,12,6,14,pins(6),{tags:['ToF','distance','lidar']});
box('sensors','Camera lens window',32,32,20,20,24,pins(8),{tags:['vision','optical','camera']});
box('sensors','Environmental sensor vent',28,24,18,12,15,pins(4),{tags:['humidity','temperature','pressure']});

for(const cut of [8,12,16,20,25,32]) round('cable',`Cable gland · ${cut} mm cutout`,cut+10,cut,cut+8,30,[],{tags:['strain relief','cord grip','gland']});
for(const cut of [6,8,10,12,16,20,25]) round('cable',`Rubber grommet · ${cut} mm cutout`,cut+6,cut,cut+4,5,[],{tags:['wire','pass-through','bushing']});
for(const [name,w,h,cw,ch] of [['Rectangular cable pass-through',40,20,30,10],['Brush cable entry',80,28,68,16],['Cable tie saddle',20,12,4,3]])
  box('cable',name,w,h,cw,ch,8,[],{tags:['wire','routing','strain relief']});

for(const [name,d] of [['M2',2.2],['M2.5',2.7],['M3',3.2],['M4',4.3],['M5',5.3],['M6',6.4],['M8',8.4],['M10',10.5],['#4',3],['#6',3.7],['#8',4.4],['1/4 inch',6.8]])
  round('mounting',`${name} clearance hole`,d+5,d,d+5,5,[],{tags:['screw','bolt','drill','fastener'],maxThickness:100});
for(const h of [6,10,15,20,25]) round('mounting',`M3 standoff · ${h} mm`,7,3.2,7,h,[],{tags:['spacer','PCB','pillar'],maxThickness:100});
for(const [name,w,h,pitch,d] of [['Two-hole bracket · 20 mm pitch',30,12,20,3.2],['Two-hole bracket · 40 mm pitch',50,15,40,4.3],['Handle · 80 mm pitch',94,18,80,4.3],['Handle · 120 mm pitch',134,18,120,5.3]])
  add('mounting',name,rect(w,h),pair(pitch,d),rect(w,h),12,[],{tags:['mount','fastener','pair'],maxThickness:100});
for(const [w,h] of [[10,3.2],[20,3.2],[15,4.3],[25,5.3]]) add('mounting',`Adjustment slot · ${w} × ${h} mm`,rect(w+6,h+6),rect(w,h,0,0,h/2),rect(w+6,h+6),5,[],{tags:['slot','adjustable','mount'],maxThickness:100});

for(const [size,pitch,opening,depth] of [[25,20,20,10],[30,24,25,10],[40,32,34,10],[50,40,43,15],[60,50,52,25],[80,71,70,25],[92,82,82,25],[120,105,108,25]])
  add('ventilation',`Fan opening · ${size} mm`,rect(size,size),[circ(opening),...holes(pitch,pitch,3.5)],rect(size,size),depth,pins(2),{tags:['cooling','air','blower','four holes']});
for(const [w,h,rows] of [[30,20,4],[50,30,6],[80,40,8],[100,50,10]])
  add('ventilation',`Slotted vent · ${w} × ${h} mm`,rect(w,h),Array.from({length:rows},(_,i)=>rect(w-8,2,0,(i-(rows-1)/2)*4,1)),rect(w,h),0,[],{tags:['air','grille','ventilation','slots'],maxThickness:100});
for(const size of [30,50,80]) add('ventilation',`Perforated vent · ${size} mm`,rect(size,size),Array.from({length:25},(_,i)=>circ(size/12,(i%5-2)*size/6,(Math.floor(i/5)-2)*size/6)),rect(size,size),0,[],{tags:['air','grille','ventilation','perforation'],maxThickness:100});

for(const [name,w,h,pw,ph,depth] of [['Small square PCB carrier',30,30,24,24,12],['Medium square PCB carrier',50,50,42,42,15],['Large square PCB carrier',80,80,70,70,20],['Narrow controller carrier',55,25,47,17,15],['Medium controller carrier',70,55,60,45,20],['Large controller carrier',100,70,90,60,25],['Relay module carrier',50,30,42,22,22],['DC converter carrier',48,28,40,20,18],['Sensor breakout carrier',25,20,19,14,12],['Single-board computer carrier',90,60,80,50,25],['Battery holder carrier',65,40,55,30,25],['DIN rail clip mount',45,35,35,25,15]])
  add('carriers',name,rect(w,h),holes(pw,ph),rect(w,h),depth,[],{tags:['PCB','board','module','four holes','generic pitch'],maxThickness:100});

export const builtinParts = [...starterParts.map(d=>({...clone(d),category:starterCategories[d.id],tags:['starter']})),...manufacturerParts.map(d=>({...clone(d),category:'buttons',tags:['E-Switch',d.partNumber,'manufacturer drawing']})),...generic];
export function shapeSummary(s) {
  if(s.type==='circle')return `Ø${s.d}`;
  if(s.type==='rect')return `${s.w} × ${s.h}${s.r ? ` R${s.r}`:''}`;
  return s.type==='path'?'Closed path':'Polygon';
}
export function openingSummary(d) {
  if(d.openings.length===1)return `${shapeSummary(d.openings[0])} mm`;
  const groups=new Map();
  for(const s of d.openings){const key=shapeSummary(s);groups.set(key,(groups.get(key)||0)+1);}
  return [...groups].map(([shape,n])=>`${n} × ${shape}`).join(' + ')+' mm';
}
const normalize = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/²/g,'2').replace(/[×/·−–—-]/g,' ').toLowerCase();
export function filterParts(parts,{query='',category='all',source='all',favorites=[]}={}) {
  const terms=normalize(query).trim().split(/\s+/).filter(Boolean),saved=new Set(favorites);
  return parts.filter(d=> {
    if(category!=='all'&&partCategory(d)!==category)return false;
    if(source!=='all'&&!(source==='favorites'?saved.has(d.id):partSource(d)===source))return false;
    const words=normalize([d.name,d.id,d.manufacturer,d.partNumber,categoryLabel(d),...(d.tags||[]),openingSummary(d)].join(' ')).split(/[\s,;()]+/);
    return terms.every(t=>words.some(w=>w.startsWith(t)));
  });
}
