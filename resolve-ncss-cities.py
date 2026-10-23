import concurrent.futures,hashlib,html,json,re,time,threading,urllib.request,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
cache=ROOT/'raw'/'ncss-details';cache.mkdir(exist_ok=True)
rateLock=threading.Lock();next_request=0
def fetch(r):
 global next_request
 job=r['url'].split('/')[-2];p=cache/(job+'.json')
 if p.exists():
  try:return json.loads(p.read_text(encoding='utf8'))
  except json.JSONDecodeError:pass
 with rateLock:
  delay=max(0,next_request-time.monotonic());next_request=max(next_request,time.monotonic())+.25
 time.sleep(delay)
 try:
  text=urllib.request.urlopen(urllib.request.Request(r['url'],headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read().decode('utf8')
  def plain(t):return html.unescape(re.sub('<[^>]+>','',t)).strip()
  locs=[plain(x) for x in re.findall(r'<div[^>]*class="site-tag"[^>]*>(.*?)</div>',text,re.S)]
  actual=re.search(r'id="jobName"[^>]*>(.*?)</li>',text,re.S)
  if not actual or plain(actual[1])!=r['title']:return None
  kind=re.search(r'<li>\[<span>(.*?)</span>\]</li>',text,re.S)
  body=re.search(r'<div class="mainContent mainContent-geshi">(.*?)</div>',text,re.S)
  result={'url':r['url'],'title':r['title'],'locations':locs,'hiringType':plain(kind[1]) if kind else '未披露','description':plain(body[1]) if body else '', 'responseHash':hashlib.sha256(text.encode()).hexdigest(),'collectedAt':'2026-10-03'}
  temporary=p.with_suffix('.tmp');temporary.write_text(json.dumps(result,ensure_ascii=False),encoding='utf8');temporary.replace(p);return result
 except Exception:return None
if __name__=='__main__':
 b=json.loads((ROOT/'raw/site-input-base.json').read_text(encoding='utf8'));a=[r for r in b['rows'] if r['source']=='国家大学生就业服务平台'];done=failed=0
 if '--panel' in sys.argv:
  existing={r['url'] for r in a};p=json.loads((ROOT/'ncss-panel-pool.json').read_text(encoding='utf8'));a=[r for r in p['rows'] if r['url'] not in existing and any('2025-10-03'<=r.get(k,'')<= '2026-10-03' for k in ['publishedAt','updatedAt'] if r.get(k))]
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
  for result in ex.map(fetch,a):
   done+=1;failed+=result is None
   if done%200==0:print(json.dumps({'resolved':done-failed,'attempted':done,'failed':failed}),flush=True)
 print('Complete',done,failed,flush=True)
