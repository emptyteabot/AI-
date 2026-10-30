#!/usr/bin/env python3
"""Import the published PATS expert comparisons without annotator identifiers.

Inputs are the four original batch_Batch_N.json files. The same original
dialogue pair appears under different comparisonId values across batches, so
the grouping key is the ordered pair of source dialogue IDs, not comparisonId.
"""
import argparse
import collections
import hashlib
import html
import json
import re
from pathlib import Path
from html.parser import HTMLParser

SOURCE='https://github.com/donya-rooein/PATS'
REV='3924adf32ab21ae79e027ffc6711798d56c3d0ba'
QUESTIONS={'q1_response':'激励与支持','q2_response':'适配学生个性','q3_response':'主动回应','q4_response':'学生参与','q5_response':'同理心'}
EXPECTED=['420779884ee4287a63c4515a5593d156a42c6801548848d67aeefd7d830c76cd','850450651412ac45ee9028b5019781f3e366acdf4a8bf0ef89e97accdef72b6b','37123c5198265cb121e3e5f3fbe3c8ec924d8b253894262fdd5b91097732a1cf','f90c7509a89c151073e815137aa434e68fe4640b9b904b7517e0cd89dd802aba']

class Plain(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.current=None; self.rows=[]
 def handle_starttag(self,tag,attrs):
  if tag=='p': self.current=[]
 def handle_data(self,data):
  if self.current is not None: self.current.append(data)
 def handle_endtag(self,tag):
  if tag!='p' or self.current is None: return
  value=''.join(self.current).strip()
  # Upstream batches format the same turn as either "utterance: Teacher"
  # or "Teacher: utterance"; normalize both without changing its wording.
  match=re.match(r'^(.*?)\s*:\s*(Teacher|Student)\s*$',value,re.I|re.S)
  if match: value=match.group(2)+': '+match.group(1).strip()
  else:
   match=re.match(r'^(Teacher|Student)\s*:\s*(.*?)\s*$',value,re.I|re.S)
   if match: value=match.group(1)+': '+match.group(2).strip()
  self.rows.append(value);self.current=None
 def value(self): return '\n'.join(self.rows)

def plain(value):
 parser=Plain(); parser.feed(value); return parser.value()

def load_batches(paths):
 pairs={}
 for index,path in enumerate(paths):
  raw=Path(path).read_bytes()
  digest=hashlib.sha256(raw).hexdigest()
  if digest!=EXPECTED[index]: raise ValueError(f'unexpected upstream bytes for batch {index+1}: {digest}')
  data=json.loads(raw)['data']; by_id={x['id']:x for x in data['comparisonObjects']}
  assert len(by_id)==30 and len(data['userChoices']['results'])==30
  for response in data['userChoices']['results']:
   obj=by_id[response['comparisonId']]
   assert not obj['control_comparison'] and not response['control_comparison']
   ids=tuple(sorted((response['dialog_left']['dialog_id'],response['dialog_right']['dialog_id'])))
   ds={obj['leftDialog']['id']:obj['leftDialog'],obj['rightDialog']['id']:obj['rightDialog']}
   assert set(ids)==set(ds) and len(ids)==2
   if ids not in pairs:
    kind='story' if 'story_title' in obj else 'image'
    pairs[ids]={'id':'PATS-'+hashlib.sha256('|'.join(ids).encode()).hexdigest()[:10],
     'sourceDialogIds':list(ids),'kind':kind,'topic':obj.get('story_title','图片描述（原图未随子集收录）'),
     'left':{'id':ids[0],'type':ds[ids[0]]['type'],'text':plain(ds[ids[0]]['content'])},
     'right':{'id':ids[1],'type':ds[ids[1]]['type'],'text':plain(ds[ids[1]]['content'])},'votes':[]}
   row=pairs[ids]; assert row['left']['text']==plain(ds[ids[0]]['content']) and row['right']['text']==plain(ds[ids[1]]['content'])
   by_type={ds[i]['type']:i for i in ids}; assert len(by_type)==2
   choices={}
   for question in QUESTIONS:
    val=response['question_responses'][question]
    assert val=='Same' or val in by_type
    choices[question]='tie' if val=='Same' else 'A' if by_type[val]==ids[0] else 'B'
   # Batch number is a local pseudonym, not the original keyword or identity.
   row['votes'].append({'reviewer':'R'+str(index+1),'sourceComparisonId':response['comparisonId'],
    'displayOrder':['A' if response['dialog_left']['dialog_id']==ids[0] else 'B','A' if response['dialog_right']['dialog_id']==ids[0] else 'B'],
    'sourceRoleLayout':'role_before' if index==1 else 'role_after','choices':choices})
 assert len(pairs)==40 and sum(len(x['votes']) for x in pairs.values())==120
 assert all(len(x['votes'])==3 for x in pairs.values())
 out=sorted(pairs.values(),key=lambda x:x['id'])
 stats={}
 for question,name in QUESTIONS.items():
  total=collections.Counter(); by_pair=collections.Counter()
  for p in out:
   for v in p['votes']: total[v['choices'][question]]+=1
   c=collections.Counter(v['choices'][question] for v in p['votes'])
   # The original paper counts a tie as half a win in its pair-majority calculation.
   a=c['A']+.5*c['tie']; b=c['B']+.5*c['tie']
   by_pair['A' if a>b else 'B' if b>a else 'tie']+=1
  stats[question]={'name':name,'rawVotes':dict(total),'pairDecision':dict(by_pair)}
 return {'source':{'name':'PATS · Expert Teacher Study','url':SOURCE,'revision':REV,'paper':'https://aclanthology.org/2026.findings-eacl.219/',
  'paperCitation':'Rooein et al., Findings of EACL 2026, PATS: Personality-Aware Teaching Strategies with Large Language Model Tutors.',
  'repoLicense':'MIT','dialogueLicense':'CC BY 4.0 (per paper, Appendix A)','dialogueLicenseUrl':'https://creativecommons.org/licenses/by/4.0/','batchSha256':EXPECTED,
  'disclosure':'四位教师对原论文中合成学生与教学对话作评价；不属于本项目实测输出。按五维成对偏好比较，非1–5分。每对3名教师。'},
  'reviewers':4,'comparisons':len(out),'individualReviews':120,'dimensionChoices':600,'dimensions':QUESTIONS,'stats':stats,'pairs':out}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('batches',nargs=4);parser.add_argument('--output',required=True);args=parser.parse_args()
 result=load_batches(args.batches);Path(args.output).write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 print(json.dumps({'comparisons':result['comparisons'],'reviews':result['individualReviews'],'choices':result['dimensionChoices']},ensure_ascii=False))
