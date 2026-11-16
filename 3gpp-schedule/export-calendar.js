/* Date/time calendar renderer, with lossless pagination for dense selections. */
(function(root){
'use strict';
const palette={RAN1:['#e5f3ef','#1c725a'],RAN2:['#e9effd','#355baa'],RAN3:['#f2ebfa','#7650a2'],RAN4:['#fff0df','#a96622']};
const DAY=86400000,shift=8*3600000;
function wrap(ctx,text,width){const rows=[];for(const paragraph of String(text||'').split('\n')){let row='';for(const word of paragraph.match(/\S+\s*|\s+/g)||['']){if(ctx.measureText(word).width>width){for(const ch of word){if(row&&ctx.measureText(row+ch).width>width){rows.push(row.trimEnd());row=''}row+=ch}}else if(row&&ctx.measureText(row+word).width>width){rows.push(row.trimEnd());row=word.trimStart()}else row+=word}rows.push(row.trimEnd())}return rows}
function segments(input){const core=root.ScheduleExport,out=[];for(const s of core.unique(input)){let a=s.a;while(a<s.b){const midnight=Math.floor((a+shift)/DAY)*DAY-shift,b=Math.min(s.b,midnight+DAY);out.push({s,day:core.date(a),start:(a-midnight)/60000,end:(b-midnight)/60000,continued:a>s.a,continues:b<s.b});a=b}}return out}
function plan(input){
 const measure=document.createElement('canvas').getContext('2d'),width=290;measure.font='16px sans-serif';
 const days=[...new Set(segments(input).map(s=>s.day))].sort().map(day=>{
  const records=segments(input).filter(s=>s.day===day).sort((a,b)=>a.start-b.start||a.end-b.end),lanes=[];
  for(const r of records){const s=r.s;r.labels=[root.ScheduleExport.title(s)];if(s.description&&s.description.trim()!==r.labels[0].trim())r.labels.push(s.description);r.lines=r.labels.flatMap(t=>wrap(measure,t,width-34));r.height=Math.max(82,58+r.lines.length*21);let lane=lanes.findIndex(end=>end<=r.start*2);if(lane<0)lane=lanes.length;r.lane=lane;lanes[lane]=Math.max(r.end*2,r.start*2+r.height+8)}
  return {day,records,width:Math.max(1,lanes.length)*width+16};
 });return days;
}
async function renderPage(days,options,index,total){
 const core=root.ScheduleExport,laneWidth=290,top=180,left=83,bottom=115;
 const start=Math.floor(Math.min(...days.flatMap(d=>d.records.map(r=>r.start)))/60)*60;
 const end=Math.max(Math.ceil(Math.max(...days.flatMap(d=>d.records.map(r=>r.end)))/60)*60,...days.flatMap(d=>d.records.map(r=>r.start+r.height/2+8)));
 const intervals=days.flatMap(d=>d.records.map(r=>[r.start,Math.max(r.end,r.start+r.height/2+8)])).sort((a,b)=>a[0]-b[0]),merged=[];for(const interval of intervals){const last=merged.at(-1);if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);else merged.push(interval.slice())}const gaps=[];for(let i=1;i<merged.length;i++){const a=Math.ceil(merged[i-1][1]/60)*60,b=Math.floor(merged[i][0]/60)*60;if(b-a>=120)gaps.push([a,b])}const yAt=m=>top+(m-start)*2-gaps.reduce((n,[a,b])=>n+(m>=b?(b-a)*2-52:m>a?(m-a)*2-(m-a)/(b-a)*52:0),0);
 const natural=left+days.reduce((n,d)=>n+d.width,0)+26,extra=Math.max(0,760-natural)/days.length;days=days.map(d=>({...d,width:d.width+extra}));
 const width=Math.ceil(left+days.reduce((n,d)=>n+d.width,0)+26),height=Math.ceil(yAt(end)+bottom);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');if(!c)throw new Error('当前浏览器无法生成日历图');
 c.fillStyle='#f5f8fa';c.fillRect(0,0,width,height);c.fillStyle='#163f4a';c.font='bold 28px sans-serif';c.fillText(options.title||'我的关注议程',28,43);c.font='16px sans-serif';c.fillStyle='#526a74';c.fillText('北京时间 · UTC+8  |  '+days[0].day+(days.length>1?' — '+days.at(-1).day:''),28,74);
 c.font='14px sans-serif';wrap(c,'时间块标明实际起止时间；并行会议分栏。跨午夜分别标注，长空白时段压缩。'+(total>1?'  图 '+index+' / '+total:''),width-56).forEach((line,i)=>c.fillText(line,28,99+i*19));
 let x=left;for(const d of days){c.fillStyle='#ffffff';c.fillRect(x,top,d.width-8,height-top-bottom);c.fillStyle='#dfe9ed';c.fillRect(x,139,d.width-8,36);c.fillStyle='#234b58';c.font='bold 17px sans-serif';c.fillText(d.day+'  '+new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',weekday:'long'}).format(new Date(d.day+'T12:00:00+08:00')),x+12,163);x+=d.width}
 for(let m=start;m<=Math.min(end,1440);m+=60){if(gaps.some(([a,b])=>m>a&&m<b))continue;const y=yAt(m);c.strokeStyle='#dce5e9';c.beginPath();c.moveTo(left,y);c.lineTo(width-26,y);c.stroke();c.fillStyle='#647984';c.font='14px sans-serif';c.fillText(String(Math.floor(m/60)).padStart(2,'0')+':00',20,y+5)}
 for(const [a,b] of gaps){const y=yAt(a);c.fillStyle='#edf2f5';c.fillRect(left,y,width-left-26,52);c.fillStyle='#687e87';c.font='14px sans-serif';c.fillText(String(a/60).padStart(2,'0')+':00—'+String(b/60).padStart(2,'0')+':00  无所选会议（空白时段已压缩）',left+12,y+32)}
 x=left;for(const d of days){const laneWidth=(d.width-16)/(Math.max(...d.records.map(r=>r.lane))+1);for(const r of d.records){const s=r.s,y=yAt(r.start),bx=x+r.lane*laneWidth+6,h=Math.max((r.end-r.start)*2-4,r.height),colors=palette[s.workgroup]||palette.RAN1;c.fillStyle=colors[0];c.fillRect(bx,y,laneWidth-12,h);c.fillStyle=colors[1];c.fillRect(bx,y,4,h);c.font='bold 15px sans-serif';c.fillText(s.meeting+'  '+(r.continued?'00:00':core.time(s.a))+'–'+(r.end===1440?'24:00':core.time(s.b))+(r.continued?'（续）':r.continues?'（跨日续）':''),bx+12,y+23);c.font='16px sans-serif';c.fillStyle='#203c48';r.lines.forEach((line,i)=>c.fillText(line,bx+12,y+49+i*21));}x+=d.width}
 c.fillStyle='#526a74';c.font='14px sans-serif';const foot=height-bottom+29;c.fillText('来源：Duckhyun Bae · 3GPPSchedule  |  导出于 '+core.date(Date.now())+' '+core.time(Date.now())+'（北京）',28,foot);
 const sources=[...new Set(days.flatMap(d=>d.records.map(r=>r.s.sourceUrl)))];sources.forEach((url,i)=>c.fillText(url,28,foot+22+i*18));
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('日历图生成失败，请减少导出范围后重试')),'image/png'));canvas.width=canvas.height=1;
 return {blob,name:'3GPP_Calendar_'+days[0].day+(days.length>1?'_'+days.at(-1).day:'')+'.png',width,height};
}
async function toPNGs(input,options={}){
 if(document.fonts?.ready)await document.fonts.ready;const days=plan(input),groups=[];let current=[],width=0;for(const day of days){if(current.length&&(width+day.width>4200)){groups.push(current);current=[];width=0}current.push(day);width+=day.width}if(current.length)groups.push(current);
 const pages=[];for(let i=0;i<groups.length;i++){await new Promise(r=>setTimeout(r,0));pages.push(await renderPage(groups[i],options,i+1,groups.length))}return pages;
}
// Store-only ZIP: each PNG is already compressed. Keep all pages in a single download.
function zip(files){const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});const crc=data=>{let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0};const parts=[],central=[];let offset=0;for(const f of files){const name=new TextEncoder().encode(f.name),data=f.data,check=crc(data),head=new Uint8Array(30+name.length),v=new DataView(head.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,check,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);head.set(name,30);const dir=new Uint8Array(46+name.length),d=new DataView(dir.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint32(16,check,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);dir.set(name,46);parts.push(head,data);central.push(dir);offset+=head.length+data.length}const size=central.reduce((n,d)=>n+d.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'})}
root.ScheduleCalendar={toPNGs,zip,plan};
})(window);
