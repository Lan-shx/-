import collections,datetime,gzip,hashlib,importlib.util,json,random,re,time
from pathlib import Path
import geography as geo
ROOT=Path(__file__).resolve().parent;NOW='2026-10-03';START='2025-10-03'
spec=importlib.util.spec_from_file_location('career',ROOT/'expand-business.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
original=ROOT/'raw/site-input-base.json'
def read_json(path):
 for attempt in range(10):
  try:return json.loads(path.read_text(encoding='utf8'))
  except json.JSONDecodeError:
   if attempt==9:raise
   time.sleep(.2)
if not original.exists():original.write_bytes((ROOT/'dist/jobs.json').read_bytes())
b=json.loads(original.read_text(encoding='utf8'));candidate=[];exclusions=collections.Counter()
if (ROOT/'ncss-panel-pool.json').exists():
 supplemental=read_json(ROOT/'ncss-panel-pool.json');b['rows']+=supplemental['rows'];b['sources']+=supplemental['sources']
for r in b['rows']:
 if r['country']!='中国' or re.search(r'^(香港|澳门|台湾)(?:省|特别行政区|市|$)',r.get('location','')):exclusions['非大陆']+=1;continue
 if r['source']=='国家大学生就业服务平台':
  p=ROOT/'raw/ncss-details'/(r['url'].split('/')[-2]+'.json')
  if p.exists():
   detail=read_json(p);r['listLocation']=r.get('location');r['location']=' / '.join(detail['locations']);r['description']=detail['description'] or r['description'];r['hiringType']=detail['hiringType'];r['skills']=list(set(r['skills']+c.keywords(r['description'])))
 geo.apply(r)
 candidate.append(r)
if (ROOT/'public-base-pool.json').exists():
 p=read_json(ROOT/'public-base-pool.json')
 for r in p['rows']:
  code=re.search(r'代码 (\d{6})',r.get('geoEvidence',''))
  if code and code[1][:2] in ['71','81','82']:exclusions['非大陆']+=1;continue
  geo.apply(r,code=code[1] if code else None);candidate.append(r)
 b['sources']+=p['sources'];frame=p['sampling']
else:frame={}
if (ROOT/'bytedance-pool.json').exists():
 p=read_json(ROOT/'bytedance-pool.json')
 for j in p['rows']:
  occ=c.classify(j['title'])
  if not occ:continue
  addresses=j.get('job_post_info',{}).get('address_list',[]);cs=[a['city']['name'] for a in addresses if a.get('country',{}).get('name')=='中国大陆' and a.get('city')]
  if not cs:continue
  date=datetime.datetime.fromtimestamp(j['publish_time']/1000,datetime.timezone(datetime.timedelta(hours=8))).date().isoformat() if j.get('publish_time') else None
  url=f'https://jobs.bytedance.com/experienced/position/{j["id"]}/detail';text=(j.get('description') or '')+'\n'+(j.get('requirement') or '')
  degree=re.search(r'(博士|硕士|本科|大专)(?:及以上|以上)?(?:学历|学位)',j.get('requirement') or '');edu=degree[0] if degree else '未披露'
  r=dict(id=hashlib.sha256(url.encode()).hexdigest()[:16],title=j['title'],company='字节跳动',url=url,source='字节跳动招聘',sourceUrl=p['source'],originSource='企业官方招聘',country='中国',location=' / '.join(a.get('name','') for a in addresses if a.get('country',{}).get('name')=='中国大陆'),city=cs[0],salaryMin=None,salaryMax=None,salaryMonths=None,salaryText='未披露',industry='互联网与科技',education=edu,experience='未披露',property='未披露',scale='未披露',hiringType=j.get('recruit_type',{}).get('name') or '未披露',majorRequirements='未披露',description=text,skills=c.keywords(text),publishedAt=date,updatedAt=None,collectedAt=NOW,status='官网公开列表可见',headCount=None,occupation=occ,category=c.occupations[int(occ)]['name'],family=c.occupations[int(occ)]['group'],relatedMajors=c.occupations[int(occ)]['majors'])
  geo.apply(r);r['workCities']=list(dict.fromkeys(cs));r['cityGroups']=list(dict.fromkeys(city if city in geo.major else '其他大陆城市' for city in cs));r['geoEvidence']='招聘官网结构化城市与大陆地址';candidate.append(r)
 b['sources'].append({'name':'字节跳动招聘','url':p['source'],'count':len(p['rows']),'status':'官网匿名公开列表，正常页面分页','collectedAt':NOW})
out=[];seen=set()
for r in candidate:
 if re.search('普工|司机|保安|保洁|焊工|数控|护理|医生|护士|厨师|办公室清洁',r['title']):exclusions['无关工种']+=1;continue
 dates=[r[k] for k in ['publishedAt','updatedAt'] if r.get(k)]
 if not dates:exclusions['发布日期与更新日期均未知']+=1;continue
 if any(d>NOW for d in dates):exclusions['原始日期在未来']+=1;continue
 if not any(START<=d<=NOW for d in dates):exclusions['超出近一年']+=1;continue
 key=(r['company'],r['title'],tuple(sorted(r.get('workCities',[]))))
 if r['url'] in seen or key in seen:exclusions['重复']+=1;continue
 seen.update([r['url'],key]);r['employmentType']='工作性质不限' if r.get('hiringType') in ['不限','均可'] else r.get('hiringType') if r.get('hiringType') in ['全职','兼职','实习','临时','小时工'] else '未披露';r['hiringChannel']='社招' if r.get('source')=='字节跳动招聘' else '校招' if re.search('校园招聘|校招',r['title']) else '未披露';out.append(r)
poolCount=len(out);out=sorted(out,key=lambda r:r['url']);rng=random.Random(20261003)
if len(out)>=50000:out=rng.sample(out,50000)
config={'majorCities':sorted(geo.major),'allCities':sorted(geo.cities),'districts':{k:sorted(v) for k,v in geo.districts.items() if len(v)==1},'scope':'大陆求职重点城市名单；其余已明确地级就业地区合并，省份和未知城市不充作城市。'}
(ROOT/'dist/geography.json').write_text(json.dumps(config,ensure_ascii=False,separators=(',',':')),encoding='utf8')
b.update(rows=out,collectedAt=NOW,geography=json.loads((ROOT/'dist/geography.json').read_text(encoding='utf8')),sampling={'seed':20261003,'target':50000,'candidateCount':poolCount,'sampleCount':len(out),'method':'可核验采集池内不放回简单随机抽样；非全市场等概率样本','dateFrom':START,'dateTo':NOW,'dateBasis':'原始发布或维护日期至少一个在范围内；本次采集日期不代替岗位日期','publicFrame':frame,'exclusions':dict(exclusions)})
b['methodology']['scope']='大陆经管职业方向、产品与AI应用公开招聘记录。近一年以原始发布/维护日期核对，采集池内不放回随机抽样；来源、地区与公开覆盖具有偏差，不代表全市场等概率随机抽样。'
b['methodology']['geography']='岗位原文明确城市或平台行政区代码确认城市；详情补齐省份级列表。重点中大就业城市独立选择，其余已明确大陆城市合并为一个选项。未明确城市默认不参与分析，可以单独包含。多城市岗位可计入多个城市，城市分组数量不可相加。'
b['methodology']['dates']='发布日期、维护日期、采集日期、截止日期分别保存。浏览器按大陆当前日期核对明确截止日期，已明确截止与未明确截止记录可分别筛选；未明确截止不保证当前仍在招。'
data=ROOT/'dist/data';data.mkdir(exist_ok=True);chunks=[]
for start in range(0,len(out),5000):
 name=f'jobs-{start//5000:02d}.json';payload=json.dumps(out[start:start+5000],ensure_ascii=False,separators=(',',':')).encode('utf8')
 (data/name).write_bytes(payload);(data/(name+'.gz')).write_bytes(gzip.compress(payload,compresslevel=9,mtime=0))
 chunks.append({'jsonPath':'data/'+name,'gzipPath':'data/'+name+'.gz','rowCount':len(out[start:start+5000]),'sha256':hashlib.sha256(payload).hexdigest()})
# Remove only stale generated chunks from this checked output folder.
expected={x['jsonPath'].split('/')[-1] for x in chunks}|{x['gzipPath'].split('/')[-1] for x in chunks}
for file in data.glob('jobs-*.json*'):
 if file.name not in expected:file.unlink()
manifest={k:v for k,v in b.items() if k!='rows'};manifest.update(chunks=chunks,rowCount=len(out))
(ROOT/'dist/jobs.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(json.dumps({'candidateCount':poolCount,'rows':len(out),'sources':dict(collections.Counter(r['source'] for r in out)),'knownCity':sum(bool(r.get('workCities')) for r in out),'expired':sum(bool(r.get('expiresAt')) and r['expiresAt']<NOW for r in out),'exclusions':dict(exclusions)},ensure_ascii=False))
