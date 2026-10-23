from pathlib import Path
import json,gzip,hashlib,collections,statistics,urllib.parse
base=Path('public');b=json.loads((base/'jobs.json').read_text(encoding='utf-8'));rows=[]
for c in b['chunks']:
 raw=(base/c['jsonPath']).read_bytes();assert gzip.decompress((base/c['gzipPath']).read_bytes())==raw;assert hashlib.sha256(raw).hexdigest()==c['sha256'];part=json.loads(raw);assert len(part)==c['rowCount'];rows.extend(part)
assert len(rows)==b['rowCount']==b['sampling']['sampleCount'];assert len({r['id'] for r in rows})==len(rows);assert len({(r['company'],r['title'],tuple(sorted(r['workCities']))) for r in rows})==len(rows)
for r in rows:
 assert r['title'] and r['company'];assert urllib.parse.urlparse(r['url']).scheme in ('http','https');a,z=r.get('salaryMin'),r.get('salaryMax');assert (a is None)==(z is None)
 if a is not None:assert 0<=a<=z
 dates=[r.get(k) for k in ('updatedAt','publishedAt') if r.get(k)];assert dates and all(x<=b['collectedAt'] for x in dates);assert any(b['sampling']['dateFrom']<=x<=b['sampling']['dateTo'] for x in dates)
valid=[r for r in rows if r.get('salaryMin') is not None and r.get('salaryMax') is not None]
default=[r for r in rows if r['country']=='中国' and r.get('workCities')]
report={'rows':len(rows),'chunksVerified':len(b['chunks']),'duplicateIds':0,'duplicateCompanyTitleCities':0,'validMonthlySalaries':len(valid),'sourceCount':len({r['source'] for r in rows}),'coverage':{'from':b['sampling']['dateFrom'],'to':b['sampling']['dateTo'],'preparedAt':b['collectedAt']},'defaultKnownCityRecords':len(default),'defaultSalaryN':sum(r.get('salaryMin') is not None for r in default),'defaultSalaryMedian':statistics.median((r['salaryMin']+r['salaryMax'])/2 for r in default if r.get('salaryMin') is not None),'limitations':['Source URLs validated for syntax only; live vacancies not rechecked','Historical convenience sample; no new collection performed']}
Path('qa-data-experience-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
