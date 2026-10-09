/* Normalized SVG geometry only. Raw XML never enters the application DOM. */
import {commands, mapCommands} from './geometry.js';
const I=[1,0,0,1,0,0], reNum='[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?';
export const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m,x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
function numbers(s){const tokens=s.match(new RegExp(reNum,'g'))||[];if(s.replace(new RegExp(reNum,'g'),'').replace(/[\s,]/g,''))throw Error('Invalid SVG number.');return tokens.map(Number);}
export function parseTransform(s=''){
 let m=I.slice(),end=0;const re=/([A-Za-z]+)\s*\(([^)]*)\)/g;let q;
 while((q=re.exec(s))){if(s.slice(end,q.index).replace(/[\s,]/g,''))throw Error('Invalid transform.');end=re.lastIndex;const n=numbers(q[2]);let b;
 if(q[1]==='matrix'&&n.length===6)b=n;
 else if(q[1]==='translate'&&[1,2].includes(n.length))b=[1,0,0,1,n[0],n[1]||0];
 else if(q[1]==='scale'&&[1,2].includes(n.length))b=[n[0],0,0,n[1]??n[0],0,0];
 else if(q[1]==='rotate'&&[1,3].includes(n.length)){const a=n[0]*Math.PI/180,c=Math.cos(a),s=Math.sin(a);b=[c,s,-s,c,0,0];if(n.length===3)b=multiply(multiply([1,0,0,1,n[1],n[2]],b),[1,0,0,1,-n[1],-n[2]]);}
 else if(['skewX','skewY'].includes(q[1])&&n.length===1){b=I.slice();b[q[1]==='skewX'?2:1]=Math.tan(n[0]*Math.PI/180);}
 else throw Error('Unsupported SVG transform.');
 if(!b.every(Number.isFinite))throw Error('Non-finite transform.');m=multiply(m,b);
 }
 if(s.slice(end).trim()||Math.abs(m[0]*m[3]-m[1]*m[2])<1e-12)throw Error('Invalid or collapsed SVG transform.');return m;
}
// SVG elliptical arcs converted to cubic segments no larger than 22.5 degrees.
function arc(x,y,rx,ry,angle,large,sweep,nx,ny){
 if(![0,1].includes(large)||![0,1].includes(sweep))throw Error('Arc flags must be 0 or 1.');
 rx=Math.abs(rx);ry=Math.abs(ry);if(x===nx&&y===ny)return [];if(!rx||!ry)return [{type:'L',x:nx,y:ny}];
 const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=(x-nx)/2,dy=(y-ny)/2,xp=c*dx+s*dy,yp=-s*dx+c*dy;
 const scale=Math.sqrt(xp*xp/(rx*rx)+yp*yp/(ry*ry));if(scale>1){rx*=scale;ry*=scale;}
 const k=(large===sweep?-1:1)*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp)));
 const cxp=k*rx*yp/ry,cyp=-k*ry*xp/rx,cx=c*cxp-s*cyp+(x+nx)/2,cy=s*cxp+c*cyp+(y+ny)/2;
 const start=Math.atan2((yp-cyp)/ry,(xp-cxp)/rx);let delta=Math.atan2((-yp-cyp)/ry,(-xp-cxp)/rx)-start;
 if(sweep&&delta<0)delta+=Math.PI*2;if(!sweep&&delta>0)delta-=Math.PI*2;
 const count=Math.ceil(Math.abs(delta)/(Math.PI/8)),out=[];
 const p=t=>({x:cx+c*rx*Math.cos(t)-s*ry*Math.sin(t),y:cy+s*rx*Math.cos(t)+c*ry*Math.sin(t)});
 const d=t=>({x:-c*rx*Math.sin(t)-s*ry*Math.cos(t),y:-s*rx*Math.sin(t)+c*ry*Math.cos(t)});
 for(let j=0;j<count;j++){const u=start+delta*j/count,v=start+delta*(j+1)/count,f=4/3*Math.tan((v-u)/4),p0=p(u),p1=p(v),d0=d(u),d1=d(v);out.push({type:'C',x1:p0.x+f*d0.x,y1:p0.y+f*d0.y,x2:p1.x-f*d1.x,y2:p1.y-f*d1.y,x:p1.x,y:p1.y});}
 out.at(-1).x=nx;out.at(-1).y=ny;return out;
}
export function parsePath(s){
 if(typeof s!=='string'||s.length>1000000)throw Error('Invalid SVG path.');
 const tokenRE=new RegExp('[AaCcHhLlMmQqSsTtVvZz]|'+reNum,'g'),ts=s.match(tokenRE)||[];
 if(s.replace(tokenRE,'').replace(/[\s,]/g,''))throw Error('Unsupported SVG path token.');
 let i=0,cmd='',x=0,y=0,sx=0,sy=0,previous='',cx=0,cy=0,out=[];
 const n=()=>{const v=Number(ts[i++]);if(!Number.isFinite(v))throw Error('Missing SVG path coordinates.');return v;};
 while(i<ts.length){if(/^[a-z]$/i.test(ts[i]))cmd=ts[i++];if(!cmd)throw Error('Missing SVG path command.');const c=cmd.toUpperCase(),rel=c!==cmd;
 if(!out.length&&c!=='M')throw Error('Path must start with M.');
 const xy=()=>{const a=n(),b=n();return {x:a+(rel?x:0),y:b+(rel?y:0)};};let p,a,b;
 switch(c){
 case 'M':p=xy();out.push({type:'M',...p});sx=p.x;sy=p.y;cmd=rel?'l':'L';break;
 case 'L':p=xy();out.push({type:'L',...p});break;
 case 'H':p={x:n()+(rel?x:0),y};out.push({type:'L',...p});break;
 case 'V':p={x,y:n()+(rel?y:0)};out.push({type:'L',...p});break;
 case 'C':a=xy();b=xy();p=xy();out.push({type:'C',x1:a.x,y1:a.y,x2:b.x,y2:b.y,...p});cx=b.x;cy=b.y;break;
 case 'S':a=['C','S'].includes(previous)?{x:2*x-cx,y:2*y-cy}:{x,y};b=xy();p=xy();out.push({type:'C',x1:a.x,y1:a.y,x2:b.x,y2:b.y,...p});cx=b.x;cy=b.y;break;
 case 'Q':a=xy();p=xy();out.push({type:'Q',x1:a.x,y1:a.y,...p});cx=a.x;cy=a.y;break;
 case 'T':a=['Q','T'].includes(previous)?{x:2*x-cx,y:2*y-cy}:{x,y};p=xy();out.push({type:'Q',x1:a.x,y1:a.y,...p});cx=a.x;cy=a.y;break;
 case 'A':{const rx=n(),ry=n(),angle=n(),large=n(),sweep=n();p=xy();out.push(...arc(x,y,rx,ry,angle,large,sweep,p.x,p.y));break;}
 case 'Z':out.push({type:'Z'});p={x:sx,y:sy};cmd='';break;
 default:throw Error('Unsupported path command.');
 }
 x=p.x;y=p.y;previous=c;if(out.length>20000)throw Error('SVG path is too complex.');
 }if(!out.length)throw Error('Empty SVG path.');return out;
}
export function transformShape(shape,m){
 const [a,b,c,d]=m;
 if(shape.type==='rect'&&Math.abs(b)<1e-10&&Math.abs(c)<1e-10&&Math.abs(Math.abs(a)-Math.abs(d))<1e-8)return {...shape,...point(m,shape.x||0,shape.y||0),w:shape.w*Math.abs(a),h:shape.h*Math.abs(d),r:(shape.r||0)*Math.abs(a)};
 if(shape.type==='circle'&&Math.abs(a*a+b*b-c*c-d*d)<1e-8&&Math.abs(a*c+b*d)<1e-8)return {type:'circle',...point(m,shape.x||0,shape.y||0),d:shape.d*Math.hypot(a,b)};
 if(shape.type==='polygon')return {...shape,points:shape.points.map(p=>point(m,p.x,p.y))};
 return {type:'path',commands:mapCommands(commands(shape),(x,y)=>point(m,x,y))};
}
export function normalizedSVG(text){
 if(text.length>2000000||/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('SVG is oversized or contains unsupported entities.');
 const doc=new DOMParser().parseFromString(text,'image/svg+xml'),root=doc.documentElement;
 if(doc.querySelector('parsererror')||root.localName!=='svg')throw Error('Malformed SVG.');
 const allowed=['svg','g','path','circle','ellipse','rect','polygon','polyline','line','title','desc','metadata'];
 for(const el of [root,...root.querySelectorAll('*')]){
 if(!allowed.includes(el.localName)||el!==root&&el.localName==='svg')throw Error(`SVG ${el.localName} is unsupported. Use plain geometry.`);
 for(const at of el.attributes)if(/^on/i.test(at.name)||/href|style|class|clip|mask|filter/i.test(at.name)||/url\(/i.test(at.value))throw Error('SVG scripts, CSS and external resources are unsupported.');
 }
 const vb=numbers(root.getAttribute('viewBox')||'');if(vb.length!==4||!vb.every(Number.isFinite)||vb[2]<=0||vb[3]<=0)throw Error('SVG requires a valid viewBox.');
 const size=s=>{const m=(s||'').trim().match(new RegExp('^('+reNum+')(mm|cm|in|px)?$'));return m?Number(m[1])*({mm:1,cm:10,in:25.4,px:25.4/96}[m[2]||'px']):NaN;};
 const w=size(root.getAttribute('width')),h=size(root.getAttribute('height'));
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>5000||h>5000)throw Error('SVG needs physical width and height, up to 5000 mm.');
 const sx=w/vb[2],sy=h/vb[3];if(Math.abs(sx-sy)>1e-5)throw Error('SVG viewBox needs uniform physical scale.');
 const shapes=[],base=[sx,0,0,sy,-vb[0]*sx,-vb[1]*sy];
 function walk(el,parent){
 const m=multiply(parent,parseTransform(el.getAttribute('transform')||''));
 if(['title','desc','metadata'].includes(el.localName))return;
 if(['svg','g'].includes(el.localName)){for(const child of el.children)walk(child,m);return;}
 const val=(n,f=0)=>{const raw=el.getAttribute(n),v=raw===null?f:Number(raw);if(!Number.isFinite(v))throw Error('Invalid SVG coordinate.');return v;};let shape;
 if(el.localName==='path')shape={type:'path',commands:parsePath(el.getAttribute('d'))};
 if(['polygon','polyline'].includes(el.localName)){const p=numbers(el.getAttribute('points')||'');if(p.length<4||p.length%2)throw Error('Invalid point pairs.');const cs=[];for(let i=0;i<p.length;i+=2)cs.push({type:i?'L':'M',x:p[i],y:p[i+1]});if(el.localName==='polygon')cs.push({type:'Z'});shape={type:'path',commands:cs};}
 if(el.localName==='circle'){if(val('r')<=0)throw Error('Circle radius must be positive.');shape={type:'circle',x:val('cx'),y:val('cy'),d:2*val('r')};}
 if(el.localName==='ellipse'){if(val('rx')<=0||val('ry')<=0)throw Error('Ellipse radii must be positive.');shape=transformShape({type:'circle',x:0,y:0,d:2},[val('rx'),0,0,val('ry'),val('cx'),val('cy')]);}
 if(el.localName==='line')shape={type:'line',x:val('x1'),y:val('y1'),w:val('x2')-val('x1'),h:val('y2')-val('y1')};
 if(el.localName==='rect'){const width=val('width'),height=val('height');if(width<=0||height<=0)throw Error('Rectangle dimensions must be positive.');const rx=val('rx',val('ry')),ry=val('ry',rx);if(rx!==ry)throw Error('Elliptical rectangle corners: convert to path.');shape={type:'rect',x:val('x')+width/2,y:val('y')+height/2,w:width,h:height,r:rx};}
 shapes.push(transformShape(shape,m));if(shapes.length>1000)throw Error('SVG exceeds 1000 shapes.');
 }walk(root,base);if(!shapes.length)throw Error('No supported SVG geometry.');
 return {type:'vector',w,h,shapes,source:'SVG physical dimensions and affine transforms normalized to mm. Bézier curves retained; elliptical arcs approximated with ≤22.5° cubic segments.'};
}
