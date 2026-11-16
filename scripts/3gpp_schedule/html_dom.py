from html.parser import HTMLParser
from pathlib import Path
import re
class Node:
 def __init__(self,tag='',attrs=None,parent=None):self.tag=tag;self.attrs=dict(attrs or []);self.children=[];self.parent=parent
 def all(self,cl=None,tag=None):
  out=[]
  for c in self.children:
   if isinstance(c,Node):
    if (not cl or cl in c.attrs.get('class','').split()) and (not tag or c.tag==tag):out.append(c)
    out+=c.all(cl,tag)
  return out
 def text(self):return ''.join(c.text() if isinstance(c,Node) else c for c in self.children)
class DOM(HTMLParser):
 def __init__(self,s):super().__init__(convert_charrefs=True);self.root=Node('root');self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=Node(t,a,self.stack[-1]);self.stack[-1].children.append(n)
  if t not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.stack.append(n)
 def handle_startendtag(self,t,a):self.handle_starttag(t,a);self.handle_endtag(t)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,t):self.stack[-1].children.append(t)
