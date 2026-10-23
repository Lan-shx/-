"""Anonymous official recruitment list, randomized public pagination, resumable cache."""
import concurrent.futures,hashlib,html,importlib.util,json,re,random,threading,time,urllib.request,collections
from pathlib import Path
import geography as geo
ROOT=Path(__file__).resolve().parent;NOW='2026-10-03';START='2025-10-03'
spec=importlib.util.spec_from_file_location('career',ROOT/'expand-business.py');career=importlib.util.module_from_spec(spec);spec.loader.exec_module(career)
cache=ROOT/'raw'/'public-base';cache.mkdir(exist_ok=True)
allowed=['acb200','aca112','aca111_','aab004','aab301','aab302','area','area_','acb202','acb22a','acb240','acb241','acb242','aac011','acb239','org_','s_aae396','s_aae397','s_aae398','s_uptime','s_ctime']
lock=threading.Lock();next_request=0
def fetch(page):
 global next_request
 p=cache/f'{page}.json'
 if p.exists():
  try:return json.loads(p.read_text(encoding='utf8'))
  except json.JSONDecodeError:pass
 u=f'http://job.mohrss.gov.cn/cjobs/jobinfolist/listJobinfolist?pageNo={page}'
 with lock:
  delay=max(0,next_request-time.monotonic());next_request=max(next_request,time.monotonic())+.3
 time.sleep(delay)
 for attempt in range(2):
  try:
   text=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=25).read().decode('utf8')
   m=re.search(r'id="findjoblist"[^>]*value="([^"]*)',text)
   if not m:raise ValueError('No anonymous public list; stop this source')
   records=json.loads(html.unescape(m[1]));total=int(re.search(r'id="totalcount"[^>]*value="(\d+)"',text)[1]);pages=int(re.search(r'id="totalpages"[^>]*value="(\d+)"',text)[1])
   result={'page':page,'url':u,'collectedAt':NOW,'responseHash':hashlib.sha256(text.encode()).hexdigest(),'total':total,'pages':pages,'rows':[{k:r.get(k) for k in allowed} for r in records]}
   temporary=p.with_suffix('.tmp');temporary.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(p);return result
  except (urllib.error.URLError,TimeoutError):
   if attempt:raise
   time.sleep(2)
def occupation(t):
 if re.search('普工|司机|保安|保洁|焊工|数控|护理|医生|护士|厨师|办公室清洁',t):return None
 o=career.classify(t)
 if o:return o
 for i,pattern in [(27,'业务员|客户经理|客户代表|招商|渠道经理|营业员'),(25,'文员|办公室|综合内勤|行政内勤|助理秘书'),(10,'客服|客户服务'),(1,'统计员|统计分析|统计专员')]:
  if re.search(pattern,t):return str(i)
 return None
def normalize(p):
 title=p.get('aca112') or '';occ=occupation(title)
 if not occ or not p.get('aab004'):return None
 published=p.get('s_aae397') or None;updated=p.get('s_uptime') or None
 if not any(START<=d<=NOW for d in [published,updated] if d):return None
 lo=p.get('acb241');hi=p.get('acb242');lo=lo if isinstance(lo,(int,float)) and lo>0 else None;hi=hi if isinstance(hi,(int,float)) and hi>0 else None
 bounded=lo is not None and hi is not None and lo<=hi
 salary=f'{lo:g}–{hi:g}元/月' if bounded else f'{lo:g}元/月以上（上限未披露）' if lo else '面议 / 未披露'
 edu={'11':'博士研究生','14':'硕士研究生','21':'大学本科','31':'大学专科','41':'中等专科','44':'职业高中','47':'技工学校','61':'普通高中','71':'初中','81':'小学','90':'其他','00':'未披露'}.get(p.get('aac011'),'未披露')
 url=f'http://job.mohrss.gov.cn/cjobs/jobinfolist/cb21/showgw?id={p["acb200"]}'
 desc=re.sub(r'1[3-9]\d{9}','[联系信息请见原页]',p.get('acb22a') or '')
 r=dict(id=hashlib.sha256(url.encode()).hexdigest()[:16],title=title,company=p['aab004'],location=p.get('acb202') or p.get('aab302') or p.get('area_') or '',city=p.get('aab302') or '',country='中国',industry='未披露',source='中国公共招聘网',originSource=p.get('org_') or '中国公共招聘网',sourceUrl='http://job.mohrss.gov.cn/cjobs/jobinfolist/listJobinfolist',url=url,salaryMin=lo if bounded else None,salaryMax=hi if bounded else None,salaryLowerBound=lo,salaryMonths=None,salaryText=salary,experience='未披露',education=edu,scale='未披露',property='未披露',hiringType={'1':'全职','2':'兼职','3':'实习','4':'临时','5':'小时工','6':'不限'}.get(p.get('acb239'),'未披露'),majorRequirements='未披露',publishedAt=published,updatedAt=updated,sourceRecordAt=p.get('s_aae396') or None,sourceCreatedAt=p.get('s_ctime') or None,expiresAt=p.get('s_aae398') or None,collectedAt=NOW,dateType='发布 / 维护日期',headCount=p.get('acb240') or None,occupation=occ,category=career.occupations[int(occ)]['name'],family=career.occupations[int(occ)]['group'],relatedMajors=career.occupations[int(occ)]['majors'],skills=career.keywords(title+' '+desc),description=desc,status='公开列表可见')
 r.update(sourceEducationCode=p.get('aac011'),sourceEmploymentCode=p.get('acb239'))
 return geo.apply(r,code=p.get('area') or p.get('aab301'))
if __name__=='__main__':
 first=fetch(1);pages=list(range(1,first['pages']+1));random.Random(20261003).shuffle(pages)
 rows={};dedup=set();processed=[];errors=0
 def accept(result):
  for p in result['rows']:
   r=normalize(p)
   if r:
    key=(r['company'],r['title'],tuple(r['workCities']))
    if r['url'] not in rows and key not in dedup:rows[r['url']]=r;dedup.add(key)
  processed.append({'name':'中国公共招聘网','url':result['url'],'count':len(result['rows']),'status':'已采集','collectedAt':NOW})
 def checkpoint():
  out={'rows':list(rows.values()),'sources':processed,'sampling':{'seed':20261003,'frame':'官方公开列表随机页序，页内所有记录按职业与日期筛选','listedRecords':first['total'],'listedPages':first['pages'],'pagesRead':len(processed)}}
  temporary=ROOT/'public-base-pool.tmp'
  temporary.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf8');temporary.replace(ROOT/'public-base-pool.json')
 # Parallel response handling retains the same global request spacing.
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
  pageIterator=iter(pages);futures={ex.submit(fetch,p) for p in [next(pageIterator) for _ in range(min(24,len(pages)))]}
  while futures:
   completed,_=concurrent.futures.wait(futures,return_when=concurrent.futures.FIRST_COMPLETED)
   for f in completed:
    futures.remove(f)
    try:accept(f.result());errors=0
    except Exception as e:
     errors+=1;print('Fetch failure',type(e).__name__,flush=True)
     if isinstance(e,ValueError) or errors>=5:raise
    if len(processed)%40==0:
     checkpoint();print(json.dumps({'pages':len(processed),'uniqueRecentBusinessRows':len(rows),'knownCities':sum(bool(r['workCities']) for r in rows.values())}),flush=True)
    try:futures.add(ex.submit(fetch,next(pageIterator)))
    except StopIteration:pass
   if len(rows)>=57000:
    for f in futures:f.cancel()
    break
 checkpoint()
