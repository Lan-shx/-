import collect as c
import json,time
bundle=json.loads((c.ROOT/'dist/jobs.json').read_text(encoding='utf-8'))
for row in bundle['rows']: c.add(row)
slugs=['546','sheji','xiaoshoukefu','shichanggongguanguanggaohuizhan','renlicaiwuxingzheng','fawu','jinronggl','qiche','fdcjianzhuwuye','shengchanzhizao','yiliaohulishengwuzhiyao','jiaoyupeixun','shenghuofuwu','nengyuankuangchanhuanbao','yingshimeiti','zixunfanyi','xiangmuguanli','450','gongyinglianwuliuyunshu','gongwuyuannonglinmuyuqt','dianzitxinbandaot']
for s in ['shujufenxi','yunying','kuaiji','renliziyuan','xiaoshou','gongyinglian','caigou','fengkong','shujukexuejia','java','python','dianshangyunying','xingzheng','546','jinronggl']:
    slugs.extend([s+'/pn'+str(n) for n in range(1,5)])
logs=[]
for s in slugs:
    batch,log=c.liepin_page(s.replace('/','%2F')) if False else ([],{})
    # Use original URL paths; raw filenames sanitize path separators separately.
    try:
        original=c.ROOT
        batch,log=c.liepin_page(s)
    except Exception: batch=[]
    for r in batch: c.add(r)
    if log: logs.append(log)
    print(s,len(batch),len(c.rows),flush=True); time.sleep(.25)
bundle['rows']=c.rows; bundle['sources'].extend(logs)
(c.ROOT/'dist/jobs.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Total',len(c.rows),'Salary',sum(r['salaryMin'] is not None for r in c.rows),flush=True)
