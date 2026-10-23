"""Public recruitment lists only. No login/captcha bypass. Bounded sequential requests per source."""
import json,re,time,hashlib,urllib.request,urllib.parse,datetime,collections,sys
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parent
NOW='2026-10-03'
old=json.loads((ROOT/'original-taxonomy.json').read_text(encoding='utf8'))
occupations=[{'id':str(i),'name':o['name'],'group':o['group'],'majors':o['majors']} for i,o in enumerate(old['occupations'])]
occupations[1]['name']='数据分析师';occupations[2]['name']='数据科学 / 量化研究';occupations[3]['name']='解决方案 / 管理咨询';occupations[13]['name']='品牌 / 市场营销';occupations[15]['name']='财务分析 / 财务BP';occupations[19]['name']='风险管理 / 风控';occupations[21]['name']='供应链 / 采购 / 物流'
extra=[('银行 / 理财 / 证券业务','商科专业',['金融学','保险学','经济学']),('国际贸易 / 外贸业务','商科专业',['国际经济与贸易','电子商务','工商管理']),('管理培训生 / 经营管理','商科专业',['工商管理','经济学','市场营销','人力资源管理']),('行政 / 综合管理','商科专业',['工商管理','人力资源管理']),('旅游 / 酒店管理','运营',['旅游管理','工商管理']),('销售 / 商务拓展','运营',['市场营销','工商管理','国际经济与贸易']),('AI训练 / 数据标注','AI应用',['信息管理与信息系统','大数据管理与应用','经济统计学','电子商务']),('智能体 / 提示词 / AI应用','AI应用',['信息管理与信息系统','大数据管理与应用','工商管理','电子商务'])]
for name,g,m in extra: occupations.append({'id':str(len(occupations)),'name':name,'group':g,'majors':m})
majors=[{'name':m['name'],'occs':[str(x) for x in m['occs']]+[o['id'] for o in occupations[22:] if m['name'] in o['majors']]} for m in old['majors'] if m['name']!='心理学']
rules=[(17,r'审计|税务|税筹|税控|audit|tax'),(15,r'财务分析|财务BP|FP&A|财务规划|finance business|financial analy'),(16,r'会计|出纳|财务|记账|accountant|accounting|finance'),(2,r'量化|数据科学|data scient|quantitative'),(18,r'投研|投资|证券研究|行业研究|经济研究|宏观研究|investment|equity research'),(19,r'风控|风险|合规|risk|compliance'),(22,r'银行|理财|信贷|金融|证券|保险|bank|wealth'),(20,r'人力|人事|招聘|HRBP|HRM|human resources|talent acquisition|recruit'),(21,r'供应链|采购|物流|仓储|supply chain|procurement|logistics'),(23,r'外贸|国际贸易|进出口|关务|跨境贸易|international trade'),(14,r'商业分析|经营分析|业务分析|战略|咨询|管理咨询|business analy|strategy|consult'),(1,r'数据分析|BI分析|data analy|business intelligence'),(0,r'(AI|大模型|人工智能).*(产品经理|产品负责人|产品策划|产品总监|产品助理|产品专员)|产品经理.*(AI|大模型)'),(4,r'(AI|大模型|人工智能).*运营'),(6,r'商业产品|商业化产品|广告产品|金融产品'),(7,r'产品运营|product operation'),(8,r'用户研究|用户体验分析|用研|user research'),(11,r'电商|跨境电商|店铺运营|平台运营|e.commerce'),(12,r'增长|growth'),(9,r'内容运营|新媒体|社媒|社区运营|content operation'),(10,r'用户运营|会员运营|客户运营|customer success'),(5,r'产品经理|产品策划|产品主管|产品专员|product manager'),(13,r'品牌|市场|营销|策划|marketing|brand'),(26,r'旅游|酒店|文旅|hotel|tourism'),(24,r'管培|储备干部|经营管理|运营管理|管理培训|management trainee'),(25,r'行政|综合管理|行政管理|administrat'),(27,r'销售|商务|业务拓展|BD经理|sales|business develop'),(7,r'运营|operation')]
def classify(title):
 if re.search(r'微生物.*研究|合成生物.*研究|化学.*研究|高分子.*研究|药物.*研究|合成研究员',title,re.I):return None
 if re.search(r'AI训练|人工智能训练|数据标注|标注员|大模型评测|AI评测|语料',title,re.I):return '28'
 if re.search(r'智能体|提示词|prompt|AI应用|人工智能应用',title,re.I):return '29'
 if re.search(r'(AI|大模型|人工智能).*(产品经理|产品负责人|产品策划|产品总监|产品助理|产品专员)|产品经理.*(AI|大模型)',title,re.I):return '0'
 if re.search(r'(AI|大模型|人工智能).*运营',title,re.I):return '4'
 if re.search(r'商业分析|经营分析|业务分析|business analy',title,re.I):return '14'
 if re.search(r'财务分析|财务BP|FP&A|financial analy',title,re.I):return '15'
 if re.search(r'商业产品|商业化产品|广告产品|金融产品',title,re.I):return '6'
 if re.search(r'产品经理|产品策划|产品主管|产品专员|product manager',title,re.I):return '5'
 if re.search(r'解决方案|solution|售前顾问',title,re.I) and not re.search(r'硬件|机械|电气',title):return '3'
 # Do not retain unrelated engineering, factory, medicine or manual roles just to inflate counts.
 if re.search(r'研发工程师|开发工程师|算法工程师|运维工程师|测试工程师|机械工程师|电气工程师|普工|司机|保安|保洁|主播|焊工|数控|技工|护理|医生|护士|厨师|软件工程师',title,re.I): return None
 for i,pattern in rules:
  if re.search(pattern,title,re.I): return str(i)
 return None
def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Accept':'application/json,text/html'})
 with urllib.request.urlopen(req,timeout=20) as res:return res.read()
def parse_salary(s):
 # Mixed units (8千-1.2万) and shared units (6-8千) are both common on 51job.
 m=re.search(r'(\d+(?:\.\d+)?)\s*([kK千万元]?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*([kK千万元])',s)
 if not m:return None,None,None
 factors={'k':1000,'K':1000,'千':1000,'万':10000,'元':1}
 lo=float(m[1])*factors[m[2] or m[4]];hi=float(m[3])*factors[m[4]]
 if '/年' in s or '年薪' in s:lo/=12;hi/=12
 if '/天' in s or '/小时' in s:return None,None,None
 n=re.search(r'(\d+)薪',s)
 return (lo,hi,int(n[1]) if n else None) if 0<lo<=hi else (None,None,None)
def keywords(t):return [label for label,p in [('Excel',r'excel'),('SQL',r'\bSQL\b|数据库'),('Python',r'python'),('Power BI',r'Power\s?BI'),('Tableau',r'tableau'),('财务分析',r'财务分析|财务报表'),('会计核算',r'会计|记账'),('审计',r'审计'),('英语',r'英语|英文|English'),('ERP',r'\berp\b|金蝶|用友'),('数据分析',r'数据分析'),('项目管理',r'项目管理'),('AI',r'人工智能|大模型|\bAI\b'),('沟通协作',r'沟通|协作'),('CFA',r'\bCFA\b'),('CPA',r'\bCPA\b|注册会计师')] if re.search(p,t,re.I)]
rows=[];seen=set();log=[]
def add(r):
 occ=classify(r['title'])
 if occ is None:return
 canonical=re.sub(r'^https://msearch\.51job','https://jobs.51job',r['url'])
 # Tencent domestic vacancy identity is in postId; it is not a tracking parameter.
 if 'careers.tencent.com' not in canonical:canonical=canonical.split('?')[0]
 key=(r['company'],r['title'],r['city'])
 if canonical in seen or key in seen:return
 seen.add(canonical);seen.add(key)
 r.update(id=hashlib.sha256(canonical.encode()).hexdigest()[:16],occupation=occ,category=occupations[int(occ)]['name'],family=occupations[int(occ)]['group'],relatedMajors=occupations[int(occ)]['majors'])
 for k,v in {'scale':'未披露','property':'未披露','hiringType':'未披露','majorRequirements':'未披露','headCount':None,'publishedAt':None,'dateType':'更新日期','collectedAt':NOW,'originSource':r['source']}.items():r.setdefault(k,v)
 r['skills']=list(dict.fromkeys(r.get('skills',[])+keywords(r['title']+' '+r.get('description',''))))
 rows.append(r)
def ncss(region=''):
 names=['会计','财务','审计','税务','出纳','金融','银行','理财','证券','保险','风控','投资','研究员','商业分析','数据分析','市场','营销','品牌','人力','人事','招聘','采购','供应链','物流','外贸','国际贸易','电商','运营','产品经理','管培','行政','旅游','酒店','销售','商务'] if not region else ['财务','金融','营销','人力','采购','运营','外贸','管培']
 if '--extended' in sys.argv:names=['产品经理','商业分析','数据分析','AI产品','人工智能','大模型','智能体','解决方案','用户研究','财务分析','量化','风控','投研','跨境电商','供应链','审计','税务','会计','证券','保险','银行','人事','品牌','市场','管理培训','管培生']
 if '--metro' in sys.argv:names=['','会计','财务','营销','运营','产品','数据分析','AI','金融','人力','采购','外贸','管培','审计','标注','提示词']
 for word in names:
  for page in range(1,6): # The source explicitly requires login beyond page 5; keep to its anonymous public pages.
   url='https://www.ncss.cn/student/jobs/jobslist/ajax/?'+urllib.parse.urlencode({'jobName':word,'recruitType':'0','limit':20,'offset':page,**({'areaCode':region} if region else {})})
   try:
    cache=ROOT/'raw'/f'ncss-{region+"-" if region else ""}{word}-{page}.json';b=cache.read_bytes() if cache.exists() else fetch(url);d=json.loads(b);cache.write_bytes(b)
    if not d.get('flag') or not isinstance(d.get('data'),dict):raise ValueError('Source did not return a public job list')
    items=d['data'].get('list',[])
    log.append({'name':'国家大学生就业服务平台','url':url,'count':len(items),'status':'已采集','collectedAt':NOW})
    for p in items:
     if str(p.get('recruitType'))=='1':continue
     lo=p.get('lowMonthPay');hi=p.get('highMonthPay');lo=float(lo)*1000 if lo and float(lo)>0 else None;hi=float(hi)*1000 if hi and float(hi)>0 else None
     if lo is None or hi is None or hi<lo:lo=hi=None
     date=lambda t:datetime.datetime.fromtimestamp(t/1000,datetime.timezone(datetime.timedelta(hours=8))).date().isoformat() if t else None
     title=p.get('jobName') or '';loc=p.get('areaCodeName') or '未披露';comp=p.get('recName') or '未披露'
     add(dict(title=title,company=comp,city=loc,location=loc,country='中国',industry='未披露',scale=p.get('recScale') or '未披露',property=p.get('recProperty') or '未披露',experience='未披露',education=p.get('degreeName') or '未披露',salaryText=f'{lo/1000:g}–{hi/1000:g}千元/月' if lo else '面议 / 未披露',salaryMin=lo,salaryMax=hi,salaryMonths=None,updatedAt=date(p.get('updateDate')),publishedAt=date(p.get('publishDate')),dateType='更新日期',source='国家大学生就业服务平台',originSource=p.get('sourcesNameCh') or '国家大学生就业服务平台',sourceUrl='https://www.ncss.cn/student/jobs/index.html',url=f'https://www.ncss.cn/student/jobs/{p["jobId"]}/detail.html',skills=[],majorRequirements=p.get('major') or '专业不限',headCount=p.get('headCount') if p.get('headCount') else None,hiringType='未披露',description='平台列表明示专业要求：'+(p.get('major') or '专业不限')+'。详细职责和招聘类型请到原始岗位页核实。',status='公开列表可见',geographyLevel='省市原文'))
    print('NCSS',region,word,page,len(items),'retained',len(rows),flush=True)
    pg=d['data'].get('pagenation',{});total=pg.get('total',10)
    if not items or page>=total:break
    time.sleep(.35)
   except Exception as e:
    log.append({'name':'国家大学生就业服务平台','url':url,'count':0,'status':'获取失败 / 访问受限','collectedAt':NOW});print('NCSS STOP',str(e),flush=True);return
def f51():
 domains=['mcaiwukuaiji','mjinrong','mxingzheng','myunying','mcaigou','mwuliucangchu','mxiaoshou']
 cities=['','beijing/','shanghai/','guangzhou/','shenzhen/','wuhan/','hangzhou/','chengdu/','nanjing/','suzhou/']
 failures=0
 for domain in domains:
  for city in cities:
   url=f'https://{domain}.51job.com/{city}'
   try:
    b=fetch(url);(ROOT/'raw'/f'51job-{domain}-{city.replace("/","") or "all"}.html').write_bytes(b)
    soup=BeautifulSoup(b,'html.parser');boxes=soup.select('a.e[href*="/jobs/"]');count=0
    for box in boxes:
     txt=lambda sel:box.select_one(sel).get_text(' ',strip=True) if box.select_one(sel) else ''
     title=txt('.jname');company=txt('.cname');location=txt('.area');sal=txt('.sal');labels=[x.get_text(' ',strip=True) for x in box.select('.tag>span')];lo,hi,n=parse_salary(sal)
     prop=next((x for x in ['外资（欧美）','外资（非欧美）','国企','民营','合资','已上市','创业公司','非营利组织','事业单位'] if company.endswith(' '+x)),None)
     if prop:company=company[:-len(prop)].strip()
     exp=next((x for x in labels if re.search(r'年|经验|应届',x)),'未披露');edu=next((x for x in labels if re.search('本科|大专|硕士|博士|中专|中技|高中|学历',x)),'未披露')
     if not title or not company:continue
     add(dict(title=title,company=company,city=location.split('·')[0] or '未披露',location=location,country='中国',industry='未披露',property=prop or '未披露',experience=exp,education=edu,salaryText=sal or '未披露',salaryMin=lo,salaryMax=hi,salaryMonths=n,updatedAt=None,dateType='未披露',url=box['href'].split('?')[0],source='前程无忧',sourceUrl=url,skills=keywords(' '.join(labels)),description='公开列表标签：'+'、'.join(labels)+'。完整要求以原招聘页面为准。',status='公开列表可见',hiringType='实习' if '实习' in title else '校招 / 应届' if re.search('应届|校招|管培',title) else '未披露'));count+=1
    log.append({'name':'前程无忧','url':url,'count':count,'status':'已采集' if count else '无可解析岗位','collectedAt':NOW});print('51job',domain,city,count,'retained',len(rows),flush=True)
    failures=0 if count else failures+1
    # A city route may contain no jobs; other listed city routes remain public.
    time.sleep(.35)
   except Exception as e:
    log.append({'name':'前程无忧','url':url,'count':0,'status':'获取失败 / 访问受限','collectedAt':NOW});print('51job source error',str(e),flush=True);failures+=1;break
  if failures>=4:break
if __name__=='__main__':
 bundle=json.loads((ROOT/'dist/jobs.json').read_text(encoding='utf8'))
 for r in bundle['rows']:add(r)
 print('Previously retained business records',len(rows),flush=True)
 if '--clean-only' in sys.argv:pass
 elif '--metro' in sys.argv:
  for region in ['440100','440300','440600','441900','440400','330100','330200','330300','320100','320500','320200','320600','510100','420100','370100','370200','430100','350100','350200','340100','130100','130200','140100','210100','210200','220100','230100','360100','410100','450100','450200','460100','520100','530100','610100','620100','640100','650100']:ncss(region)
  ncss()
 elif '--extended' in sys.argv:
  for region in ['', '110000','310000','440000','330000','320000','420000','510000','370000','430000','340000','350000','500000','120000','130000','140000','150000','210000','220000','230000','360000','410000','450000','460000','520000','530000','610000','620000','630000','640000','650000']:ncss(region)
 elif '--regional' in sys.argv:
  for region in ['110000','310000','440000','330000','320000','420000','510000','370000','430000','340000','350000','500000']:ncss(region)
 else:ncss()
 if '--ncss-only' not in sys.argv:f51()
 # Record observed source dates without presenting update frequency as market growth.
 bundle.update(rows=rows,sources=bundle['sources']+log,collectedAt=NOW,taxonomy={'majors':majors,'occupations':occupations,'tracks':[{'name':t['name'],'occupations':[str(x) for x in t['occupations']]} for t in old['tracks']]})
 bundle['methodology'].update(scope='仅保留经管专业对应方向的公开招聘便利样本；平台排名与覆盖不均，不代表全市场。剔除无关研发、制造与服务工种。',salary='税前月薪区间中点统计，未披露或按日计薪排除；月薪不包含额外薪数。前程无忧兼容千与万的混合单位。',majors='专业与职业方向映射参照原工作台，仅供探索；不代表企业允许该专业投递。企业明示专业要求另列。',dates='原始发布与更新时间分别保留；按更新/发布日期筛选可以选择保留未知日期。更新时间分布不代表市场景气。',geography='国家大学生平台部分列表只给省份，按原文保留，不推断城市；细粒度地区来自其他公开列表。')
 (ROOT/'dist/jobs.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')),encoding='utf8')
 summary={'rows':len(rows),'salary':sum(r['salaryMin'] is not None for r in rows),'sources':dict(collections.Counter(r['source'] for r in rows)),'occupations':dict(collections.Counter(r['category'] for r in rows))}
 (ROOT/'business-collection-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(summary,ensure_ascii=False),flush=True)
