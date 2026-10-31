(function(root){
  'use strict';
  const R=6371, DEG=Math.PI/180, HPBW=4.41*DEG;
  const presets={M10:{h:600,ds:2.7680,dO:2.3971,g:1.3840},M15:{h:1200,ds:5.5549,dO:4.8107,g:2.7774}};
  const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a);
  const at=(lon,lat,r=R)=>[r*Math.cos(lon*DEG)*Math.cos(lat*DEG),r*Math.sin(lon*DEG)*Math.cos(lat*DEG),r*Math.sin(lat*DEG)];
  function basis(lon,lat){let l=lon*DEG,p=lat*DEG;return {east:[-Math.sin(l),Math.cos(l),0],north:[-Math.cos(l)*Math.sin(p),-Math.sin(l)*Math.sin(p),Math.cos(p)],nadir:mul(at(lon,lat,1),-1)};}
  function satList(key,latitude=0){const p=presets[key];let out=[];for(let plane=0;plane<3;plane++){let offsets=plane===1?[-p.ds,0,p.ds]:[-p.g,p.g];offsets.forEach((offset,k)=>{let lon=(plane-1)*p.dO,phase=latitude+offset,lat=phase,l=lon;if(phase>90){lat=180-phase;l=lon+180;}out.push({id:`P${plane+1}-${k+1}`,plane,k,lon:l,lat,phase,offset,reference:plane===1&&k===1,pos:at(l,lat,R+p.h),ground:at(l,lat),basis:basis(l,lat)});});}return out;}
  const beams=[];let br=Math.sin(HPBW/2);for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){let ring=Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));if(ring<=4)beams.push({q,r,ring,u:Math.sqrt(3)*br*(q+r/2),v:1.5*br*r});}beams.sort((a,b)=>a.ring-b.ring||a.r-b.r||a.q-b.q);beams.forEach((b,i)=>b.id=i);
  function ray(sat,u,v){const sq=1-u*u-v*v;if(sq<0)return null;return add(add(mul(sat.basis.east,u),mul(sat.basis.north,v)),mul(sat.basis.nadir,Math.sqrt(sq)));}
  function hit(sat,u,v){const d=ray(sat,u,v);if(!d)return null;let b=dot(sat.pos,d),disc=b*b-dot(sat.pos,sat.pos)+R*R;if(disc<0)return null;let t=-b-Math.sqrt(disc);return t>0?add(sat.pos,mul(d,t)):null;}
  function outline(sat,b,steps=24){let pts=[];for(let i=0;i<=steps;i++){let a=2*Math.PI*i/steps;let p=hit(sat,b.u+br*Math.cos(a),b.v+br*Math.sin(a));if(p)pts.push(p);}return pts;}
  function frequency(sat,b){return ((b.q-b.r+sat.plane+(sat.k%2))+99)%3;}
  function projectLocal(pos,ref){let b=basis(0,ref),d=sub(pos,at(0,ref));return [dot(d,b.east),dot(d,b.north),-dot(d,b.nadir)];}
  function groundDistance(a,b){let x=dot(a,b)/(norm(a)*norm(b));return R*Math.acos(Math.min(1,Math.max(-1,x)));}
  function proposalGeometry(h,hpbw=HPBW,nc=5){
    const beta=Math.acos(1-hpbw*hpbw/8);
    const theta=nc%2?(nc-1)/2*(hpbw+beta)+hpbw/4:nc/2*beta+(nc/2-1)*hpbw+hpbw/2;
    const elevation=Math.acos((R+h)/R*Math.sin(theta));
    const half=Math.PI/2-theta-elevation;
    return {h,hpbw,nc,beta,theta,elevation,half,sat:2*half,orbit:Math.sqrt(3)*half,gamma:half};
  }
  function coverageTriangle(h){
    const g=proposalGeometry(h),os=R+h,oh=os*Math.sin(g.theta),sh=os*Math.cos(g.theta),ph=Math.sqrt(R*R-oh*oh),sp=sh-ph;
    const direction=[Math.sin(g.theta),-Math.cos(g.theta)];
    const O=[0,0],S=[0,os],N=[0,R],H=[sh*direction[0],os+sh*direction[1]],P=[sp*direction[0],os+sp*direction[1]];
    const zeta=Math.asin(oh/R),alpha=Math.PI-zeta;
    return {...g,O,S,N,P,H,os,oh,sh,ph,sp,zeta,alpha};
  }
  const api={R,DEG,HPBW,presets,beams,beamRadius:br,at,basis,satList,ray,hit,outline,frequency,projectLocal,groundDistance,proposalGeometry,coverageTriangle,add,sub,mul,dot,norm};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NTN=api;
})(typeof globalThis!=='undefined'?globalThis:this);
