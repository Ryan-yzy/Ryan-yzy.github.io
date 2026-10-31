(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.NTN;
  const unit=a=>M.mul(a,1/M.norm(a));
  function rng(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  function inCell(sat,b,p){const d=unit(M.sub(p,sat.pos)),u=M.dot(d,sat.basis.east)-b.u,v=M.dot(d,sat.basis.north)-b.v;return Math.abs(u)<=Math.sqrt(3)*M.beamRadius/2+1e-10&&Math.abs(v)<=M.beamRadius-Math.abs(u)/Math.sqrt(3)+1e-10;}
  // Uniform spherical-cap sampling followed by clipping to each beam's hexagonal service cell.
  function sampleUEs(key,count=3,latitude=0,seed=610){
    const ref=M.satList(key,latitude).find(s=>s.reference),random=rng(seed),out=[];
    for(const beam of M.beams){const center=M.hit(ref,beam.u,beam.v),c=unit(center),lon=Math.atan2(c[1],c[0])/M.DEG,lat=Math.asin(c[2])/M.DEG,base=M.basis(lon,lat);let radius=0;
      for(let i=0;i<6;i++){const a=(30+i*60)*M.DEG,p=M.hit(ref,beam.u+M.beamRadius*Math.cos(a),beam.v+M.beamRadius*Math.sin(a));if(p)radius=Math.max(radius,M.groundDistance(center,p)/M.R);}
      // The cell vertices lie on the circle. Inflate the cap slightly to encompass curved sides.
      radius*=1.03;
      for(let j=0;j<count;j++){let p=null;for(let n=0;n<10000;n++){const z=1-random()*(1-Math.cos(radius)),r=Math.sqrt(Math.max(0,1-z*z)),a=2*Math.PI*random();const q=M.mul(M.add(M.mul(c,z),M.add(M.mul(base.east,r*Math.cos(a)),M.mul(base.north,r*Math.sin(a)))),M.R);if(inCell(ref,beam,q)){p=q;break;}}if(!p)throw new Error('UE sampling failed');out.push({id:`B${beam.id+1}-U${j+1}`,beam,position:p,inner:beam.ring<=2});}
    }return out;
  }
  function link(sat,beam,point,fcGHz=2){const v=M.sub(point,sat.pos),d=M.norm(v),q=M.mul(v,1/d),axis=M.ray(sat,beam.u,beam.v),theta=Math.acos(Math.max(-1,Math.min(1,M.dot(q,axis))))/M.DEG,visible=M.dot(point,M.sub(sat.pos,point))>0;return {distance:d,theta,fspl:92.45+20*Math.log10(fcGHz)+20*Math.log10(d),visible};}
  function candidates(key,ue,latitude=0,scope='multi',reuse=true){const sats=M.satList(key,latitude),ref=sats.find(s=>s.reference),f=M.frequency(ref,ue.beam),out=[];
    for(const sat of sats)for(const beam of M.beams){if(sat.reference&&beam.id===ue.beam.id)continue;if(scope==='same'&&!sat.reference)continue;if(reuse&&M.frequency(sat,beam)!==f)continue;const l=link(sat,beam,ue.position);if(l.visible)out.push({sat,beam,...l});}return out;
  }
  function ratios(cnrDb,cirDb){const n=10**(-cnrDb/10),i=10**(-cirDb/10);return {sinr:-10*Math.log10(n+i),noise:n,interference:i};}
  const api={sampleUEs,inCell,link,candidates,ratios};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SetupModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
