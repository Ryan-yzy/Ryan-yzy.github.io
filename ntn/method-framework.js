(() => {
'use strict';
function initialize(){
const configNode=document.getElementById('mf-config');if(!configNode)return;
const config=JSON.parse(configNode.textContent),routes=config.routes;
const labels={satellites:['01','卫星位置'],service:['02','服务区域与波位'],ue:['03','UE 与统计']};
const tag=part=>`<span class="mf-tag" data-part="${part}">模块 ${labels[part][0]} · ${labels[part][1]}</span>`;
const selected=(selector,attr)=>Number(document.querySelector(selector)?.getAttribute(attr)||0);
function currentIndex(){
 switch(config.key){
 case 'zte-6870':return selected('#majorSteps .active','data-value');
 case '610':{const n=selected('.setup-index .active','data-step');return n===3?1:n===4?2:n>=5?3:0;}
 case 'qualcomm':{const n=selected('#qcMajor .active','data-value'),s=selected('#qcSub .active','data-value');return n===0?(s===0?0:1):n===1?2:3;}
 case 'xiaomi':return selected('#steps .active','data-major');
 case 'huawei':return selected('.path [aria-selected="true"]','data-step');
 case 'vivo':return selected('.steps [aria-selected="true"]','data-step')-1;
 default:return 0;
 }
}
function sync(){
 const i=Math.max(0,currentIndex()),r=routes[i];if(!r)return;
 document.querySelectorAll('.mf-route-button').forEach(b=>{if(Number(b.dataset.mfOpen)===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 const box=document.getElementById('mf-current');
 const special=config.key==='huawei'&&i===1?' · 当前视图同时衔接服务关联与点亮':'';
 const label=tag(r.part)+`<span>当前：${r.title}${special}</span><a href="#method-structure">回到三部分速览 ↑</a>`;
 if(box&&box.innerHTML!==label)box.innerHTML=label;
 const fields=document.querySelectorAll('#nrStepIO>div>span');
 [r.input,r.calc,r.output].forEach((text,i)=>{if(fields[i]&&fields[i].textContent!==text)fields[i].textContent=text;});
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync();});}
function openRoute(index,writeHash=true){
 const r=routes[index];if(!r)return;const incomingHash=location.hash;
 for(const selector of r.click){const target=document.querySelector(selector);if(!target){console.warn('Method route target unavailable:',selector);return;}target.click();}
 if(writeHash)history.replaceState(null,'',`#mf-route-${index}`);else if(incomingHash.startsWith('#mf-'))history.replaceState(null,'',incomingHash);
 sync();requestAnimationFrame(()=>{const target=document.querySelector(r.scroll);target?.scrollIntoView({block:'start',behavior:'auto'});});
}
function openHash(){
 const h=location.hash.slice(1);
 if(h==='mf-layout'||h==='mf-statistics'){
  const part=h==='mf-layout'?'service':'ue',i=routes.findIndex(r=>r.part===part);
  if(i>=0)openRoute(i,false);
  const details=document.getElementById(h);if(details){details.open=true;requestAnimationFrame(()=>details.scrollIntoView({block:'start',behavior:'auto'}));}return;
 }
 const part=h.startsWith('mf-')?h.slice(3):'';
 if(labels[part]){const i=routes.findIndex(r=>r.part===part);if(i>=0)openRoute(i,false);return;}
 const match=h.match(/^mf-route-(\d+)$/);if(match)openRoute(Number(match[1]),false);
}
for(const event of ['click','change','input'])document.addEventListener(event,schedule);
document.addEventListener('click',event=>{const button=event.target.closest('[data-mf-open]');if(!button)return;event.preventDefault();openRoute(Number(button.dataset.mfOpen));});
window.addEventListener('hashchange',openHash);
// The detailed apps initialize before this deferred layer; observe only their navigation.
const observers=[];
for(const selector of ['#majorSteps','#qcMajor','#qcSub','#steps','.path','.steps','.setup-index']){
 const element=document.querySelector(selector);if(!element)continue;
 const observer=new MutationObserver(schedule);observer.observe(element,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-selected']});observers.push(observer);
}
sync();openHash();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
