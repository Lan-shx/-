import importlib.util,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('collector',root/'expand-business.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
b=json.loads((root/'dist/jobs.json').read_text(encoding='utf8'))
# Reconcile original source snapshots with the expanded corpus under the final taxonomy.
original=json.loads(subprocess.check_output(['D:/Git/cmd/git.exe','show','ffa95d7c5fb2e14586e0a885ffd2259837bf4600:dist/jobs.json'],cwd=root))
for r in b['rows']+original['rows']:c.add(r)
b.update(rows=c.rows,taxonomy={**b['taxonomy'],'majors':c.majors,'occupations':c.occupations})
b['methodology']['scope']='公开可访问招聘列表的经管职业方向便利样本，扩展产品、商业分析和AI应用；平台排序与覆盖不均，不代表全市场。剔除无关工种，职业方向按标题规则归类。'
(root/'dist/jobs.json').write_text(json.dumps(b,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print('Final classified unique records:',len(c.rows))
