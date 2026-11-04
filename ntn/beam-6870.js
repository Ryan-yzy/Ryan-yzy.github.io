(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./constellation-6870'):root.C6870;
const sqrt3=Math.sqrt(3),D=Math.PI/180;
function basis(sat){const n=C.unit(sat.pos),lon=Math.atan2(n[1],n[0]),east=[-Math.sin(lon),Math.cos(lon),0],north=[-n[2]*Math.cos(lon),-n[2]*Math.sin(lon),Math.hypot(n[0],n[1])];return {n,east,north};}
function point(sat,x,y){const b=basis(sat),t=Math.hypot(x,y)/C.R,f=t<1e-10?1:Math.sin(t)/t;return C.add(C.mul(b.n,C.R*Math.cos(t)),C.add(C.mul(b.east,x*f),C.mul(b.north,y*f)));}
function canonical(sat,p){const b=basis(sat);return [C.dot(p,b.n),C.dot(p,b.east),C.dot(p,b.north)];}
function toUV(sat,p){const q=C.unit(canonical(sat,p));return {u:.5+Math.atan2(q[1],q[0])/(2*Math.PI),v:.5-Math.asin(Math.max(-1,Math.min(1,q[2])))/Math.PI};}
function fromUV(sat,u,v){const lon=(u-.5)*2*Math.PI,lat=(.5-v)*Math.PI,b=basis(sat);return C.mul(C.add(C.mul(b.n,Math.cos(lat)*Math.cos(lon)),C.add(C.mul(b.east,Math.cos(lat)*Math.sin(lon)),C.mul(b.north,Math.sin(lat)))),C.R);}
function grid(h,set='set1'){const p=C.presets[h],rings=Math.round((Math.sqrt(12*p.beams[set]-3)-3)/6),radius=p.diameter[set]/2,out=[];for(let q=-rings;q<=rings;q++)for(let r=-rings;r<=rings;r++){const ring=Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));if(ring<=rings)out.push({q,r,ring,x:sqrt3*radius*(q+r/2),y:1.5*radius*r,radius});}out.sort((a,b)=>a.ring-b.ring||a.r-b.r||a.q-b.q);out.forEach((b,i)=>b.id=i);return out;}
function center(sat,b){return point(sat,b.x,b.y);}
function vertices(sat,b){return Array.from({length:7},(_,i)=>{const a=(30+i*60)*D;return point(sat,b.x+b.radius*Math.cos(a),b.y+b.radius*Math.sin(a));});}
function random(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function lonlat(p){return {lon:Math.atan2(p[1],p[0])/D,lat:Math.asin(p[2]/C.R)/D};}
function sampleUEs(sat,beams,count=3,seed=6870){const out=[];for(const b of beams){const rng=random((seed^Math.imul(b.id+1,2654435761))>>>0);let j=0;for(let n=0;n<5000&&j<count;n++){const dx=(rng()*2-1)*sqrt3*b.radius/2,dy=(rng()*2-1)*b.radius;if(Math.abs(dy)>b.radius-Math.abs(dx)/sqrt3)continue;const x=b.x+dx,y=b.y+dy,t=Math.hypot(x,y)/C.R,jac=t<1e-10?1:Math.sin(t)/t;if(rng()>jac)continue;const p=point(sat,x,y),ll=lonlat(p);if(Math.abs(ll.lon)>20||Math.abs(ll.lat)>20)continue;out.push({id:`B${b.id+1}-U${j+1}`,position:p,beam:b,x,y});j++;}}return out;}
const frequency=b=>((b.q-b.r)%3+3)%3;
function links(satellites,ref,ue,beams,reuse=1,scope='multi'){const list=[];for(const sat of satellites){if(scope==='same'&&sat.id!==ref.id)continue;const l=C.link(sat,ue.position);if(!l.visible)continue;for(const b of beams){if(sat.id===ref.id&&b.id===ue.beam.id)continue;if(reuse===3&&frequency(b)!==frequency(ue.beam))continue;const c=center(sat,b);if(C.dot(c,C.sub(sat.pos,c))<=0)continue;list.push({sat,beam:b,...l,theta:C.offaxis(sat,ue.position,c),center:c});}}return list;}
const api={basis,point,canonical,toUV,fromUV,grid,center,vertices,sampleUEs,lonlat,frequency,links};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B6870=api;
})(typeof globalThis!=='undefined'?globalThis:this);

