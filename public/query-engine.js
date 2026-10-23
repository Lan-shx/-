(function(root){
  'use strict';
  const VERSION='1.0.0';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const unique=a=>[...new Set(a)];
  const labels={cities:'城市',occupations:'职业方向',industries:'行业',educations:'企业学历要求',experiences:'企业经验要求',skills:'技能',hiringTypes:'工作性质',hiringChannels:'招聘渠道',sources:'来源'};
  const aliases={
    '数据分析师':['数据分析'], '商业分析师':['商业分析'], 'AI产品经理':['AI产品'],
    'AI运营专员':['AI运营'], '财务会计':['会计','财务'], '人力资源管理':['人力资源','人力','HR'],
    '供应链 / 采购 / 物流':['供应链','采购','物流'], '销售 / 商务拓展':['销售','商务拓展'],
    '智能体 / 提示词 / AI应用':['智能体','提示词'], 'AI训练 / 数据标注':['数据标注','AI训练']
  };
  function parse(input,context){
    const q=String(input||'').normalize('NFKC').trim();
    const f=clone(context.base), used=new Uint8Array(q.length), changes=[],notes=[],errors=[];
    const mark=(start,length)=>used.fill(1,start,start+length);
    const consume=re=>{for(const m of q.matchAll(re))mark(m.index,m[0].length)};
    const add=(key,values,negative=false,append=false)=>{
      if(negative){f.nlExclude||={};f.nlExclude[key]=unique([...(f.nlExclude[key]||[]),...values]);}
      else {f[key]=append?unique([...(f[key]||[]),...values]):unique(values);if(key==='occupations')f.major='';}
      changes.push((negative?'排除':append?'追加':'设置')+(labels[key]||key));
    };
    if(!q)return {filters:f,errors:['请输入想查询的城市、职业或问题。'],notes,unknown:[],changes,intent:'jobs',version:VERSION};
    if(q.length>300)errors.push('一次最多输入300个字符，请拆分问题。');
    if(/竞争|供需|增长率|增长趋势|趋势|预测|前景|性价比|最适合|录用概率|推荐我|远程|双休|不加班|五险/.test(q))errors.push('这个问题涉及尚无可靠字段或证据的条件。可改查城市、职业、薪资或已披露要求。');
    if(/年薪|日薪|时薪|\d+薪/.test(q))errors.push('暂不将年薪、日薪、时薪或多薪制折算为月薪，请改用明确月薪条件。');
    if(/仍在招|正在招|实时|最新岗位/.test(q))errors.push('当前为历史快照，无法确认实时在招状态。请查询历史记录后核对岗位原页。');
    if(/不要求|不限制|不限学历|不限经验/.test(q))errors.push('请明确写“学历不限”或“经验不限”；不要求某学历不等于排除该学历记录。');
    if(/(?:不要|排除|不含|不看)\s*(?:月薪|薪资|工资|经验|最低经验|近|最近|\d|一万|两万)/.test(q))errors.push('暂不支持否定金额、日期或经验范围，请改写为正向边界。');
    // Personal credentials are context, never an employer requirement.
    consume(/(?:我是|我有|本人)(?:一名|个)?(?:本科生?|硕士生?|博士生?|大专生?|应届生|\d+年经验)/g);
    if(/(?:我是|我有|本人)/.test(q))notes.push('个人背景不自动转成企业要求；学历、经验和录用资格请逐条核对。');
    const quoted=/(关键词|岗位名称|公司)[：:]?[“"「]([^”"」]+)[”"」]/g;
    for(const m of q.matchAll(quoted)){f[m[1]==='公司'?'company':'query']=m[2];mark(m.index,m[0].length);changes.push(m[1]);}
    for(const company of ['腾讯','字节跳动'])for(const m of q.matchAll(new RegExp(company,'g'))){if(used.slice(m.index,m.index+m[0].length).some(Boolean))continue;if(/不要|排除|不含/.test(q.slice(Math.max(0,m.index-3),m.index))){errors.push('企业排除暂不支持，请使用明确职业、城市排除条件。');continue;}if(changes.includes('企业关键词')&&f.company!==company)errors.push('一次查询暂仅支持一个企业关键词，请拆分查询。');f.company=company;mark(m.index,m[0].length);changes.push('企业关键词');}
    const educationOrder=['初中及以下','高中','中专 / 中技 / 职高','大专','本科','硕士','博士'];
    for(const m of q.matchAll(/(本科|大专|硕士|博士|高中)(?:及)?(以上|以下)/g)){if(used.slice(m.index,m.index+m[0].length).some(Boolean))continue;if(/不要|排除|不含/.test(q.slice(Math.max(0,m.index-3),m.index))){errors.push('学历范围的否定请改为正向条件，例如“企业要求大专及以下”。');continue;}const level=educationOrder.indexOf(m[1]);add('educations',educationOrder.filter((v,i)=>m[2]==='以上'?i>=level:i<=level));mark(m.index,m[0].length);notes.push('按企业披露的学历门槛筛选，未知学历不纳入；不等同于个人可申请资格。');}
    for(const m of q.matchAll(/经验不限/g)){if(used.slice(m.index,m.index+m[0].length).some(Boolean))continue;f.nlExperienceUnlimited=true;mark(m.index,m[0].length);changes.push('原文明示经验不限');}
    for(const m of q.matchAll(/(?:最低)?(?:经验)?(\d+)\s*(?:到|至|[-–])\s*(\d+)年(?:经验)?/g)){const low=Number(m[1]),high=Number(m[2]);if(used.slice(m.index,m.index+m[0].length).some(Boolean))continue;if(low>high||high>60){errors.push('经验年限范围无效。');continue;}f.nlExperience={low,high};mark(m.index,m[0].length);changes.push('企业最低经验年限');notes.push('按企业原文明示的最低经验年限筛选；未披露与经验不限另行处理。');}
    const major=(context.majors||[]).filter(m=>q.includes(m.name)&&new RegExp(m.name+'(?:专业|毕业)').test(q)).sort((a,b)=>b.name.length-a.name.length)[0];
    if(major){const i=q.indexOf(major.name);mark(i,major.name.length);f.major=major.name;f.occupations=major.occs.slice();changes.push('专业映射');notes.push('专业映射仅提供相关方向，不代表企业准入或个人适配。');}
    const candidates=[];
    for(const [key,options]of Object.entries(context.options))for(const option of options){
      const terms=[option.label,...(key==='occupations'?(aliases[option.label]||[]):[])];
      if(key==='occupations')terms.push(...option.label.split(/\s*\/\s*/).filter(t=>t.length>=2));
      if(key==='cities'&&option.label!=='其他大陆城市')terms.push(option.label+'市');
      for(const term of terms)if(term.length>=2)candidates.push({key,value:String(option.value),term});
    }
    candidates.sort((a,b)=>b.term.length-a.term.length);
    const found=[];
    for(const item of candidates){let start=0;while(start<q.length){const i=q.toLowerCase().indexOf(item.term.toLowerCase(),start);if(i<0)break;start=i+item.term.length;if(used.slice(i,start).some(Boolean))continue;
      if(/^[a-z0-9]+$/i.test(item.term)&&(/[a-z0-9]/i.test(q[i-1]||'')||/[a-z0-9]/i.test(q[start]||'')))continue;
      const before=q.slice(0,i);const negative=/(?:不要|排除|不含|不看|除了)\s*$/.test(before);
      found.push({...item,i,negative});mark(i,item.term.length);
    }}
    // A coordinated negative phrase is unsafe without repeating the operator.
    if(/(?:不要|排除|不含|不看|除了)[^，。；,;]+[和或、][^，。；,;]+/.test(q))errors.push('请将否定条件分别写明，例如“不要北京，不要上海”，避免排除范围歧义。');
    for(const key of Object.keys(context.options)){
      const a=found.filter(x=>x.key===key).sort((a,b)=>a.i-b.i);if(!a.length)continue;
      const positive=a.filter(x=>!x.negative).map(x=>x.value),negative=a.filter(x=>x.negative).map(x=>x.value);
      if(positive.length)add(key,positive,false,/(?:再加|加上|追加)/.test(q));
      if(negative.length)add(key,negative,true);
    }
    if(f.skills?.length>1&&/和|并且|同时|都|全部/.test(q))f.skillMode='all';
    if(found.filter(x=>x.key==='cities'&&!x.negative).length>1&&found.filter(x=>x.key==='occupations'&&!x.negative).length>1)errors.push('暂不支持分别绑定城市和职业的复合查询，请拆成一次一个职业或一个城市。');
    if(f.nlExperience&&f.nlExperienceUnlimited)errors.push('经验不限与指定最低年限不能同时应用，请保留一个条件。');
    // Explicit internship/new-graduate terms stay distinct from missing experience.
    for(const [word,key]of [['实习','nlIntern'],['应届','nlGraduate']])for(const m of q.matchAll(new RegExp(word+'(?:生)?','g'))){if(used.slice(m.index,m.index+m[0].length).some(Boolean))continue;if(/(?:不要|排除|不含|不看)\s*$/.test(q.slice(0,m.index))){errors.push('请通过工作性质或招聘渠道选择排除条件：'+word);continue;}f[key]=true;mark(m.index,m[0].length);changes.push(word+'明示记录');}
    const salaryRange=/(?:月薪|薪资|工资|薪水)?\s*(\d+(?:\.\d+)?|[一二三四五六七八九十两]+)(万|千|[kKwW])?\s*(?:到|至|[-~～])\s*(\d+(?:\.\d+)?|[一二三四五六七八九十两]+)(万|千|[kKwW])?\s*(?:元)?/g;
    const number=(s,u)=>{const digits={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};let n=Number(s);if(!Number.isFinite(n)){if(s.includes('十')){const [a,b]=s.split('十');n=(a?digits[a]:1)*10+(b?digits[b]:0);}else n=digits[s];}return n*(/万|w/i.test(u||'')?10000:/千|k/i.test(u||'')?1000:1);};
    let salaryFound=false;
    for(const m of q.matchAll(salaryRange)){if(used.slice(m.index,m.index+m[0].length).some(Boolean)||!(m[2]||m[4]||/月薪|薪资|工资|薪水/.test(m[0])))continue;f.salaryLow=String(number(m[1],m[2]||m[4]));f.salaryHigh=String(number(m[3],m[4]||m[2]));f.salaryMode='overlap';mark(m.index,m[0].length);salaryFound=true;}
    const single=/(?:月薪|薪资|工资|薪水)?\s*(至少|不低于|不少于|高于|超过|低于|不高于|不超过|最多)?\s*(\d+(?:\.\d+)?|[一二三四五六七八九十两]+)(万|千|[kKwW])?\s*元?\s*(以上|以下|起)?/g;
    for(const m of q.matchAll(single)){if(used.slice(m.index,m.index+m[0].length).some(Boolean)||!(m[3]||/月薪|薪资|工资|薪水/.test(m[0])))continue;
      if(salaryFound){errors.push('请将多个薪资条件合并为一个区间，例如“月薪1万到2万”。');mark(m.index,m[0].length);continue;}
      if(!m[1]&&!m[4]){errors.push('薪资需要范围或比较词，例如“月薪1万以上”或“10k到20k”。');mark(m.index,m[0].length);continue;}
      const lower=/^(至少|不低于|不少于|高于|超过)$/.test(m[1]||'')||/以上|起/.test(m[4]||'');const upper=/^(低于|不高于|不超过|最多)$/.test(m[1]||'')||m[4]==='以下';
      if(lower&&upper){errors.push('薪资上下限表达冲突，请明确区间。');continue;}
      const n=number(m[2],m[3]);f.salaryLow=lower?String(n):'';f.salaryHigh=upper?String(n):'';f.salaryMode='contained';
      f.nlSalaryStrict=/^(高于|超过|低于)$/.test(m[1]||'')?(lower?'lower':'upper'):'';mark(m.index,m[0].length);salaryFound=true;
    }
    if(salaryFound){changes.push('月薪范围');if(Number(f.salaryLow)>Number(f.salaryHigh)&&f.salaryHigh!=='')errors.push('月薪下限不能高于上限。');notes.push(f.salaryMode==='contained'?'按招聘月薪区间的完整边界筛选，不把薪资上限当作保证收入。':'月薪区间与目标范围有重叠；可在下方修改匹配口径。');}
    const relative=/(?:最近|近)(\d+|一|三|六|十二|半)(?:个)?(天|月|年)/g;
    for(const m of q.matchAll(relative)){const now=new Date((context.today||new Date().toISOString().slice(0,10))+'T00:00:00Z');const amount=m[1]==='半'?.5:m[1]==='十二'?12:Number(m[1])||({一:1,三:3,六:6}[m[1]]);const days=m[2]==='天'?amount:m[2]==='月'?amount*30:amount*365;f.dateTo=now.toISOString().slice(0,10);now.setUTCDate(now.getUTCDate()-days);f.dateFrom=now.toISOString().slice(0,10);f.keepUnknownDate=false;mark(m.index,m[0].length);changes.push('日期范围');notes.push('相对月份按30天、年份按365天展开；日期未披露记录不纳入。');}
    for(const m of q.matchAll(/(20\d{2}-\d{2}-\d{2})\s*(?:到|至|~)\s*(20\d{2}-\d{2}-\d{2})/g)){f.dateFrom=m[1];f.dateTo=m[2];f.keepUnknownDate=false;mark(m.index,m[0].length);changes.push('日期范围');if(m[1]>m[2]||[m[1],m[2]].some(d=>!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d))errors.push('日期范围无效，请使用真实日期且开始不晚于结束。');}
    if(/发布日期|发布的/.test(q))f.dateField='publishedAt';
    if(/更新日期|更新的/.test(q))f.dateField='updatedAt';
    if(context.coverageEnd&&f.dateTo>context.coverageEnd)notes.push('查询结束日期超出历史底座覆盖期 '+context.coverageEnd+'；无记录不能解释为市场没有岗位。');
    let intent=/对比|比较|相比/.test(q)?'compare':/薪资|工资|月薪|薪水/.test(q)&&!salaryFound?'salary':/技能|要求|门槛|学历|经验/.test(q)?'requirements':major?'explore':'jobs';
    if(/找|查找|有哪些岗位|岗位记录/.test(q)&&intent!=='compare')intent='jobs';
    const axes=[['city','cities'],['occupation','occupations'],['industry','industries']].filter(([,k])=>f[k]?.length>=2);
    let axis=null,objects=[];
    if(intent==='compare'){
      if(axes.length!==1)errors.push('比较需要一个明确的维度和2–3个对象，例如“比较深圳和杭州的数据分析薪资”。');
      else{axis=axes[0][0];objects=f[axes[0][1]].slice();if(objects.length>3)errors.push('一次最多比较3个对象，请减少城市、职业或行业。');}
    }
    for(const [key,a]of Object.entries(f.nlExclude||{}))if(a.some(v=>f[key]?.includes(v)))errors.push((labels[key]||key)+'同时被包含和排除，请修改条件。');
    consume(/重新查询|查询|查找|帮我|帮忙|看看|看一下|想看看|想看|我想|想做|想找|找|查看|了解|分析|比较|对比|相比|一般|主要|分别|相关|对应|适合|有哪些|哪些|什么|如何|怎么样|多少|岗位记录|招聘记录|岗位名称|岗位|职位|工作|招聘|职业方向|方向|专业|毕业|薪资|工资|月薪|薪水|学历|经验|要求|门槛|技能|企业|公司|行业|城市|地区|发布日期|更新日期|发布的|更新的|统计|分布|情况|机会|记录|不要|排除|不含|不看|除了|再加|加上|追加|包含|需要|会用|会|的|在|和|或|与|及|是|有|能|做|我|请|一下|吗|呢/g);
    const residual=q.split('').map((c,i)=>used[i]?' ':c).join('').replace(/[\s，。！？、；：,.!?;:（）()\/]+/g,' ').trim();
    const unknown=residual?residual.split(' '):[];
    if(!changes.length&&!['salary','requirements'].includes(intent))errors.push('没有识别到可执行范围，请补充城市、职业或使用手工筛选。');
    return {input:q,filters:f,intent,axis,objects,changes:unique(changes),notes:unique(notes),errors:unique(errors),unknown,version:VERSION};
  }
  root.CareerQuery={parse,VERSION,labels};
  if(typeof module!=='undefined')module.exports=root.CareerQuery;
})(typeof window==='undefined'?globalThis:window);
