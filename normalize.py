import json,hashlib
from pathlib import Path
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parent
path=root/'dist/jobs.json'
bundle=json.loads(path.read_text(encoding='utf8'))
mapping={}
for city,districts in {
 '上海':'浦东新区 青浦区 闵行区 静安区 徐汇区 长宁区 黄浦区 虹口区 杨浦区 嘉定区',
 '深圳':'福田区 龙岗区 南山区 宝安区',
 '杭州':'余杭区 钱塘区 萧山区 临平区 拱墅区 富阳区 滨江区',
 '广州':'黄埔区 天河区 海珠区 番禺区 南沙区 增城区 花都区',
 '北京':'海淀区 大兴区 丰台区 东城区 昌平区',
 '武汉':'江岸区 江夏区 武昌区 洪山区',
 '成都':'郫都区 龙泉驿区 锦江区',
 '重庆':'渝北区 南岸区',
 '天津':'滨海新区 南开区 西青区',
 '南京':'雨花台区 栖霞区 玄武区 秦淮区',
 '厦门':'翔安区 思明区 集美区',
 '佛山':'顺德区 高明区 南海区',
 '江门':'蓬江区 新会区',
 '长沙':'岳麓区',
 '宁波':'北仑区',
 '无锡':'新吴区',
 '香港':'中国香港',
}.items():
 for district in districts.split(): mapping[district]=city
overseas={'非洲':'海外地区','阿联酋':'阿联酋','印度尼西亚':'印度尼西亚','亚洲':'未披露','科威特':'科威特','肯尼亚':'肯尼亚','坦桑尼亚':'坦桑尼亚','南美洲':'海外地区','欧洲':'海外地区','芬兰':'芬兰','巴西':'巴西','韩国':'韩国'}
# Restore source experience text that explicitly says 不限, which is not missing.
experiences={}
for p in (root/'raw').glob('liepin-*.html'):
 soup=BeautifulSoup(p.read_bytes(),'html.parser')
 for box in soup.select('.job-detail-box'):
  a=box.select_one('a[data-jobid]');labels=box.select('.job-labels-box>span')
  if a and labels:
   first=labels[0].get_text(strip=True)
   if first in ['不限','应届生']: experiences[a['href'].split('?')[0]]=first
dedup=set();out=[]
for r in bundle['rows']:
 r['rawCity']=r['city'];r['city']=mapping.get(r['city'],r['city'])
 if r['source']=='猎聘':
  r['country']=overseas.get(r['rawCity'],r['country'])
  r['experience']=experiences.get(r['url'],r['experience'])
 key=(r['company'],r['title'],r['city'])
 if key in dedup:continue
 dedup.add(key);out.append(r)
bundle['rows']=out
bundle['methodology']['geography']='明确的行政区合并到所在城市，原始地区保留；普陀区、朝阳区、白云区等歧义地区不推断归属。海外地区按原文标记。'
path.write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(json.dumps({'rows':len(out),'salary':sum(r['salaryMin'] is not None for r in out),'china':sum(r['country']=='中国' for r in out)},ensure_ascii=False))
