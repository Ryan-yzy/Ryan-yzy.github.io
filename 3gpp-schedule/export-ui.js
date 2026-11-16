(function(root){
'use strict';
const registry=[{wg:'RAN1',slug:'ran1-127',path:'ran1'},{wg:'RAN2',slug:'ran2-136',path:'ran2'},{wg:'RAN3',slug:'ran3-134',path:'ran3'},{wg:'RAN4',slug:'ran4-121',path:'ran4'}];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(options={}){
 const core=root.ScheduleExport,base=new URL(options.baseUrl||'../',location.href),cache=new Map(),dialog=document.createElement('dialog');
 if(options.currentData)cache.set(options.currentData.workgroup,options.currentData);
 dialog.id='export-dialog';dialog.className='dialog export-dialog';dialog.setAttribute('aria-labelledby','export-title');
 dialog.innerHTML='<div class="dialog-head"><div><span class="muted">个人参会计划 · 北京时间</span><h2 id="export-title">导出议程</h2></div><button class="icon-btn" id="close-export" aria-label="关闭导出窗口">×</button></div><div class="dialog-content"><p class="export-intro">在列表点 ☆，或在议程详情中加入关注。可将 RAN1—RAN4 的关注合并导出；关注保存在当前浏览器。</p><div class="export-selectors"><label>导出范围<select id="export-scope" aria-label="导出范围"></select></label><label>文件格式<select id="export-format" aria-label="文件格式"><option value="xlsx">Excel（.xlsx，推荐）· 筛选与备注</option><option value="png">日历图（.png）· 日期 × 时间</option><option value="md">Markdown（.md）· 参会笔记</option><option value="csv">CSV（.csv）· 表格整理</option><option value="ics">日历（.ics）· 导入日历应用</option></select></label></div><p class="export-format-help" id="export-format-help"></p><div id="export-status" class="export-status" role="status" aria-live="polite"></div><div id="export-preview" class="export-preview"></div><div class="export-bottom"><span id="export-count"></span><button class="primary-btn" id="download-export">下载 Markdown</button></div></div>';
 document.body.append(dialog);const $=s=>dialog.querySelector(s);let favorites=[],favoritesError='',loading=false,custom=null,serial=0;
 function readSaved(entry){if(options.currentData?.workgroup===entry.wg&&options.getCurrentSaved)return new Set(options.getCurrentSaved());try{const v=JSON.parse(localStorage.getItem(entry.slug+'-favorites')||'[]');return new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'):[])}catch{return new Set()}}
 function counts(){return registry.map(r=>({...r,count:readSaved(r).size}))}
 function refresh(){const n=counts().reduce((v,x)=>v+x.count,0);document.querySelectorAll('[data-all-favorite-count]').forEach(el=>el.textContent=n);if(options.onCounts)options.onCounts(n);return n}
 function currentItems(){return options.getCurrentItems?options.getCurrentItems().map(s=>core.normalize(s,options.currentData)):[]}
 function selected(){return core.unique($('#export-scope').value==='favorites'?favorites:$('#export-scope').value==='single'?custom||[]:currentItems())}
 function render(){
  const scope=$('#export-scope').value,format=$('#export-format').value,items=selected();
  const help={xlsx:'导出 Excel 工作簿：按北京时间排序，提供筛选表头、冻结标题、自动换行和可填写的参会备注。说明页附操作步骤和原始日程链接。',png:'按北京时间日期与时间绘制日历图，标出会议、时间和课题，并行会议分栏。较多日期自动拆成多张 PNG，并打包成一个 ZIP 下载，保证文字清晰。',md:'按北京时间日期整理为 Markdown 表格，包含会议、课题、完整起止日期、会场、主持人和原始日程链接。',csv:'导出 UTF-8 编码的 CSV 表格，可在支持 CSV 的表格工具中继续筛选、排序和编辑。',ics:'ICS 是通用日历文件。手动导入支持 ICS 的日历应用后，议程会成为包含开始、结束时间和会场的会议事件；提醒在日历应用中设置。这是一次性导出。'};
  $('#export-format-help').textContent=help[format];
  const blocked=scope==='favorites'&&(loading||!!favoritesError);
  $('#export-status').textContent=scope==='favorites'?(loading?'正在汇总各工作组的关注…':favoritesError||(!items.length?'还没有关注议程。先返回会议页面点 ☆，也可选择“当前筛选结果”导出。':'已汇总 RAN1—RAN4 中的关注，包含其他日期的场次。')):'仅导出当前所选范围中的完整场次。';
  $('#export-status').classList.toggle('error',scope==='favorites'&&!!favoritesError);
  $('#export-count').textContent=items.length?'共 '+items.length+' 场 · 北京时间':'尚无可导出的场次';
  $('#download-export').textContent='下载 '+({xlsx:'Excel',png:'日历图 PNG',md:'Markdown',csv:'CSV',ics:'日历 ICS'}[format])+ (items.length?'（'+items.length+' 场）':'');$('#download-export').disabled=blocked||!items.length;
  $('#export-preview').innerHTML=blocked?'':items.slice(0,18).map(s=>'<div class="export-preview-row"><span>'+esc(s.meeting)+'</span><strong>'+esc(core.title(s))+'</strong><small>'+esc(core.range(s))+'<br>'+esc((s.sourceRooms||s.rooms).join(' / '))+'</small></div>').join('')+(items.length>18?'<p class="export-more">另有 '+(items.length-18)+' 场，下载文件包含全部 '+items.length+' 场。</p>':'');
 }
 async function dataset(entry){if(cache.has(entry.wg))return cache.get(entry.wg);const r=await fetch(new URL(entry.path+'/schedule-data.json',base));if(!r.ok)throw new Error(entry.wg+' 日程读取失败（'+r.status+'）');const d=await r.json();if(d.workgroup!==entry.wg)throw new Error(entry.wg+' 日程内容不匹配');cache.set(entry.wg,d);return d}
 async function open(single,preferredScope){
  const request=++serial;custom=single?single.map(s=>core.normalize(s,options.currentData)):null;favorites=[];favoritesError='';loading=true;
  const c=counts(),total=c.reduce((n,x)=>n+x.count,0),current=currentItems();
  $('#export-scope').innerHTML='<option value="favorites">我的关注 · 跨 RAN1—RAN4（'+total+' 场）</option>'+(options.getCurrentItems?'<option value="current">当前筛选结果 · '+esc(options.currentData.meeting)+'（'+current.length+' 场）</option>':'')+(custom?'<option value="single">本场议程（'+custom.length+' 场）</option>':'');
  $('#export-scope').value=custom?'single':preferredScope==='favorites'?'favorites':total?'favorites':options.getCurrentItems?'current':'favorites';$('#export-format').value='xlsx';render();if(!dialog.open)dialog.showModal();
  try{const parts=await Promise.all(c.filter(e=>e.count).map(async entry=>{const d=await dataset(entry),ids=readSaved(entry);return d.sessions.filter(s=>ids.has(s.id)).map(s=>core.normalize(s,d))}));if(request!==serial)return;favorites=core.unique(parts.flat());loading=false;const opt=$('#export-scope').querySelector('option[value="favorites"]');opt.textContent='我的关注 · 跨 RAN1—RAN4（'+favorites.length+' 场）';render()}
  catch(error){if(request!==serial)return;loading=false;favoritesError='关注议程汇总失败：'+error.message+'。请稍后重试，或选择当前筛选结果。';render()}
 }
 function saveFile(text,type,name){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
 $('#download-export').onclick=async()=>{
  const items=selected();if(!items.length||$('#download-export').disabled)return;
  const format=$('#export-format').value,scope=$('#export-scope').value,scopeLabel=scope==='favorites'?'我的关注（跨 RAN1—RAN4）':scope==='single'?'本场议程':options.currentData.meeting+' 当前筛选结果',title=scope==='favorites'?'我的关注议程':scope==='single'?'本场议程':'筛选议程';
  const params={title,scopeLabel},baseName=(scope==='favorites'?'3GPP_My_Agenda':options.currentData.meeting.replace(' #','_')+'_Agenda')+'_'+core.date(Date.now());
  const controls=[$('#download-export'),$('#export-format'),$('#export-scope')];controls.forEach(c=>c.disabled=true);$('#download-export').textContent='正在生成…';$('#export-status').classList.remove('error');
  try{
   let output,type,name=baseName+'.'+format,extra='';
   if(format==='xlsx'){output=await root.ScheduleXlsx.toXlsx(items,params);type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
   else if(format==='png'){const pages=await root.ScheduleCalendar.toPNGs(items,params);if(pages.length===1){output=pages[0].blob;type='image/png'}else{const files=[];for(const p of pages)files.push({name:p.name,data:new Uint8Array(await p.blob.arrayBuffer())});output=root.ScheduleCalendar.zip(files);type='application/zip';name=baseName+'_PNG.zip';extra='（'+pages.length+' 张 PNG，已打包为 ZIP）'}}
   else{output=format==='md'?core.toMarkdown(items,params):format==='csv'?core.toCSV(items):core.toICS(items,params);type={md:'text/markdown;charset=utf-8',csv:'text/csv;charset=utf-8',ics:'text/calendar;charset=utf-8'}[format]}
   saveFile(output,type,name);render();$('#export-status').textContent='已生成 '+items.length+' 场议程的 '+format.toUpperCase()+' 文件'+extra+'。';
  }catch(error){render();$('#export-status').textContent='导出失败：'+error.message;$('#export-status').classList.add('error')}
  finally{$('#export-format').disabled=false;$('#export-scope').disabled=false}
 };
 $('#close-export').onclick=()=>dialog.close();$('#export-scope').onchange=render;$('#export-format').onchange=render;
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 document.querySelectorAll('[data-open-export]').forEach(b=>b.onclick=()=>open(undefined,b.dataset.exportScope));window.addEventListener('storage',refresh);refresh();
 return {open,refresh};
}
root.ScheduleExportUI={init};
})(window);

