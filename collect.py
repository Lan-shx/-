import json, re, time, hashlib, urllib.request, urllib.parse
from pathlib import Path
from bs4 import BeautifulSoup
ROOT = Path(__file__).resolve().parent
NOW = '2026-10-03'
rows, sources, seen = [], [], set()
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Accept':'application/json,text/html'})
    with urllib.request.urlopen(req,timeout=25) as r: return r.read()
def category(title, fallback='其他职能'):
    for label, pattern in [('数据分析','数据分析|商业分析|经营分析|BI分析|data analy|business analy'),('算法与AI','算法|大模型|机器学习|AI|人工智能|algorithm'),('产品','产品|product'),('运营','运营|operation'),('财务与金融','财务|会计|审计|投资|金融|风控|税务|证券|finance'),('市场与销售','市场|销售|营销|商务|品牌|sales|marketing'),('人力与行政','人力|人事|招聘|行政|HR|human'),('供应链','采购|物流|供应链|procure|supply'),('研发与技术','工程师|开发|研发|测试|运维|安全|engineer|developer'),('设计','设计|美术|design')]:
        if re.search(pattern,title,re.I): return label
    return fallback
def skills(text):
    return [x for x,p in [('SQL',r'\bSQL\b|数据库'),('Python',r'Python'),('Excel',r'Excel'),('Power BI',r'Power\s?BI'),('Tableau',r'Tableau'),('Java',r'\bJava\b'),('C++',r'C\+\+'),('AI',r'人工智能|大模型|\bAI\b'),('数据建模',r'建模|模型'),('数据分析',r'数据分析'),('项目管理',r'项目管理'),('英语',r'英语|English'),('沟通协作',r'沟通|协作')] if re.search(p,text,re.I)]
def add(row):
    key=(row['company'],row['title'],row['city'])
    if row['url'] in seen or key in seen: return
    seen.add(row['url']); seen.add(key)
    row['id']=hashlib.sha256(row['url'].encode()).hexdigest()[:16]
    row['collectedAt']=NOW
    rows.append(row)
def salary(s):
    m=re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*([kK万千])',s)
    if not m: return None,None,None
    factor={'k':1000,'K':1000,'万':10000,'千':1000}[m[3]]
    lo,hi=float(m[1])*factor,float(m[2])*factor
    if '/年' in s or '年薪' in s: lo/=12; hi/=12
    n=re.search(r'(\d+)薪',s)
    return lo,hi,int(n[1]) if n else None
def liepin_page(slug):
    url=f'https://www.liepin.com/career/{slug}/'
    try:
        b=get(url); (ROOT/'raw'/f'liepin-{slug.replace("/","-")}.html').write_bytes(b)
        soup=BeautifulSoup(b,'html.parser'); batch=[]
        for box in soup.select('.job-detail-box'):
            a=box.select_one('a[data-jobid]'); title=box.select_one('.job-title-box > .ellipsis-1'); city=box.select_one('.job-dq-box .ellipsis-1'); comp=box.select_one('.company-name'); sal=box.select_one('.job-salary')
            if not all([a,title,comp]): continue
            t=title.get_text(strip=True); c=city.get_text(strip=True) if city else '未披露'; s=sal.get_text(strip=True) if sal else '面议'; lo,hi,n=salary(s)
            labels=[x.get_text(strip=True) for x in box.select('.job-labels-box > span')]; tags=[x.get_text(strip=True) for x in box.select('.company-tags-box span')]
            exp=next((x for x in labels if '年' in x or '经验' in x),'未披露'); edu=next((x for x in labels if re.search('本科|硕士|博士|大专|学历|高中|中专',x)),'未披露')
            batch.append(dict(title=t,company=comp.get_text(strip=True),city=c.split('-')[0],location=c,country='中国',category=category(t),industry=tags[0] if tags else '未披露',scale=next((x for x in tags if '人' in x),'未披露'),experience=exp,education=edu,salaryText=s,salaryMin=lo,salaryMax=hi,salaryMonths=n,updatedAt=None,dateType='未披露',url=a['href'].split('?')[0],source='猎聘',sourceUrl=url,skills=skills(t),description='岗位要求与当前招聘状态请前往原招聘页面核实。',status='公开列表可见'))
        return batch,dict(name='猎聘',url=url,count=len(batch),status='已采集' if batch else '无可解析记录',collectedAt=NOW)
    except Exception as e: return [],dict(name='猎聘',url=url,count=0,status='获取失败',reason=str(e)[:120],collectedAt=NOW)
def tencent():
    base='https://careers.tencent.com/tencentcareer/api/post/Query?language=zh-cn&pageSize=100&pageIndex='
    total=0
    for page in range(1,26):
        try:
            b=get(base+str(page)); data=json.loads(b)['Data']; (ROOT/'raw'/f'tencent-{page}.json').write_bytes(b)
            posts=data.get('Posts',[])
            for p in posts:
                title=p['RecruitPostName']; desc=p.get('Responsibility',''); updated=p.get('LastUpdateTime',''); m=re.search(r'(\d{4})年(\d+)月(\d+)日',updated)
                add(dict(title=title,company=p.get('ComName') or '腾讯',city=p.get('LocationName') or '未披露',location=p.get('LocationName') or '未披露',country=p.get('CountryName') or '未披露',category=category(title,p.get('CategoryName') or '其他职能'),industry='互联网与科技',scale='未披露',experience=p.get('RequireWorkYearsName') or '未披露',education='未披露',salaryText='未披露',salaryMin=None,salaryMax=None,salaryMonths=None,updatedAt=f'{m[1]}-{int(m[2]):02}-{int(m[3]):02}' if m else None,dateType='更新日期',url=p.get('PostURL','').replace('http://','https://') or f'https://careers.tencent.com/jobdesc.html?postId={p["PostId"]}',source='腾讯招聘',sourceUrl='https://careers.tencent.com/',skills=skills(title+' '+desc),description=desc,status='官方列表可见' if p.get('IsValid') else '状态待核验'))
            total+=len(posts); print(f'Tencent page {page}: {len(posts)}',flush=True)
            if not posts or page*100>=data['Count']: break
            time.sleep(.25)
        except Exception as e:
            print('Tencent error',str(e),flush=True); break
    sources.append(dict(name='腾讯招聘',url='https://careers.tencent.com/',count=total,status='已采集',collectedAt=NOW))
if __name__=='__main__':
    (ROOT/'raw').mkdir(exist_ok=True); (ROOT/'dist').mkdir(exist_ok=True)
    tencent()
    slugs=['shujufenxi','chanpinjingli','yunying','caiwu','kuaiji','shenji','renliziyuan','shichang','xiaoshou','gongyinglian','caigou','jinrong','fengkong','touzi','shangyefenxi','suanfagongchengshi','shujukexuejia','java','python','xinmeitiyunying','dianshangyunying','wuliu','xingzheng','shuiwu','zhengquan']
    # Bounded public-list requests; no login, captcha or access-control bypass.
    for slug in slugs:
        batch,log=liepin_page(slug)
        for r in batch: add(r)
        sources.append(log); print(f'Liepin {slug}: {len(batch)}',flush=True); time.sleep(.4)
    for name,url in [('智联招聘','https://www.zhaopin.com/hangzhou/shujufenxishi/'),('BOSS直聘','https://www.zhipin.com/web/geek/job?query=数据分析师'),('拉勾','https://www.lagou.com/wn/jobs?kd=数据分析师')]:
        try:
            b=get(urllib.parse.quote(url,safe=':/?=&')); (ROOT/'raw'/f'{name}.html').write_bytes(b)
            sources.append(dict(name=name,url=url,count=0,status='未获取可核验结构化岗位',collectedAt=NOW))
        except Exception as e: sources.append(dict(name=name,url=url,count=0,status='访问受限或获取失败',collectedAt=NOW))
    bundle=dict(collectedAt=NOW,rows=rows,sources=sources,methodology={'dedup':'原始链接以及公司+岗位名称+城市去重','salary':'税前月薪区间中点的中位数；未披露排除，不将额外薪数折算进月薪','scope':'公开可访问列表的便利样本，不代表全市场；腾讯为单一企业，猎聘列表存在高薪与推荐排序偏差','dates':'采集日期不等于发布日期；腾讯提供更新时间，猎聘列表日期未披露','history':'单次快照，不能计算市场环比、同比、真实薪资成长或景气趋势','supply':'没有求职人数和投递人数，不能计算竞争指数或供需错配'})
    (ROOT/'dist'/'jobs.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (ROOT/'collection-summary.json').write_text(json.dumps({k:v for k,v in bundle.items() if k!='rows'},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'total':len(rows),'salary':sum(r['salaryMin'] is not None for r in rows),'sources':len(set(r['source'] for r in rows))}),flush=True)
