"""City identity derives from explicit locations or public administrative codes."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
areas=json.loads((ROOT/'administrative-areas.json').read_text(encoding='utf8'))
bycode={x['code']:x['name'] for x in areas}
municipal={'11':'北京','12':'天津','31':'上海','50':'重庆'}
major=set('北京 上海 天津 重庆 广州 深圳 佛山 东莞 珠海 中山 惠州 江门 汕头 湛江 杭州 宁波 温州 嘉兴 绍兴 金华 台州 湖州 南京 苏州 无锡 常州 南通 扬州 徐州 盐城 镇江 泰州 济南 青岛 烟台 潍坊 临沂 淄博 济宁 威海 泰安 石家庄 唐山 保定 邯郸 廊坊 秦皇岛 沧州 太原 大同 运城 沈阳 大连 鞍山 长春 吉林 哈尔滨 大庆 齐齐哈尔 呼和浩特 包头 鄂尔多斯 武汉 襄阳 宜昌 荆州 长沙 株洲 湘潭 衡阳 郑州 洛阳 南阳 新乡 许昌 合肥 芜湖 阜阳 蚌埠 福州 厦门 泉州 漳州 莆田 南昌 赣州 九江 上饶 成都 绵阳 宜宾 南充 德阳 贵阳 遵义 昆明 曲靖 西安 咸阳 宝鸡 兰州 西宁 银川 乌鲁木齐 南宁 柳州 桂林 海口 三亚 拉萨'.split())
provinces=set('北京 天津 河北 山西 内蒙古 辽宁 吉林 黑龙江 上海 江苏 浙江 安徽 福建 江西 山东 河南 湖北 湖南 广东 广西 海南 重庆 四川 贵州 云南 西藏 陕西 甘肃 青海 宁夏 新疆'.split())
cities={c[:-1] if c.endswith('市') else c for k,c in bycode.items() if k.endswith('00') and c not in ['市辖区','县'] and int(k[:2])<71}
cities.update(municipal.values())
cities.update(c.removesuffix('市') for k,c in bycode.items() if k[2:4]=='90' and c.endswith('市') and int(k[:2])<71)
districts={}
for code,name in bycode.items():
 city=municipal.get(code[:2]) or bycode.get(code[:4]+'00','').removesuffix('市')
 if city in cities and not code.endswith('00'):districts.setdefault(name,set()).add(city)
def city_for_code(code):
 code=str(code or '')[:6]
 if len(code)!=6 or code[:2] in ['71','81','82']:return None
 if code[:2] in municipal:return municipal[code[:2]]
 if code[2:4]=='90' and bycode.get(code,'').endswith('市'):return bycode[code].removesuffix('市')
 name=bycode.get(code[:4]+'00','').removesuffix('市')
 if not name and bycode.get(code,'').endswith('市'):name=bycode[code].removesuffix('市')
 return name if name in cities or name in {x.removesuffix('市') for x in bycode.values() if x.endswith('市')} else None
def explicit_cities(text):
 text=str(text or '');found=[]
 if re.search(r'^(香港|澳门|台湾)(?:省|特别行政区|市|$)',text):return []
 # Require full city names in addresses to distinguish e.g. 吉林 province from 吉林市.
 for c in sorted(cities,key=len,reverse=True):
  if c+'市' in text or text==c and (c not in provinces or c in municipal.values()) or text.startswith(c+'·') or text.startswith(c+'-'):found.append(c)
 if not found and text in districts and len(districts[text])==1:found=list(districts[text])
 return list(dict.fromkeys(found))
def apply(r,code=None,location=None):
 raw=location if location is not None else r.get('location') or r.get('city','')
 r.setdefault('rawLocation',raw);r.setdefault('rawCity',r.get('city',''))
 if code:
  city=city_for_code(code);cs=[city] if city else explicit_cities(raw);r['geoEvidence']='招聘平台行政区代码 '+str(code) if city or not cs else '省级代码下的岗位原文明确城市'
 else:cs=explicit_cities(raw);r['geoEvidence']='岗位原文明确城市'
 r['workCities']=cs
 if not cs:r['geoEvidence']='未确认城市；'+r['geoEvidence']
 r['city']=cs[0] if len(cs)==1 else '多城市岗位' if cs else '城市未明确'
 r['cityGroups']=list(dict.fromkeys(c if c in major else '其他大陆城市' for c in cs))
 r['geographyLevel']='city' if cs else 'unknown'
 r['geoGroup']=r['cityGroups'][0] if len(r['cityGroups'])==1 else '多城市岗位' if cs else '城市未明确'
 return r
