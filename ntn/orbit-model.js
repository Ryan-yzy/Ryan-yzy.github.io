(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NTNOrbit=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const R=6378,MU=398600.4418,DAY=86164.0905,WE=2*Math.PI/DAY,C=299792.458,D=Math.PI/180;
  const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),unit=a=>mul(a,1/norm(a));
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],clamp=x=>Math.max(-1,Math.min(1,x)),wrap=x=>((x%360)+360)%360;
  const rotZ=(a,t)=>[Math.cos(t)*a[0]-Math.sin(t)*a[1],Math.sin(t)*a[0]+Math.cos(t)*a[1],a[2]];
  function circular(h){const r=R+h,n=Math.sqrt(MU/r**3);return {r,n,v:Math.sqrt(MU/r),period:2*Math.PI/n,g:MU/r**2*1000};}
  function orientation(radius,inc,raan,u){const i=inc*D,o=raan*D,a=u*D;return [radius*(Math.cos(o)*Math.cos(a)-Math.sin(o)*Math.sin(a)*Math.cos(i)),radius*(Math.sin(o)*Math.cos(a)+Math.cos(o)*Math.sin(a)*Math.cos(i)),radius*Math.sin(a)*Math.sin(i)];}
  function satellite(config,p,q,t=0){const T=config.P*config.S,orbit=circular(config.h),span=config.type==='star'?180:360,raan=(config.raan0||0)+p*span/config.P,u=(config.u0??45)+q*360/config.S+p*config.F*360/T+orbit.n*t/D;
    const eci=orientation(orbit.r,config.i,raan,u),vEci=orientation(orbit.v,config.i,raan,u+90),ecef=rotZ(eci,-WE*t),vEcef=sub(rotZ(vEci,-WE*t),cross([0,0,WE],ecef));
    return {p,q,raan:wrap(raan),u:wrap(u),eci,vEci,ecef,vEcef,lat:Math.asin(clamp(ecef[2]/orbit.r))/D,lon:Math.atan2(ecef[1],ecef[0])/D};
  }
  function ground(lat,lon){const a=lat*D,b=lon*D;return [R*Math.cos(a)*Math.cos(b),R*Math.cos(a)*Math.sin(b),R*Math.sin(a)];}
  function link(sat,lat,lon,frequencyGHz=2){const ue=ground(lat,lon),v=sub(sat.ecef,ue),distance=norm(v),elevation=Math.asin(clamp(dot(v,ue)/(distance*R)))/D,rangeRate=dot(sat.vEcef,v)/distance;
    return {ue,distance,elevation,rangeRate,delayMs:distance/C*1000,dopplerHz:-frequencyGHz*1e9*rangeRate/C};
  }
  function coverage(h,minEl){return Math.acos(clamp(R/(R+h)*Math.cos(minEl*D)))-minEl*D;}
  return {R,MU,DAY,WE,C,D,add,sub,mul,dot,norm,unit,cross,clamp,wrap,rotZ,circular,orientation,satellite,ground,link,coverage};
});
