(function (root) {
  'use strict';
  const R = 6371, DEG = Math.PI / 180;
  const clamp = x => Math.max(-1, Math.min(1, x));
  const add = (a,b) => a.map((x,i)=>x+b[i]);
  const sub = (a,b) => a.map((x,i)=>x-b[i]);
  const mul = (a,s) => a.map(x=>x*s);
  const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm = a => Math.hypot(...a);
  const unit = a => mul(a,1/norm(a));
  const angle = (a,b) => Math.atan2(norm(cross(a,b)),dot(a,b));
  const arc = (a,b) => R*angle(a,b);
  function frame(lat=0,lon=0) {
    const p=lat*DEG,l=lon*DEG;
    return {n:[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],e:[-Math.sin(l),Math.cos(l),0],q:[-Math.sin(p)*Math.cos(l),-Math.sin(p)*Math.sin(l),Math.cos(p)]};
  }
  function exp(f,d,psi) {
    return add(mul(f.n,Math.cos(d/R)),mul(add(mul(f.e,Math.cos(psi)),mul(f.q,Math.sin(psi))),Math.sin(d/R)));
  }
  function slerp(a,b,f) {
    const w=angle(a,b);
    return w<1e-12?a.slice():unit(add(mul(a,Math.sin((1-f)*w)/Math.sin(w)),mul(b,Math.sin(f*w)/Math.sin(w))));
  }
  function rotate(v,axis,a) {
    return add(add(mul(v,Math.cos(a)),mul(cross(axis,v),Math.sin(a))),mul(axis,dot(axis,v)*(1-Math.cos(a))));
  }
  function transport(f,n) {
    const a=angle(f.n,n),c=cross(f.n,n);
    if(a<1e-10) return {n,e:f.e.slice(),q:f.q.slice()};
    const ax=unit(c);
    return {n,e:rotate(f.e,ax,a),q:rotate(f.q,ax,a)};
  }
  function grid(f,d,t) {
    const points=[{v:f.n.slice(),ring:0,side:0,i:0,id:0}];
    for(let n=1;n<=t;n++) {
      for(let side=0;side<6;side++) {
        const a=exp(f,n*d,Math.PI/6+side*Math.PI/3),b=exp(f,n*d,Math.PI/6+(side+1)*Math.PI/3);
        for(let i=0;i<n;i++) points.push({v:slerp(a,b,i/n),ring:n,side,i,id:points.length});
      }
    }
    return points;
  }
  function spacing(h,hpbw) {
    const uv=Math.sqrt(3)*Math.sin(hpbw*DEG/2),sat=Math.asin(uv),arg=(R+h)/R*Math.sin(sat);
    if(!Number.isFinite(sat)||Math.abs(arg)>1) throw new Error('该波束间距对应的射线未与地球近侧相交。');
    const earth=Math.asin(arg)-sat;
    return {uv,sat,earth,d:R*earth};
  }
  const count=t=>1+3*t*(t+1);
  const ringCount=(t,k)=>count(t)-count(Math.max(0,t-k));
  function build(o) {
    const sp=spacing(o.h,o.hpbw),f=frame(o.lat,o.lon),D=Math.sqrt(3)*o.t*sp.d,delta=o.rho*sp.d/D;
    const sats=[{id:0,f,S:mul(f.n,R+o.h),points:grid(f,sp.d,o.t)}];
    for(let k=0;k<6;k++) {
      const n=exp(f,D,k*Math.PI/3+delta),nf=transport(f,n);
      sats.push({id:k+1,f:nf,S:mul(n,R+o.h),points:grid(nf,sp.d,o.t)});
    }
    const first=o.t-o.roi+1,roi=sats[0].points.filter(p=>p.ring>=first);
    // Chord-distance threshold is exactly equivalent to the great-circle criterion.
    const threshold=2*Math.sin(o.buffer*sp.d/(2*R)),threshold2=threshold*threshold+1e-14;
    for(const s of sats) for(const p of s.points) {
      p.sat=s.id;p.roi=s.id===0&&p.ring>=first;
      p.keep=p.roi||roi.some(r=>{const dx=p.v[0]-r.v[0],dy=p.v[1]-r.v[1],dz=p.v[2]-r.v[2];return dx*dx+dy*dy+dz*dz<=threshold2;});
    }
    return {o,sp,f,D,delta,sats,roi,first};
  }
  function project(v,f) {
    const w=angle(f.n,v),x=dot(v,f.e),y=dot(v,f.q),z=Math.hypot(x,y);
    return z<1e-12?[0,0]:[R*w*x/z,R*w*y/z];
  }
  function elevation(S,U) {return Math.asin(clamp(dot(unit(sub(S,U)),unit(U))))/DEG;}
  function power(s,p,U,hpbw) {
    const a=sub(mul(p.v,R),s.S),b=sub(U,s.S),theta=angle(a,b)/DEG;
    const g=-Math.min(12*(theta/hpbw)**2,30),distance=norm(b);
    // Relative received power: common EIRP/receiver constants cancel in the SIR.
    return {value:elevation(s.S,U)>0?10**(g/10)/(distance*distance):0,g,theta,distance};
  }
  function budget(m,servingId,activeMax=32,snapshot=0) {
    let p=m.sats[0].points.find(p=>p.id===servingId&&p.roi)||m.roi[Math.floor(m.roi.length*.7)];
    // UE is displaced 0.22*d from its serving center so the link is visible in the diagram.
    const uf=transport(m.f,p.v),U=mul(exp(uf,.22*m.sp.d,1.1),R),links=[];
    let signal=0,intra=0,inter=0;
    const allActive=[];
    for(const s of m.sats) {
      const sorted=s.points.map(p=>({p,key:((p.id+1)*2654435761+(snapshot+1)*(p.id+7)*2246822519+s.id*3266489917)>>>0})).sort((a,b)=>a.key-b.key);
      const act=sorted.slice(0,Math.min(activeMax,sorted.length)).map(x=>x.p);
      if(s.id===0&&!act.includes(p)) act[act.length-1]=p;
      allActive.push(new Set(act.map(p=>p.id)));
      for(const b of act) {
        if(s.id===0&&b===p) {signal=power(s,b,U,m.o.hpbw).value;continue;}
        if(!b.keep) continue;
        const v=power(s,b,U,m.o.hpbw),link={sat:s.id,beam:b.id,p:b,...v};
        links.push(link);
        if(s.id===0) intra+=v.value;else inter+=v.value;
      }
    }
    links.sort((a,b)=>b.value-a.value);
    return {p,U,links,signal,intra,inter,allActive,sirSingle:intra>0?10*Math.log10(signal/intra):Infinity,sirMulti:intra+inter>0?10*Math.log10(signal/(intra+inter)):Infinity,loss:intra>0?10*Math.log10(1+inter/intra):(inter>0?Infinity:0)};
  }
  const api={R,DEG,add,sub,mul,dot,cross,norm,unit,angle,arc,frame,exp,slerp,transport,grid,spacing,count,ringCount,build,project,elevation,power,budget};
  root.VivoModel=api;
  if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
