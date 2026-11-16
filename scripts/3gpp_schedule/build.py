"""Build all four RAN schedule pages with verified Calgary ABT (UTC-6)."""
from html_dom import DOM
from pathlib import Path
from datetime import datetime,timedelta,timezone
from urllib.request import urlopen
from zoneinfo import ZoneInfo
import json,re,sys,collections
ROOT=Path(__file__).resolve().parents[2]
BUNDLE=Path(__file__).resolve().parent
OUT=ROOT/'3gpp-schedule'
CN=ZoneInfo('Asia/Shanghai');ABT=timezone(timedelta(hours=-6),name='ABT')
DAYS=['monday','tuesday','wednesday','thursday','friday']
MEETINGS={1:'RAN1 #127',2:'RAN2 #136',3:'RAN3 #134',4:'RAN4 #121'}
def extract(wg,raw):
 s=DOM(raw).root;events=[];breaks=[];day_grids=[];rooms_all=[];room_descriptions={};sections={}
 source=f'https://karlla1220.github.io/3GPPSchedule/ran{wg}/'
 for panel in s.all('day-panel'):
  day=panel.attrs.get('id')
  if day not in DAYS:continue
  base=datetime(2026,11,16,tzinfo=ABT)+timedelta(days=DAYS.index(day));grid=panel.all('schedule-grid')[0]
  source_labels=[n.text().strip() for n in grid.all('room-header') if 'time-col' not in n.attrs.get('class','').split()]
  canon=['Main','BR1 · Shan','BR2 · Gene','Ad hoc'][:len(source_labels)] if wg==4 else source_labels
  mapping=dict(zip(source_labels,canon));day_labels=dict(zip(canon,source_labels))
  for r,label in zip(canon,source_labels):
   if r not in rooms_all:rooms_all.append(r)
   room_descriptions[r]=label
  p_events=[]
  for block in panel.all('session-block'):
   a=block.attrs;p=a.get('data-popup','');d=DOM(p).root
   tm=re.search(r'Time: (\d\d:\d\d) - (\d\d:\d\d)',p)
   if not tm:raise ValueError(f'RAN{wg}: missing time: '+a.get('data-name',''))
   start,end=[base.replace(hour=int(v[:2]),minute=int(v[3:])) for v in tm.groups()]
   if end<=start:end+=timedelta(days=1)
   rm=re.search(r'Room: ([^<]+)',p)
   src_rooms=rm.group(1).split(', ') if rm else []
   rooms=[mapping[r] for r in src_rooms if r in mapping]
   if not rooms:raise ValueError(f'RAN{wg} unknown source rooms {src_rooms}')
   chair=re.search(r'Chair: ([^<]+)',p)
   ais=a.get('data-ai','').split('|') if a.get('data-ai') else []
   scopes=[x.removesuffix('.*') for x in a.get('data-ai-scope','').split('|') if x]
   agenda=[n.text().strip() for n in d.all('popup-agenda-item')]
   parents=[n.text().strip() for n in d.all('popup-agenda-parent')]
   for n in d.all('popup-agenda-item'):
    code=n.all(tag='strong')
    if code:
     key=code[0].text().rstrip(':').strip();name=n.text().strip();sections.setdefault(key,dict(title=name[len(code[0].text()):].strip(),url=''))
   for n in d.all('popup-agenda-parent'):
    m=re.match(r'([\d.]+)\s*[-–]\s*(.+)',n.text().strip())
    if m:sections.setdefault(m.group(1),dict(title=m.group(2),url=''))
   name=a.get('data-name','');description=a.get('data-description','')
   focus='ntn' if re.search(r'\bNTN\b',name+' '+description,re.I) else 'isac' if re.search(r'ISAC|Sensing',name+' '+description,re.I) else 'other'
   notes=[n.text().strip() for n in block.all('session-note')]+[n.text().strip() for n in d.all('popup-notes')]
   emails=[]
   for n in d.all('popup-email-item'):
    links=[x.attrs.get('href') for x in n.all(tag='a') if x.attrs.get('href','').startswith('https://')];gist=n.all('popup-email-gist')
    emails.append(dict(text=gist[0].text().strip() if gist else '',facts=[x.text().strip() for x in n.all('popup-email-facts')],url=links[0] if links else ''))
   color=re.search(r'--session-border:(#[0-9a-fA-F]{6})',a.get('style',''))
   event=dict(id=f's{len(events)+1:03}',name=name,description=description,ais=ais,agreementAis=a.get('data-agreement-ai','').split('|') if a.get('data-agreement-ai') else scopes,group=a.get('data-group',''),focus=focus,rooms=rooms,sourceRooms=src_rooms,chair=chair.group(1) if chair else '',localDate=base.date().isoformat(),localStart=tm.group(1),localEnd=tm.group(2),start=start.astimezone(CN).isoformat(),end=end.astimezone(CN).isoformat(),duration=int((end-start).total_seconds()/60),notes=list(dict.fromkeys(notes)),agenda=agenda,parents=parents,emails=emails,color=color.group(1) if color else '#8394a2')
   events.append(event);p_events.append((start,end))
  start=base+timedelta(minutes=int(grid.attrs['data-start']));end=base+timedelta(minutes=int(grid.attrs['data-end']))
  if p_events:start=min(start,min(x[0] for x in p_events));end=max(end,max(x[1] for x in p_events))
  day_grids.append(dict(date=base.date().isoformat(),start=start.astimezone(CN).isoformat(),end=end.astimezone(CN).isoformat(),rooms=canon,roomLabels=day_labels))
  for br in panel.all('break-bar'):
   m=re.search(r'grid-row:(\d+)/(\d+)',br.attrs.get('style',''))
   if m:
    x,y=map(int,m.groups());a=base+timedelta(minutes=int(grid.attrs['data-start'])+(x-2)*int(grid.attrs['data-slot']));b=base+timedelta(minutes=int(grid.attrs['data-start'])+(y-2)*int(grid.attrs['data-slot']))
    breaks.append(dict(name=br.text().strip(),start=a.astimezone(CN).isoformat(),end=b.astimezone(CN).isoformat(),localDate=base.date().isoformat()))
 scripts={n.attrs.get('id'):n.text() for n in s.all(tag='script') if n.attrs.get('type')=='application/json'}
 filters=json.loads(scripts['filter-data']);agreements=json.loads(scripts.get('agreement-data','{}'))
 if agreements.get('sections'):sections={k:dict(title=v.get('title',''),url=v.get('url','')) for k,v in agreements['sections'].items()}
 meta=s.all('meta')[0];gen=re.search(r'Generated: ([\d-]+ [\d:]+)',meta.text()).group(1);gen_local=datetime.strptime(gen,'%Y-%m-%d %H:%M').replace(tzinfo=ABT)
 # Preserve schedule notes without assigning unallocated topics an invented time.
 supplementary=[]
 for n in s.all():
  if n.tag in ('h2','h3') and n.text().strip() and n.text().strip() not in ('Agreements for',):
   title=n.text().strip()
   if title=='Off-offline and FL whereabouts':continue
   parent=n.parent
   if parent and len(parent.text())<14000:
    lines=[]
    for x in parent.all():
     if x.tag in ('p','li','tr'):t=' '.join(x.text().split());lines.append(t)
    lines=list(dict.fromkeys(t for t in lines if t and len(t)<3000))
    if lines:supplementary.append(dict(title=title,lines=lines))
 actual={e['name']+'|'+e['group'] for e in events};catalog={e['key'] for g in filters['groups'] for e in g['sessions']}
 if actual!=catalog:raise ValueError(f'RAN{wg} catalog mismatch: {actual^catalog}')
 return dict(meeting=MEETINGS[wg],workgroup=f'RAN{wg}',experimental=wg in (3,4),rooms=rooms_all,roomDescriptions=room_descriptions,venue='Calgary, Alberta, Canada',venueTimeZone='America/Edmonton',venueTimeLabel='ABT',venueUTCOffsetMinutes=-360,chinaAheadHours=14,timezoneBasisURL='https://www.alberta.ca/albertas-new-time-system-abt',meetingDays=day_grids,topicGroups=filters['groups'],allAgendaIds=filters.get('allAIs',[]),agendaSections=sections,chairNotesUrl=agreements.get('source_url',source),displayTimeZone='Asia/Shanghai',sourceUrl=source,sourceAuthor='Duckhyun Bae',sourceGenerated=gen_local.astimezone(CN).isoformat(),retrievedAt=datetime.now(CN).isoformat(),sources=[dict(label=n.text().strip(),url=n.attrs['href']) for n in meta.all(tag='a')],sessions=events,breaks=breaks,supplementary=supplementary)
def main():
 template=(BUNDLE/'page.html').read_text();summaries=[]
 for wg in range(1,5):
  path=ROOT/f'.cache/3gpp-schedule/ran{wg}.html'
  if '--refresh' in sys.argv or not path.exists():path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(urlopen(f'https://karlla1220.github.io/3GPPSchedule/ran{wg}/',timeout=45).read())
  data=extract(wg,path.read_text());dest=OUT/f'ran{wg}';dest.mkdir(parents=True,exist_ok=True)
  (dest/'schedule-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
  links='<a class="home-link" href="/">← 主页</a>'+''.join(f'<a href="../ran{i}/" class="wg-tab '+('active' if i==wg else '')+f'"'+(' aria-current="page"' if i==wg else '')+f'>RAN{i}<span>#{MEETINGS[i].split("#")[1]}</span></a>' for i in range(1,5))
  html=template.replace('__MEETING__',MEETINGS[wg]).replace('__WORKGROUP__',f'RAN WORKING GROUP {wg}').replace('__WORKGROUP_NAV__',links).replace('__SOURCE_URL__',data['sourceUrl']).replace('__WORKGROUP_LABEL__',f'RAN{wg}').replace('__EXPERIMENTAL_CLASS__','' if wg in (3,4) else 'hidden').replace('__SCHEDULE_DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))
  (dest/'index.html').write_text(html)
  summary=dict(workgroup=f'RAN{wg}',meeting=MEETINGS[wg],sessions=len(data['sessions']),topics=sum(len(g['sessions']) for g in data['topicGroups']),rooms=len(data['rooms']),sourceGenerated=data['sourceGenerated']);summaries.append(summary);print(summary)
 (OUT/'meetings.json').write_text(json.dumps(summaries,ensure_ascii=False,indent=2)+'\n')
 cards=''.join(f'<a class="hub-card" href="./ran{i}/"><span class="meeting-no">2026 · 11/16—20</span><h2>{m["workgroup"]}</h2><strong>#{m["meeting"].split("#")[1]}</strong>'+('<span class="experimental-badge">Experimental</span>' if i in (3,4) else '')+f'<p>{m["sessions"]} 场排程 · {m["topics"]} 个课题条目<br>{m["rooms"]} 个会场 / 讨论组</p><span class="card-link">查看北京时间日程 →</span></a>' for i,m in enumerate(summaries,1))
 (OUT/'index.html').write_text((BUNDLE/'hub.html').read_text().replace('__HUB_CARDS__',cards))
if __name__=='__main__':main()
