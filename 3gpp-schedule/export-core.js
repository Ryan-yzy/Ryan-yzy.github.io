/* Pure serializers shared by the individual RAN pages and the personal export dialog. */
(function(root){
'use strict';
const TZ='Asia/Shanghai';
const date=t=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(t);
const time=t=>new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(t);
const weekday=t=>new Intl.DateTimeFormat('zh-CN',{timeZone:TZ,weekday:'short'}).format(t);
const slug=m=>m.toLowerCase().replace(' #','-');
function normalize(s,meta){return {...s,a:Number.isFinite(s.a)?s.a:Date.parse(s.start),b:Number.isFinite(s.b)?s.b:Date.parse(s.end),meeting:s.meeting||meta.meeting,workgroup:s.workgroup||meta.workgroup,sourceUrl:s.sourceUrl||meta.sourceUrl,sourceGenerated:s.sourceGenerated||meta.sourceGenerated,sourceAuthor:s.sourceAuthor||meta.sourceAuthor||'Duckhyun Bae'}}
function key(s){return slug(s.meeting)+'-'+s.id}
function unique(items){return [...new Map(items.map(s=>[key(s),s])).values()].sort((a,b)=>a.a-b.a||a.meeting.localeCompare(b.meeting)||a.b-b.b||a.id.localeCompare(b.id))}
function title(s){return s.workgroup==='RAN1'&&s.ais?.includes('1')&&s.ais?.includes('2')?'开幕与会务（AI 1–5）':s.name.replace(/^AI\s*/,'')}
function flat(v){return String(v??'').replace(/\r?\n/g,' / ').replace(/\s+/g,' ').trim()}
function cell(v){return flat(v).replace(/\\/g,'\\\\').replace(/\|/g,'\\|').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\[/g,'\\[').replace(/\]/g,'\\]')}
function range(s){return `${date(s.a)} ${time(s.a)} — ${date(s.b)} ${time(s.b)}`}
function sources(items){return [...new Map(items.map(s=>[s.meeting,s])).values()].sort((a,b)=>a.meeting.localeCompare(b.meeting))}
function toMarkdown(input,options={}){
 const items=unique(input),at=options.exportedAt??Date.now();
 const lines=['# '+(options.title||'我的关注议程'),'','- 时区：北京时间（Asia/Shanghai，UTC+8）；卡尔加里当地时间 +14 小时。',`- 导出时间：${date(at)} ${time(at)}（北京时间）`,`- 导出范围：${options.scopeLabel||'我的关注（RAN1—RAN4）'}；共 ${items.length} 场。`,''];
 let day='';for(const s of items){const d=date(s.a);if(d!==day){day=d;lines.push(`## ${d}（${weekday(s.a)}）`,'','| 北京时间（完整起止日期） | 工作组 / 会议 | 议程编号 | 课题 | 会场 | 主持人 | 时长 |','|---|---|---|---|---|---|---|')}
  const desc=s.description&&flat(s.description)!==flat(title(s))?' · '+s.description:'';
  lines.push('| '+[range(s),s.meeting,s.ais?.join(', ')||'—',title(s)+desc,(s.sourceRooms||s.rooms).join(' / '),s.chair||'—',s.duration+' 分钟'].map(cell).join(' | ')+' |');
 }
 const noted=items.filter(s=>s.notes?.length);if(noted.length){lines.push('','## 本场讨论说明','');for(const s of noted)lines.push(`- **${cell(s.meeting)} · ${cell(title(s))}**（${range(s)}）：${s.notes.map(cell).join('；')}`)}
 lines.push('','## 来源说明','','原始日程由 Duckhyun Bae 维护于 3GPPSchedule。本文件由北京时间日程页根据所选场次导出，保留原始课题名称与会场信息。','');
 for(const s of sources(items))lines.push(`- [${cell(s.meeting)} 原始日程](${s.sourceUrl})${s.sourceGenerated?'；原页生成：'+date(Date.parse(s.sourceGenerated))+' '+time(Date.parse(s.sourceGenerated))+'（北京时间）':''}`);
 lines.push('','这是一次性日程快照；查看后续变更可打开上面的原始日程链接。','');return lines.join('\n');
}
function csvCell(v){let s=String(v??'');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function toCSV(input){const rows=[['工作组','会议','议程编号','课题','议题说明','北京时间开始','北京时间结束','时长（分钟）','会场','主持人','当地日期','当地开始','当地结束','讨论说明','原始日程']];for(const s of unique(input))rows.push([s.workgroup,s.meeting,s.ais?.join(', ')||'',title(s),s.description,date(s.a)+' '+time(s.a),date(s.b)+' '+time(s.b),s.duration,(s.sourceRooms||s.rooms).join(' / '),s.chair,s.localDate,s.localStart,s.localEnd,(s.notes||[]).join('\n'),s.sourceUrl]);return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n'}
function escapeICS(v){return String(v??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function foldICS(line){let rows=[],part='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>73){rows.push(part);part=' '+ch;bytes=1+n}else{part+=ch;bytes+=n}}rows.push(part);return rows.join('\r\n')}
function toICS(input,options={}){
 const items=unique(input),utc=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//3GPP Beijing Schedule//CN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+escapeICS(options.title||'我的关注议程 · 北京时间'),'X-WR-TIMEZONE:Asia/Shanghai'];
 for(const s of items)lines.push('BEGIN:VEVENT',`UID:${key(s)}@ran1-beijing-schedule`,`DTSTAMP:${utc(options.exportedAt??Date.now())}`,`DTSTART:${utc(s.a)}`,`DTEND:${utc(s.b)}`,`SUMMARY:${escapeICS('['+s.meeting+'] '+title(s))}`,`LOCATION:${escapeICS((s.sourceRooms||s.rooms).join(' / '))}`,`DESCRIPTION:${escapeICS([s.description,'北京时间：'+range(s),'当地时间：'+s.localDate+' '+s.localStart+'—'+s.localEnd+'（Calgary ABT UTC−6，北京时间快14小时）',s.chair?'主持人：'+s.chair:'',...(s.notes||[]),'原始日程：'+s.sourceUrl].filter(Boolean).join('\n'))}`,`URL:${s.sourceUrl}`,'END:VEVENT');
 lines.push('END:VCALENDAR');return lines.map(foldICS).join('\r\n')+'\r\n';
}
const api={normalize,key,unique,title,range,toMarkdown,toCSV,toICS,date,time};if(typeof module==='object'&&module.exports)module.exports=api;else root.ScheduleExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
