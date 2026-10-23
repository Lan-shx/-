from pathlib import Path
from bs4 import BeautifulSoup
p=Path(__file__).resolve().parent
s=BeautifulSoup((p/'reference.html').read_text(encoding='utf8'),'html.parser')
(p/'dist/echarts.min.js').write_text(s.find_all('script')[1].get_text(),encoding='utf8')
app=p/'dist/app.js';t=app.read_text(encoding='utf8')
t=t.replace("query:'',country:'中国',cities:[],category:'',source:'',industry:'',experience:'',education:'',salaryLow:'',salaryHigh:'',days:'',salaryOnly:false","query:'',country:'中国',cities:[],major:'',occupations:[],industries:[],sources:[],experiences:[],educations:[],scales:[],properties:[],hiringTypes:[],skills:[],skillMode:'any',salaryLow:'',salaryHigh:'',salaryMode:'overlap',dateField:'updatedAt',dateFrom:'',dateTo:'',keepUnknownDate:true,salaryOnly:false,majorRequired:false")
t=t.rstrip().removesuffix('init();')
app.write_text(t+'\n',encoding='utf8')
