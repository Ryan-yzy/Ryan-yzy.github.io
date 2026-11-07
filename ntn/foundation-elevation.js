(function(root){
  'use strict';
  const R=6371, DEG=Math.PI/180;
  function calculate(heightKm,arcKm){
    if(!Number.isFinite(heightKm)||heightKm<=0||heightKm>40000||!Number.isFinite(arcKm)||arcKm<0||arcKm>Math.PI*R)throw new RangeError('高度需在 0–40000 km 之间，弧长需在 0–πRₑ 之间。');
    const psi=arcKm/R,vertical=(R+heightKm)*Math.cos(psi)-R,horizontal=(R+heightKm)*Math.sin(psi);
    return {psiDeg:psi/DEG,vertical,horizontal,distance:Math.hypot(vertical,horizontal),elevation:Math.atan2(vertical,horizontal)/DEG};
  }
  const api={R,calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FoundationElevation=api;
  if(typeof document==='undefined'||!document.getElementById('fa-height'))return;
  const $=id=>document.getElementById(id),f=(n,d=2)=>n.toFixed(d);
  const label=(x,y,t,c='#536675')=>`<text x="${x}" y="${y}" fill="${c}" font-size="12">${t}</text>`;
  function diagram(v){
    const x=54,y=v.elevation>=0?252:36,scale=230/v.distance,sx=x+v.horizontal*scale,sy=y-v.vertical*scale,a=v.elevation*DEG,r=40;
    const ax=x+r*Math.cos(a),ay=y-r*Math.sin(a),arc=`M${x+r},${y} A${r},${r} 0 0 ${a>=0?0:1} ${ax},${ay}`;
    $('fa-elevation-diagram').innerHTML=`<title>UE 当地坐标：仰角 ${f(v.elevation)} 度</title><g fill="none" stroke-width="1.5"><path d="M${x-20},${y} H385" stroke="#2c7b78"/><path d="M${x},18 V264" stroke="#c1cdd0" stroke-dasharray="4 4"/><path d="M${x},${y} L${sx},${sy}" stroke="#286f92" stroke-width="2"/><path d="M${x},${y} H${sx} V${sy}" stroke="#ad7b32" stroke-dasharray="5 4"/><path d="${arc}" stroke="#ad7b32"/></g><circle cx="${x}" cy="${y}" r="4" fill="#ad7b32"/><circle cx="${sx}" cy="${sy}" r="5" fill="#286f92"/>${label(x-20,y-10,'U')}${label(sx+10,Math.max(16,sy-8),'S','#286f92')}${label(295,y+(a>=0?22:-12),'当地水平面','#2c7b78')}${label(x-12,14,'天顶')}${label(165,y+(a>=0?22:-12),'t = '+f(v.horizontal,1)+' km')}${label(Math.min(sx+12,285),(sy+y)/2,'z = '+f(v.vertical,1)+' km')}${label(x+48,y-(a>=0?30:-35),'ε = '+f(v.elevation)+'°','#ad7b32')}`;
  }
  function render(){
    try{
      const height=Number($('fa-height').value),arc=Number($('fa-arc').value);
      if(!$('fa-height').value||!$('fa-arc').value)throw new RangeError('请输入卫星高度和地表弧长。');
      const v=calculate(height,arc);$('fa-error').textContent='';
      $('fa-metrics').innerHTML=[['UE 仰角 ε',f(v.elevation)+'°'],['地心角 ψ',f(v.psiDeg,4)+'°'],['星地斜距 d',f(v.distance,2)+' km'],['地平线关系',v.elevation>1e-8?'地平线以上':v.elevation< -1e-8?'地平线以下':'地平线上']].map(([a,b])=>`<div><small>${a}</small><strong>${b}</strong></div>`).join('');
      $('fa-working').textContent=`z = ${f(v.vertical,3)} km；t = ${f(v.horizontal,3)} km；ε = atan2(z,t) = ${f(v.elevation,4)}°`;
      diagram(v);
    }catch(e){$('fa-error').textContent=e.message;$('fa-metrics').textContent='';$('fa-working').textContent='';$('fa-elevation-diagram').replaceChildren();}
  }
  for(const id of ['fa-height','fa-arc'])$(id).addEventListener('input',render);
  document.querySelectorAll('[data-fa-height]').forEach(b=>b.addEventListener('click',()=>{$('fa-height').value=b.dataset.faHeight;$('fa-arc').value=b.dataset.faArc;render();}));
  render();
})(typeof globalThis!=='undefined'?globalThis:this);
