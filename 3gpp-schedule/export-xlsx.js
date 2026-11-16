/* Browser-only XLSX writer. ExcelJS is loaded from this site's pinned local copy. */
(function(root){
'use strict';
const scriptUrl=new URL('vendor/exceljs-4.4.0.min.js',document.currentScript.src).href;
let library;
function load(){if(root.ExcelJS)return Promise.resolve(root.ExcelJS);if(!library)library=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=scriptUrl;s.onload=()=>root.ExcelJS?resolve(root.ExcelJS):reject(new Error('Excel 组件未能初始化'));s.onerror=()=>{s.remove();library=null;reject(new Error('Excel 组件加载失败，请检查网络后重试'))};document.head.append(s)});return library}
const fill=color=>({type:'pattern',pattern:'solid',fgColor:{argb:color}});
const wall=t=>new Date(t+8*3600000);
const units=v=>[...String(v||'')].reduce((n,c)=>n+(c.charCodeAt(0)>255?2:1),0);
function lines(v,width){return String(v||'').split('\n').reduce((n,s)=>n+Math.max(1,Math.ceil(units(s)/width)),0)}
async function toXlsx(input,options={}){
 const E=await load(),core=root.ScheduleExport,items=core.unique(input),at=options.exportedAt??Date.now(),book=new E.Workbook();
 book.creator='3GPP 北京时间日程';book.created=new Date(at);book.modified=new Date(at);
 const ws=book.addWorksheet('我的议程',{views:[{state:'frozen',xSplit:1,ySplit:5,showGridLines:false}],pageSetup:{orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:5'}});
 const widths=[15,11,18,17,56,34,23,12,54,34];ws.columns=widths.map(width=>({width}));
 function banner(row,text,color,size){ws.mergeCells(row,1,row,10);const c=ws.getCell(row,1);c.value=text;c.font={name:'Microsoft YaHei',size,color:{argb:color},bold:row===1};c.alignment={vertical:'middle',wrapText:true};ws.getRow(row).height=row===1?36:30}
 banner(1,options.title||'我的关注议程','FFFFFFFF',20);ws.getCell('A1').fill=fill('FF163F4A');
 banner(2,'北京时间 · UTC+8 / Asia/Shanghai  |  卡尔加里当地时间 +14 小时  |  '+items.length+' 场','FF244F59',11);
 banner(3,(options.scopeLabel||'我的关注 · RAN1—RAN4')+'  ·  导出于 '+core.date(at)+' '+core.time(at)+'  ·  可在蓝色备注栏记录参会要点；原始来源见“说明与来源”。','FF596E75',10);
 const header=ws.getRow(5);header.values=['日期（北京）','开始','结束（含日期）','会议','议题 / 课题','会场','主持人','时长 / 分钟','讨论说明','参会备注（可填写）'];header.height=30;
 header.eachCell(c=>{c.fill=fill('FF246978');c.font={name:'Microsoft YaHei',size:11,bold:true,color:{argb:'FFFFFFFF'}};c.alignment={vertical:'middle',wrapText:true}});
 let lastDay='';for(const s of items){const day=core.date(s.a),desc=s.description&&s.description.trim()!==core.title(s).trim()?'\n'+s.description:'',values=[new Date(day+'T00:00:00Z'),wall(s.a),wall(s.b),s.meeting,core.title(s)+desc,(s.sourceRooms||s.rooms).join('\n'),s.chair||'—',s.duration,(s.notes||[]).join('\n')||null,null];const r=ws.addRow(values);
  r.height=Math.max(42,...[4,5,6,8].map(i=>lines(values[i],widths[i]-2)*15+14));
  r.eachCell({includeEmpty:true},(c,col)=>{c.font={name:'Microsoft YaHei',size:11,color:{argb:col===10?'FF246C9A':'FF253D46'}};c.alignment={vertical:'top',wrapText:true,horizontal:[1,2,3,8].includes(col)?'center':'left'};c.fill=fill(col===10?'FFEFF7FD':r.number%2?'FFF1F6F7':'FFFFFFFF');if(day!==lastDay)c.border={top:{style:'thin',color:{argb:'FF9DB8BF'}}}});
  r.getCell(1).numFmt='yyyy-mm-dd';r.getCell(2).numFmt='hh:mm';r.getCell(3).numFmt='mm-dd hh:mm';r.getCell(8).numFmt='0';lastDay=day;
 }
 ws.autoFilter={from:'A5',to:'J'+Math.max(5,ws.rowCount)};
 const info=book.addWorksheet('说明与来源',{views:[{showGridLines:false}]});info.columns=[{width:25},{width:105},{width:26}];
 info.mergeCells('A1:C1');info.getCell('A1').value='如何关注、导出与使用';info.getCell('A1').font={name:'Microsoft YaHei',size:18,bold:true,color:{argb:'FFFFFFFF'}};info.getCell('A1').fill=fill('FF163F4A');info.getRow(1).height=36;
 const notes=[['步骤 1 · 选择','进入 RAN1—RAN4 页面，按日期或课题筛选。要关注整周，先选择“全部会议日”。'],['步骤 2 · 关注','列表点 ☆，或打开会议详情后点“加入我的关注”；也可点“关注当前筛选”批量关注。'],['步骤 3 · 导出','点“导出关注”，范围选择“我的关注 · 跨 RAN1—RAN4”，再选择 Excel、日历图 PNG、Markdown、CSV 或日历 ICS 并下载。'],['关注保存位置','关注保存在当前浏览器，不会自动同步到其他设备或浏览器。'],['Excel 使用','“我的议程”按开始时间排序，可用表头筛选、排序。结束列包含日期，跨午夜按实际中国日期记录；蓝色备注栏可编辑。'],['PNG 与 ICS','PNG 是便于保存或分享的日历图；ICS 可导入日历应用，提醒在该应用中设置。导出均为一次性快照。'],['时区','所有日期与时间为北京时间（Asia/Shanghai，UTC+8）；本次卡尔加里会议当地时间 +14 小时。'],['本次导出',core.date(at)+' '+core.time(at)+'（北京时间）；'+(options.scopeLabel||'我的关注')+'；'+items.length+' 场'],['来源说明','原始日程由 Duckhyun Bae 维护于 3GPPSchedule。本页进行时区换算并提供关注与导出，变动请核对原始日程。']];
 for(const values of notes){const r=info.addRow(values);r.height=Math.max(36,lines(values[1],92)*15+14)}
 info.addRow([]);const h=info.addRow(['会议 / 所选场次','原始日程链接','原页生成（北京）']);h.height=27;h.eachCell(c=>{c.fill=fill('FF246978');c.font={bold:true,color:{argb:'FFFFFFFF'}}});
 const groups=[...new Set(items.map(s=>s.meeting))].sort();for(const meeting of groups){const group=items.filter(s=>s.meeting===meeting),s=group[0],r=info.addRow([meeting+' / '+group.length+' 场',{text:s.sourceUrl,hyperlink:s.sourceUrl},s.sourceGenerated?core.date(Date.parse(s.sourceGenerated))+' '+core.time(Date.parse(s.sourceGenerated)):'—']);r.height=34;r.getCell(2).font={name:'Microsoft YaHei',size:11,color:{argb:'FF1668A5'},underline:true}}
 info.eachRow((r,n)=>{if(n===1)return;r.eachCell(c=>{if(!c.font?.color)c.font={name:'Microsoft YaHei',size:11,color:{argb:'FF253D46'}};c.alignment={vertical:'middle',wrapText:true}})});
 return book.xlsx.writeBuffer();
}
root.ScheduleXlsx={toXlsx};
})(window);
