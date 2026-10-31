(function(){
  'use strict';
  let pixels=null,tw=0,th=0,cache=new Map();
  const image=new Image();
  image.onload=()=>{const c=document.createElement('canvas');c.width=tw=image.naturalWidth;c.height=th=image.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);pixels=x.getImageData(0,0,tw,th).data;cache.clear();window.dispatchEvent(new Event('earthready'));};
  image.src='assets/earth-natural-earth.png';
  function sample(lon,lat){if(!pixels)return [17,56,94];let x=Math.min(tw-1,Math.max(0,Math.floor((((lon+180)%360+360)%360)/360*tw))),y=Math.min(th-1,Math.max(0,Math.floor((90-lat)/180*th))),i=(y*tw+x)*4;return [pixels[i],pixels[i+1],pixels[i+2]];}
  function globe(ctx,cx,cy,r,camera){
    const size=Math.min(1000,Math.max(80,Math.ceil(r*2))),key=[size,...camera.e,...camera.n,...camera.f,!!pixels].map(x=>typeof x==='number'?x.toFixed(3):x).join(',');
    let c=cache.get(key);
    if(!c){c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),data=x.createImageData(size,size),out=data.data,rad=size/2;
      const sun=[.474,-.742,.474],e=camera.e,n=camera.n,f=camera.f;
      for(let y=0;y<size;y++)for(let px=0;px<size;px++){
        let a=(px+.5-rad)/rad,b=-(y+.5-rad)/rad,z2=1-a*a-b*b;if(z2<0)continue;let z=Math.sqrt(z2),wx=a*e[0]+b*n[0]+z*f[0],wy=a*e[1]+b*n[1]+z*f[1],wz=a*e[2]+b*n[2]+z*f[2];
        let rgb=sample(Math.atan2(wy,wx)*180/Math.PI,Math.asin(Math.max(-1,Math.min(1,wz)))*180/Math.PI),light=.16+.84*Math.max(0,wx*sun[0]+wy*sun[1]+wz*sun[2]),limb=Math.pow(1-z,3),i=(y*size+px)*4;
        for(let k=0;k<3;k++)out[i+k]=Math.min(255,rgb[k]*light*(.8+.2*z)+[26,92,151][k]*limb*.33);out[i+3]=255;
      }
      x.putImageData(data,0,0);if(cache.size>5)cache.clear();cache.set(key,c);
    }
    const glow=ctx.createRadialGradient(cx,cy,r*.97,cx,cy,r*1.09);glow.addColorStop(0,'#4aa8e338');glow.addColorStop(.38,'#3488c72b');glow.addColorStop(1,'#3488c700');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,r*1.09,0,Math.PI*2);ctx.fill();ctx.drawImage(c,cx-r,cy-r,r*2,r*2);ctx.strokeStyle='#5ba9d84d';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  }
  window.EarthSurface={sample,globe,ready:()=>!!pixels};
})();
