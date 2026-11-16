'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = n => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
const TZ = 'Asia/Shanghai';
const data = JSON.parse($('#schedule-data').textContent);
const ROOMS=data.rooms;
const meetingSlug=data.meeting.toLowerCase().replace(' #','-');
const groupCounts=Object.fromEntries(data.topicGroups.map(g=>[g.key,sessionsCount(g.key)]));
function sessionsCount(key){return data.sessions.filter(s=>key==='__other__'?!s.group:s.group===key).length}
function groupColor(key){return data.sessions.find(s=>key==='__other__'?!s.group:s.group===key)?.color||'#8394a2'}
const sessions = data.sessions.map(s=>({...s,a:Date.parse(s.start),b:Date.parse(s.end),topicKey:s.name+'|'+s.group})).sort((x,y)=>x.a-y.a||ROOMS.indexOf(x.rooms[0])-ROOMS.indexOf(y.rooms[0]));
const dateString = t => new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(t);
const clockTime = t => new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(t);
const dayName = t => new Intl.DateTimeFormat('zh-CN',{timeZone:TZ,weekday:'short'}).format(t);
const dateLabel = d => `${Number(d.slice(5,7))} 月 ${Number(d.slice(8,10))} 日`;
const midnight = d => Date.parse(d+'T00:00:00+08:00');
const chinaDates = [...new Set(sessions.flatMap(s=>[dateString(s.a),dateString(s.b-1)]))].sort();
const meetingDates = data.meetingDays.map(d=>d.date);
const venueDate = t => new Date(t-6*3600000).toISOString().slice(0,10); // ABT = UTC−6; do not use an outdated venue tzdb.
const topicEntries = data.topicGroups.flatMap(g=>g.sessions.map(t=>({...t,groupKey:g.key,groupName:g.name})));
let saved;try{saved=new Set(JSON.parse(localStorage.getItem(meetingSlug+'-favorites')||'[]'))}catch{saved=new Set()}
let state={date:data.meetingDays.find(d=>Date.parse(d.end)>Date.now())?.date||meetingDates.at(-1),basis:'meeting',group:'all',focus:'all',topic:'',search:'',rooms:new Set(ROOMS),view:'grid',scale:2.4};
let opened=null,toastTimer,catalogMode='scheduled',personalExport=null;
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),3000)}
function overlap(s,d){const a=midnight(d);return s.a<a+86400000&&s.b>a}
function inDay(s,d){return state.basis==='meeting'?s.localDate===d:overlap(s,d)}
function agendaMatch(s,ai){return [...s.ais,...(s.agreementAis||[])].some(a=>a===ai||a.startsWith(ai+'.')||(a==='10.6.x'&&ai==='10.6'))}
function topicMatches(s){return !state.topic||(state.topic.startsWith('ai:')?agendaMatch(s,state.topic.slice(3)):s.topicKey===state.topic)}
function matches(s,withDate=true){
 if(withDate&&state.date!=='all'&&!inDay(s,state.date))return false;
 if(state.group!=='all'&&(state.group==='other'?!!s.group:s.group!==state.group))return false;
 if(state.focus==='saved'&&!saved.has(s.id))return false;
 if(['ntn','isac'].includes(state.focus)&&s.focus!==state.focus)return false;
 if(!s.rooms.some(r=>state.rooms.has(r)))return false;
 if(!topicMatches(s))return false;
 const q=state.search.toLowerCase().trim();
 return !q||[s.name,s.description,s.ais.join(' '),s.chair,s.group,s.rooms.join(' '),s.notes.join(' '),s.agenda.join(' '),s.parents.join(' '),s.focus==='ntn'?'卫星 非地面网络 NTN':s.focus==='isac'?'通感一体化 感知 ISAC sensing':''].join(' ').toLowerCase().includes(q);
}
function filtered(){return sessions.filter(s=>matches(s))}
function currentDates(){return state.basis==='meeting'?meetingDates:chinaDates}
function renderTabs(){
 const mode=state.basis==='meeting';
 $('#date-tabs').innerHTML=currentDates().map(d=>{const n=sessions.filter(s=>inDay(s,d)).length;return `<button class="date-btn ${state.date===d?'active':''}" data-date="${d}" aria-pressed="${state.date===d}"><span class="dayno">${dayName(midnight(d))}</span><span><span class="dow">${mode?d.slice(5).replace('-','/')+' 会议日':d.slice(5).replace('-','/')+' 中国日期'}</span><span class="month">${n} 场${mode?' · 北京时间跨至次日':''}</span></span></button>`}).join('')+`<button class="date-btn all ${state.date==='all'?'active':''}" data-date="all" aria-pressed="${state.date==='all'}">全部${mode?'会议日':'日期'}</button>`;
 $('#date-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.date=b.dataset.date;render()});
 document.querySelectorAll('[data-basis]').forEach(b=>{b.classList.toggle('active',b.dataset.basis===state.basis);b.setAttribute('aria-pressed',b.dataset.basis===state.basis)});
 $('#date-basis-note').textContent=mode?'沿用原页周一至周五结构，表内均为北京时间':'按中国自然日排列，跨午夜议程在相邻日期续显';
}
function reset(){state.group='all';state.focus='all';state.topic='';state.search='';state.rooms=new Set(ROOMS);$('#search').value='';$('#quick').value='all';render()}
function titleOf(s){if(data.workgroup==='RAN1'&&s.ais.includes('1')&&s.ais.includes('2'))return '开幕与会务 · AI 1–5';return s.name.replace(/^AI\s*/,'')}
function colorOf(s){return s.group?'':'general'}
function eventRange(s,day){
 const base=midnight(day||dateString(s.a));const ad=Math.round((midnight(dateString(s.a))-base)/86400000),bd=Math.round((midnight(dateString(s.b))-base)/86400000);
 const tag=n=>n===1?'次日 ':n===-1?'前日 ':n>1?`+${n}日 `:'';
 return `${tag(ad)}${clockTime(s.a)}–${ad!==bd?tag(bd):''}${clockTime(s.b)}`;
}
function empty(){return `<div class="empty">${icon(state.focus==='saved'?'star':'search')}<strong>${!state.rooms.size?'请选择要显示的会场':state.focus==='saved'?'这个范围内还没有关注议程':'没有匹配的议程'}</strong><div>${state.focus==='saved'?'点击议程中的星标，即可加入“我的关注”。':'可调整日期、课题分组、会场或搜索词。'}</div><button id="reset-empty">显示全部课题</button></div>`}
function dayHeading(d,n){
 if(state.basis==='meeting'){
  const grid=data.meetingDays.find(x=>x.date===d);const a=Date.parse(grid.start),b=Date.parse(grid.end);
  return `<div class="date-divider">${dayName(midnight(d))} · 当地 ${d.slice(5).replace('-','/')} 会议日<span>${n} 场排程 · 全部使用北京时间</span><strong>北京时间：${dateLabel(dateString(a))} ${clockTime(a)} — ${dateLabel(dateString(b))} ${clockTime(b)}</strong></div>`;
 }
 return `<div class="date-divider">北京时间 ${dateLabel(d)} · ${dayName(midnight(d))}<span>${n} 场（含跨日续场）</span></div>`;
}
function renderList(items){
 if(!items.length)return empty();let out='<div class="agenda-list">';
 for(const d of state.date==='all'?currentDates():[state.date]){
  const dayitems=items.filter(s=>inDay(s,d));if(!dayitems.length)continue;out+=dayHeading(d,dayitems.length);
  for(const s of dayitems){const live=Date.now()>=s.a&&Date.now()<s.b;
   out+=`<article class="list-row"><div class="list-time">${esc(eventRange(s,d))}<small>${s.duration} 分钟<br>当地 ${s.localDate.slice(5).replace('-','/')} ${s.localStart}–${s.localEnd}</small></div><div><button class="list-title" data-open="${s.id}"><strong>${esc(titleOf(s))}${live?'<i class="live-tag">进行中</i>':''}</strong><span>${esc(s.description||s.agenda[0]||s.name)}</span></button><div class="list-tags"><span><i class="dot" style="background:${s.group==='R20'?'var(--orange)':s.group==='TEI'?'var(--violet)':s.group?'var(--blue)':'#91a2ad'}"></i>${esc(s.group||'会务 / 其他')}</span><span>${esc(s.rooms.join(' / '))}</span>${s.chair?`<span>${esc(s.chair)}</span>`:''}${s.notes.length?`<span>${esc(s.notes.join(' · '))}</span>`:''}</div></div><div class="list-badge"><span class="pill">${esc(s.rooms.join(' / '))}</span><br>${esc(s.chair||s.group||'会务')}</div><button class="fav-btn ${saved.has(s.id)?'selected':''}" data-save="${s.id}" aria-label="${saved.has(s.id)?'取消关注':'关注'} ${esc(titleOf(s))}" aria-pressed="${saved.has(s.id)}">${saved.has(s.id)?'★':'☆'}</button></article>`;
  }
 }
 return out+'</div>';
}
function windows(d){
 const base=midnight(d);
 if(state.basis==='meeting'){const g=data.meetingDays.find(x=>x.date===d);return [[(Date.parse(g.start)-base)/60000,(Date.parse(g.end)-base)/60000]]}
 const all=sessions.filter(s=>overlap(s,d));if(!all.length)return [];
 const ranges=all.map(s=>[Math.max(0,(s.a-base)/60000),Math.min(1440,(s.b-base)/60000)]).sort((x,y)=>x[0]-y[0]);
 const merged=[];for(const r of ranges){const prev=merged.at(-1);if(prev&&r[0]-prev[1]<180)prev[1]=Math.max(prev[1],r[1]);else merged.push([...r])}
 return merged.map(([a,b])=>[Math.floor(a/60)*60,Math.min(1440,Math.ceil(b/60)*60)]);
}
function renderGrid(items){
 if(!items.length)return empty();const available=state.basis==='meeting'&&state.date!=='all'?data.meetingDays.find(x=>x.date===state.date).rooms:ROOMS;const rooms=ROOMS.filter(r=>state.rooms.has(r)&&available.includes(r)),cols=rooms.length,scale=state.scale;
 let out=`<div class="grid-scroll"><div class="board" style="--cols:${cols};${cols<5?'min-width:'+Math.max(330,cols*190+66)+'px;':''}"><div class="room-head"><div class="axis-head">北京时间<br>UTC+8</div>${rooms.map(r=>`<div>${r}<span>${roomLabel(r)}</span></div>`).join('')}</div>`;
 for(const d of state.date==='all'?currentDates():[state.date]){
  const di=items.filter(s=>inDay(s,d));if(!di.length)continue;out+=dayHeading(d,di.length);const base=midnight(d);let prev=null;
  for(const [a,b] of windows(d)){
   if(prev!==null)out+=`<div class="day-gap">${hm(prev)}—${hm(a)}　无排定议程 · 已折叠空档</div>`;
   out+=`<div class="timeline-section" style="height:${(b-a)*scale+12}px" data-day="${d}" data-start="${a}" data-end="${b}">`;
   for(let i=0;i<cols;i++)out+=`<div class="room-lane" style="left:calc(var(--axis) + (100% - var(--axis)) * ${i}/${cols})"></div>`;
   for(let t=a;t<b;t+=30){out+=`<div class="timeline-line ${t%60?'half':''}" style="top:${(t-a)*scale}px"></div><div class="time-tick ${t===a?'first':''}" style="top:${(t-a)*scale}px">${hm(t)}${t>=1440?'<em>次日</em>':''}</div>`;if(t===1440)out+=`<div class="midnight-label" style="top:${(t-a)*scale}px"><span>进入北京时间 ${dateString(base+86400000).slice(5).replace('-','/')} ${dayName(base+86400000)}</span></div>`}
   for(const br of data.breaks){if(state.basis==='meeting'&&br.localDate!==d)continue;const x=Math.max((Date.parse(br.start)-base)/60000,a),y=Math.min((Date.parse(br.end)-base)/60000,b);if(y>x){const name=br.name==='Lunch break'?'Lunch break · 午餐休息':br.name==='Morning coffee break'?'Morning coffee break · 茶歇':'Afternoon coffee break · 茶歇';out+=`<div class="break-band" style="top:${(x-a)*scale}px;height:${(y-x)*scale}px">${name}</div>`}}
   for(const s of di){const x=Math.max((s.a-base)/60000,a),y=Math.min((s.b-base)/60000,b);if(y<=x)continue;
    const indices=s.rooms.map(r=>rooms.indexOf(r)).filter(i=>i>=0).sort((x,y)=>x-y),groups=[];
    for(const i of indices){const g=groups.at(-1);if(g&&g.at(-1)===i-1)g.push(i);else groups.push([i])}
    for(const g of groups){const h=(y-x)*scale-4,isShort=h<58,isMicro=h<24;
     out+=`<button class="event ${colorOf(s)} ${isShort?'short':''} ${isMicro?'micro':''}" data-open="${s.id}" title="${esc(titleOf(s)+' · '+s.description+' · '+eventRange(s,d)+' 北京时间') }" aria-label="${esc(titleOf(s)+'，'+eventRange(s,d)+' 北京时间，'+s.rooms.join('、'))}" style="top:${(x-a)*scale+2}px;height:${h}px;left:calc(var(--axis) + (100% - var(--axis)) * ${g[0]}/${cols} + 4px);--event-color:${s.color};width:calc((100% - var(--axis)) * ${g.length}/${cols} - 8px)"><div class="event-name">${state.basis==='china'&&s.a<base?'↳ ':''}${esc(titleOf(s))}${saved.has(s.id)?'<span class="star-small">★</span>':''}</div><div class="event-time">${esc(eventRange(s,d))} · ${s.duration} min</div>${h>68&&s.ais.length?`<div class="event-ai">AI ${esc(s.ais.join(', '))}${s.chair?' · '+esc(s.chair):''}</div>`:''}${h>92?`<div class="event-desc">${esc(s.description)}</div>`:''}${h>125&&s.notes.length?`<div class="event-note">${esc(s.notes.join(' · '))}</div>`:''}</button>`;
    }
   }
   out+='</div>';prev=b;
  }
 }
 return out+'</div></div>';
}
function hm(m){const n=((m%1440)+1440)%1440;return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`}
function selectedLabel(){if(!state.topic)return '';if(state.topic.startsWith('ai:')){const id=state.topic.slice(3);return id+' · '+(data.agendaSections[id]?.title||'')}const t=topicEntries.find(x=>x.key===state.topic);return t?t.name:state.topic}
function render(){
 renderTabs();const items=filtered();
 document.querySelectorAll('[data-group]').forEach(b=>{b.classList.toggle('active',b.dataset.group===state.group);b.setAttribute('aria-pressed',b.dataset.group===state.group)});
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===state.view);b.setAttribute('aria-pressed',b.dataset.view===state.view)});
 $('#room-checks').innerHTML=ROOMS.map(r=>`<label class="room-check"><input type="checkbox" value="${r}" ${state.rooms.has(r)?'checked':''}>${r}</label>`).join('');
 $('#room-checks').querySelectorAll('input').forEach(c=>c.onchange=()=>{if(c.checked)state.rooms.add(c.value);else state.rooms.delete(c.value);render()});
 if($('#group-select'))$('#group-select').value=state.group;
 $('#selected-topic').classList.toggle('hidden',!state.topic);if(state.topic){$('#selected-topic').innerHTML=`<span>已选择课题：${esc(selectedLabel())}</span><button id="clear-topic">显示全部课题</button>`;$('#clear-topic').onclick=()=>{state.topic='';render()}}
 const label=state.date==='all'?'全部'+(state.basis==='meeting'?'会议日':'中国日期'):(state.basis==='meeting'?'当地 ':'中国 ')+dateLabel(state.date)+' · '+dayName(midnight(state.date));
 const modified=state.group!=='all'||state.focus!=='all'||state.topic||state.search||state.rooms.size!==ROOMS.length;
 $('#result-info').innerHTML=`<strong>${label}</strong>　${items.length} / ${sessions.filter(s=>state.date==='all'||inDay(s,state.date)).length} 场排程${modified?'　<button class="reset" id="reset-filters">重置筛选</button>':''}`;
 $('#schedule').innerHTML=state.view==='grid'?renderGrid(items):renderList(items);$('#grid-hint').classList.toggle('hidden',state.view!=='grid');
 $('#schedule').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>showDetail(b.dataset.open));$('#schedule').querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>toggleSaved(b.dataset.save));
 if($('#reset-filters'))$('#reset-filters').onclick=reset;if($('#reset-empty'))$('#reset-empty').onclick=reset;$('#current-saved-count').textContent=saved.size;personalExport?.refresh();updateNowLines();
}
function toggleSaved(id){if(saved.has(id))saved.delete(id);else saved.add(id);try{localStorage.setItem(meetingSlug+'-favorites',JSON.stringify([...saved]))}catch{}render();if(opened===id&&$('#details').open)showDetail(id,false)}
function showDetail(id,open=true){
 const s=sessions.find(x=>x.id===id);opened=id;$('#detail-kicker').textContent=`${s.group||'会务 / 其他'} / ${data.meeting} · ${s.duration} 分钟`;$('#detail-title').textContent=titleOf(s);
 const sd=dateString(s.a),ed=dateString(s.b);const full=`${dateLabel(sd)} ${clockTime(s.a)} — ${ed!==sd?dateLabel(ed)+' ':''}${clockTime(s.b)}`;
 const agendaLinks=s.ais.map(ai=>{const section=data.agendaSections[ai];return section?.url?`<a href="${esc(new URL(section.url,data.sourceUrl).href)}" target="_blank" rel="noopener">AI ${esc(ai)} · 原页议程内容 ↗</a>`:''}).filter(Boolean).join('<br>');
 $('#detail-body').innerHTML=`<div class="time-detail"><small>北京时间 · UTC+8</small><strong>${full}</strong><small>${s.duration} 分钟 · ${sd!==ed?'跨中国日期 · ':''}卡尔加里 ${s.localDate.slice(5).replace('-','/')} ${dayName(midnight(s.localDate))} ${s.localStart}—${s.localEnd}（ABT · UTC−6）</small></div><div class="detail-meta"><div>会场<strong>${esc((s.sourceRooms||s.rooms).join(' / '))}</strong></div><div>主持人<strong>${esc(s.chair||'原表未标注')}</strong></div></div><h3>议题说明</h3><p>${esc(s.description||s.agenda[0]||s.name)}</p>${s.parents.length?`<p style="font-size:11px;color:#8e9ca4">${s.parents.map(esc).join(' → ')}</p>`:''}${s.agenda.length>1?s.agenda.map(x=>`<p style="font-size:12px">${esc(x)}</p>`).join(''):''}${s.notes.length?`<h3>本场讨论范围</h3>${s.notes.map(n=>`<div class="detail-note">${esc(n)}</div>`).join('')}`:''}${s.emails.length?`<h3>原页补充说明 · 文中时刻为当地时间（北京时间 +14h）</h3>${s.emails.map(e=>`<div class="detail-note">${esc(e.text)}${e.facts.length?'<br>'+e.facts.map(esc).join(' · '):''}${e.url?`<br><a href="${esc(e.url)}" target="_blank" rel="noopener">查看来源邮件 ↗</a>`:''}</div>`).join('')}`:''}${agendaLinks?`<h3>课题来源</h3><p style="font-size:11px">${agendaLinks}</p>`:''}<div class="detail-actions"><button id="detail-save" class="primary-btn">${icon('star')}${saved.has(id)?'已关注 · 点击取消':'加入我的关注'}</button><button id="detail-export">${icon('download')}导出本场</button></div>`;
 $('#detail-save').onclick=()=>toggleSaved(id);$('#detail-export').onclick=()=>personalExport.open([s]);if(open&&!$('#details').open)$('#details').showModal();
}
function renderCatalog(){
 const q=$('#catalog-search').value.toLowerCase().trim();document.querySelectorAll('[data-catalog]').forEach(b=>b.classList.toggle('active',b.dataset.catalog===catalogMode));
 $('#catalog-count').textContent=topicEntries.length;$('#agenda-count').textContent=Object.keys(data.agendaSections).length;
 $('#catalog-intro').textContent=catalogMode==='scheduled'?`与原页逐项对应的 ${topicEntries.length} 个排程课题条目，覆盖全部 ${sessions.length} 场排程。数字为全会期场次，点击任一条目查看该课题的全部安排。`:'保留原页中提供的议程编号与名称；未关联独立时段的条目也列出。点击已关联项查看排程，其他条目可打开原始议程。';
 const groups=catalogMode==='scheduled'?data.topicGroups.map(g=>({name:g.name==='Other'?'会务 / 其他':g.name,entries:g.sessions.map(t=>({id:t.key,name:t.name,desc:sessions.find(s=>s.topicKey===t.key)?.description||'',count:sessions.filter(s=>s.topicKey===t.key).length}))})):agendaGroupDefinitions().map(({name,accept})=>({name,entries:Object.entries(data.agendaSections).filter(([id])=>accept(id)).map(([id,v])=>({id:'ai:'+id,name:id+' · '+v.title,desc:'',count:sessions.filter(s=>agendaMatch(s,id)).length,url:v.url?new URL(v.url,data.sourceUrl).href:data.chairNotesUrl,depth:id.split('.').length-1}))}));
 let out='';
 for(const g of groups){const es=g.entries.filter(t=>!q||(t.name+' '+t.desc).toLowerCase().includes(q));if(!es.length)continue;
  out+=`<details class="catalog-group" open><summary>${esc(g.name)}<span>${es.length} 项${catalogMode==='scheduled'?' · '+g.entries.reduce((n,t)=>n+t.count,0)+' 场排程':''}</span></summary><div class="catalog-rows ${catalogMode==='agenda'?'full-agenda':''}">${es.map(t=>{const content=`<div><strong>${esc(t.name)}</strong>${t.desc?`<small>${esc(t.desc)}</small>`:''}</div><span class="topic-count">${t.count?t.count+' 场':catalogMode==='agenda'?'未单独关联 ↗':'未排程'}</span>`;return t.count?`<button class="topic-row" data-topic="${esc(t.id)}" ${t.depth?`style="padding-left:${14+t.depth*12}px"`:''}>${content}</button>`:`<a class="topic-row unassigned" href="${esc(t.url||data.sourceUrl)}" target="_blank" rel="noopener" style="padding-left:${14+(t.depth||0)*12}px">${content}</a>`}).join('')}</div></details>`;
 }
 $('#catalog-body').innerHTML=out||'<div class="catalog-empty">没有匹配的课题</div>';
 $('#catalog-body').querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{state.topic=b.dataset.topic;state.date='all';state.group='all';state.focus='all';state.search='';state.rooms=new Set(ROOMS);$('#search').value='';$('#quick').value='all';$('#topic-dialog').close();render();$('#selected-topic').scrollIntoView({block:'center'})});
}
function updateNowLines(){document.querySelectorAll('.now-line').forEach(n=>n.remove());if(state.view!=='grid')return;const now=Date.now();document.querySelectorAll('.timeline-section').forEach(el=>{const m=(now-midnight(el.dataset.day))/60000,a=Number(el.dataset.start),b=Number(el.dataset.end);if(m>=a&&m<b){const n=document.createElement('div');n.className='now-line';n.style.top=(m-a)*state.scale+'px';n.innerHTML=`<span>${clockTime(now)}</span>`;el.append(n)}})}
function tick(){$('#clock').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(Date.now());$('#clock-date').textContent=`${dateString(Date.now()).replaceAll('-','/')} ${dayName(Date.now())}`;updateNowLines()}

function roomLabel(r){const grid=state.basis==='meeting'&&state.date!=='all'?data.meetingDays.find(x=>x.date===state.date):null;return esc(grid?.roomLabels[r]||data.roomDescriptions[r]||r)}
function agendaGroupDefinitions(){
 if(data.workgroup!=='RAN1')return [{name:data.workgroup+' 议程编号',accept:()=>true}];
 return [{name:'6GR',accept:id=>id.startsWith('10')},{name:'R20',accept:id=>id.startsWith('9')},{name:'TEI / Maintenance',accept:id=>/^(7|8|11)(\.|$)/.test(id)},{name:'会务 / 其他',accept:id=>!(/^(7|8|9|10|11)(\.|$)/.test(id))}];
}
function setupGroups(){
 const all='<button data-group="all" class="active" aria-pressed="true">全部课题 <span>'+sessions.length+'</span></button>';
 const groups=data.workgroup==='RAN1'?data.topicGroups.map(g=>'<button data-group="'+(g.key==='__other__'?'other':esc(g.key))+'" aria-pressed="false"><i class="dot" style="background:'+groupColor(g.key)+'"></i>'+esc(g.name==='Other'?'会务 / 其他':g.name)+' <span>'+groupCounts[g.key]+'</span></button>').join(''):'<select id="group-select" class="group-select" aria-label="课题分组"><option value="all">全部 '+data.topicGroups.length+' 个课题分组</option>'+data.topicGroups.map(g=>'<option value="'+esc(g.key==='__other__'?'other':g.key)+'">'+esc(g.name==='Other'?'会务 / 其他':g.name)+' · '+groupCounts[g.key]+' 场</option>').join('')+'</select>';
 $('#group-controls').innerHTML=all+groups+'<button id="open-catalog" class="catalog-button">全部课题目录 ↗</button>';
 $('#group-legend').innerHTML=data.topicGroups.slice(0,data.workgroup==='RAN1'?4:3).map(g=>'<span title="'+esc(g.name)+'"><i class="dot" style="background:'+groupColor(g.key)+'"></i>'+esc(g.name.length>22?g.name.slice(0,22)+'…':g.name)+'</span>').join('');
 const notes=document.createElement('details');notes.className='supplementary';
 if(data.supplementary?.length){notes.innerHTML='<summary>原日程补充说明</summary><p class="note-tz">文中日期和时刻为当地时间（ABT，UTC−6）；北京时间请加 14 小时。</p>'+data.supplementary.map(n=>'<h3>'+esc(n.title)+'</h3><ul>'+n.lines.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>').join('');document.querySelector('.workspace').after(notes)}
}

setupGroups();
$('#coverage-summary').textContent=`完整课题 · ${sessions.length} 场排程 · ${topicEntries.length} 个排程课题条目 · ${ROOMS.length} 个会场`;
$('#group-select')&&($('#group-select').onchange=e=>{state.group=e.target.value;state.topic='';state.focus='all';$('#quick').value='all';render()});
$('#snapshot').textContent=`原页生成：${dateString(Date.parse(data.sourceGenerated)).slice(5).replace('-','/')} ${clockTime(Date.parse(data.sourceGenerated))}（北京时间）`;
$('#source-links').innerHTML=data.sources.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a>`).join('　');
document.querySelectorAll('[data-group]').forEach(b=>{const key=b.dataset.group;const n=sessions.filter(s=>key==='all'||(key==='other'?!s.group:s.group===key)).length;b.querySelector('span').textContent=n;b.onclick=()=>{state.group=key;state.topic='';state.focus='all';$('#quick').value='all';render()}});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;render()});
document.querySelectorAll('[data-basis]').forEach(b=>b.onclick=()=>{const prior=state.date;state.basis=b.dataset.basis;state.date=prior==='all'?'all':currentDates().includes(prior)?prior:currentDates()[0];render()});
$('#search').oninput=e=>{state.search=e.target.value;render()};$('#quick').onchange=e=>{state.focus=e.target.value;state.group='all';state.topic='';render()};$('#density').onchange=e=>{state.scale=Number(e.target.value);render()};
$('#close-detail').onclick=()=>$('#details').close();$('#details').addEventListener('close',()=>opened=null);
for(const id of ['details','topic-dialog'])$("#"+id).addEventListener('click',e=>{const el=$("#"+id);if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)el.close()}});
$('#open-catalog').onclick=()=>{renderCatalog();$('#topic-dialog').showModal()};$('#close-catalog').onclick=()=>$('#topic-dialog').close();$('#catalog-search').oninput=renderCatalog;document.querySelectorAll('[data-catalog]').forEach(b=>b.onclick=()=>{catalogMode=b.dataset.catalog;renderCatalog()});
$('#now-btn').onclick=()=>{const now=Date.now(),next=sessions.find(s=>s.b>now);if(next){state.date=state.basis==='meeting'?next.localDate:dateString(Math.max(now,next.a));render();const line=$('.now-line');if(line)line.scrollIntoView({behavior:'smooth',block:'center'});else toast('当前没有排定议程，已显示下一场所在日期')}else{state.date=currentDates().at(-1);render();toast('会议已结束，已显示最后一个会议日')}};
personalExport=ScheduleExportUI.init({baseUrl:'../',currentData:data,getCurrentItems:filtered,getCurrentSaved:()=>saved});
$('#show-saved').onclick=()=>{state.date='all';state.group='all';state.focus='saved';state.topic='';state.search='';state.rooms=new Set(ROOMS);state.view='list';$('#search').value='';$('#quick').value='saved';render()};
$('#follow-filtered').onclick=()=>{const items=filtered();if(!items.length){toast('当前没有可关注的议程');return}const before=saved.size;items.forEach(s=>saved.add(s.id));try{localStorage.setItem(meetingSlug+'-favorites',JSON.stringify([...saved]))}catch{}render();toast('新增关注 '+(saved.size-before)+' 场 · 本组共 '+saved.size+' 场')};
render();tick();setInterval(tick,1000);
