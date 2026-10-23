"""Fixed mainland city query panel; anonymous first five pages only, no role/city quotas."""
import concurrent.futures,datetime,hashlib,importlib.util,json,random,threading,time,urllib.parse,urllib.request
from pathlib import Path
import geography as geo
ROOT=Path(__file__).resolve().parent;NOW='2026-10-03'
spec=importlib.util.spec_from_file_location('career',ROOT/'expand-business.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
codes=sorted(set(['110000','120000','310000','500000']+[a['code'] for a in geo.areas if a['code'].endswith('00') and a['name'].endswith('市') and int(a['code'][:2])<71]));random.Random(20261003).shuffle(codes)
lock=threading.Lock();next_request=0
def fetch(code,page):
 global next_request
 path=ROOT/'raw'/f'ncss-{code}--{page}.json'
 url='https://www.ncss.cn/student/jobs/jobslist/ajax/?'+urllib.parse.urlencode({'jobName':'','recruitType':'0','limit':20,'offset':page,'areaCode':code})
 if path.exists():data=json.loads(path.read_text(encoding='utf8'))
 else:
  with lock:delay=max(0,next_request-time.monotonic());next_request=max(next_request,time.monotonic())+.5
  time.sleep(delay);payload=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read();data=json.loads(payload)
  if not data.get('flag') or not isinstance(data.get('data'),dict):raise ValueError('Public list unavailable; stop this source')
  path.write_bytes(payload)
 return url,data['data'].get('list',[])
def normalized(p):
 if str(p.get('recruitType'))=='1':return None
 title=p.get('jobName') or '';occ=c.classify(title)
 if occ is None:return None
 lo=float(p['lowMonthPay'])*1000 if p.get('lowMonthPay') and float(p['lowMonthPay'])>0 else None;hi=float(p['highMonthPay'])*1000 if p.get('highMonthPay') and float(p['highMonthPay'])>0 else None
 if lo is None or hi is None or hi<lo:lo=hi=None
 date=lambda t:datetime.datetime.fromtimestamp(t/1000,datetime.timezone(datetime.timedelta(hours=8))).date().isoformat() if t else None
 url=f'https://www.ncss.cn/student/jobs/{p["jobId"]}/detail.html';loc=p.get('areaCodeName') or '未披露'
 r=dict(id=hashlib.sha256(url.encode()).hexdigest()[:16],title=title,company=p.get('recName') or '未披露',city=loc,location=loc,country='中国',source='国家大学生就业服务平台',originSource=p.get('sourcesNameCh') or '国家大学生就业服务平台',sourceUrl='https://www.ncss.cn/student/jobs/index.html',url=url,industry='未披露',scale=p.get('recScale') or '未披露',property=p.get('recProperty') or '未披露',experience='未披露',education=p.get('degreeName') or '未披露',salaryText=f'{lo/1000:g}–{hi/1000:g}千元/月' if lo else '面议 / 未披露',salaryMin=lo,salaryMax=hi,salaryMonths=None,publishedAt=date(p.get('publishDate')),updatedAt=date(p.get('updateDate')),collectedAt=NOW,hiringType='未披露',majorRequirements=p.get('major') or '专业不限',headCount=p.get('headCount') or None,description='平台列表明示专业要求：'+(p.get('major') or '专业不限')+'。详细职责以原页为准。',skills=c.keywords(title),status='公开列表可见',occupation=occ,category=c.occupations[int(occ)]['name'],family=c.occupations[int(occ)]['group'],relatedMajors=c.occupations[int(occ)]['majors'])
 return geo.apply(r)
if __name__=='__main__':
 rows={};sources=[]
 def checkpoint():
  temporary=ROOT/'ncss-panel-pool.tmp';temporary.write_text(json.dumps({'rows':list(rows.values()),'sources':sources,'panel':codes},ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(ROOT/'ncss-panel-pool.json')
 def collect(code):
  result=[]
  for page in range(1,6):
   url,items=fetch(code,page);result.append((url,items))
   if len(items)<20:break
  return result
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
  for i,result in enumerate(ex.map(collect,codes),1):
   for url,items in result:
    sources.append({'name':'国家大学生就业服务平台','url':url,'count':len(items),'status':'匿名公开前五页','collectedAt':NOW})
    for p in items:
     r=normalized(p)
     if r:rows.setdefault(r['url'],r)
   if i%10==0:checkpoint();print(json.dumps({'cityQueries':i,'panelCities':len(codes),'relatedRows':len(rows)}),flush=True)
 checkpoint();print('Complete',len(rows),flush=True)
