(function(root){
'use strict';
const R=6371,D=Math.PI/180,unit=v=>v.map(x=>x/Math.hypot(...v)),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(v,k)=>v.map(x=>x*k),add=(a,b)=>a.map((x,i)=>x+b[i]);
const presets={600:{h:600,planes:16,perPlane:28,inclination:86.4,beams:{set1:397,set2:37},diameter:{set1:66,set2:175.4}},1200:{h:1200,planes:10,perPlane:16,inclination:86.4,beams:{set1:331,set2:61},diameter:{set1:149,set2:242.6}}};
function ground(lon,lat){return [R*Math.cos(lat*D)*Math.cos(lon*D),R*Math.cos(lat*D)*Math.sin(lon*D),R*Math.sin(lat*D)];}
function orbit(p,omegaDeg,uDeg){const o=omegaDeg*D,u=uDeg*D,i=p.inclination*D,r=R+p.h;return [r*(Math.cos(o)*Math.cos(u)-Math.sin(o)*Math.sin(u)*Math.cos(i)),r*(Math.sin(o)*Math.cos(u)+Math.cos(o)*Math.sin(u)*Math.cos(i)),r*Math.sin(u)*Math.sin(i)];}
function satellites(height=600,phase=0,span=180,stagger=true){const p=presets[height],out=[];for(let plane=0;plane<p.planes;plane++)for(let k=0;k<p.perPlane;k++){const omega=span*plane/p.planes,u=phase+360*k/p.perPlane+(stagger&&plane%2?180/p.perPlane:0);out.push({id:`O${plane+1}-S${k+1}`,plane,k,omega,u,pos:orbit(p,omega,u)});}return out;}
function link(sat,ue){const v=sub(sat.pos,ue),d=Math.hypot(...v),elevation=Math.asin(Math.max(-1,Math.min(1,dot(unit(v),unit(ue)))))/D;return {distance:d,elevation,visible:elevation>1e-8,serviceable:elevation>=30};}
function target(sat,ue,aim='nadir',offset=200){if(aim==='nadir')return mul(unit(sat.pos),R);if(aim==='ue')return ue;const lat=Math.asin(ue[2]/R),lon=Math.atan2(ue[1],ue[0]),a=offset/R,c=unit(ue),east=[-Math.sin(lon),Math.cos(lon),0];return mul(add(mul(c,Math.cos(a)),mul(east,Math.sin(a))),R);}
function offaxis(sat,ue,center){return Math.acos(Math.max(-1,Math.min(1,dot(unit(sub(ue,sat.pos)),unit(sub(center,sat.pos))))))/D;}
function classify(list,ue){return list.map(s=>({...s,...link(s,ue)})).sort((a,b)=>b.elevation-a.elevation);}
function coverage(h,e=30){const beta=Math.asin(R/(R+h)*Math.cos(e*D)),alpha=Math.PI/2-e*D-beta;return {alpha:alpha/D,arc:R*alpha};}
const api={R,D,presets,unit,dot,sub,mul,add,ground,orbit,satellites,link,target,offaxis,classify,coverage};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.C6870=api;
})(typeof globalThis!=='undefined'?globalThis:this);
