# B · 可视化交接规格

A 审查通过，2026-10-07 冻结 v1：四视角回答不同用户问题，共享当前筛选；职业探索/对比未削减；增长与竞争保持缺证状态。地图城市中心是示意锚点，历史底图须明确许可和年代限制；北京、上海、天津、重庆须使用同源省级坐标纳入。C 可增加浏览器实测所需的降级/焦点修复，不得修改指标语义。

应用 antv-g2-chart 与 antv-l7 skills。未发现安装的 S2 skill；本期采用可访问 HTML heat table，不引入复杂 pivot 运行时。矩阵规模最多30职业×40重点城市，原生表的语义、键盘按钮、数字与局部滚动更适合；功能包含行/列排序、计数/薪资切换、局部选中、列固定/容器滚动及 drilldown，不能退化成静态截图。

## 数据合同

所有图取同一 filtered，所有新增统计复用 validSalary/midpoint/salaryQuantiles。城市每记录只计一次同名 workCities。occupation 应按 occupation id 精确筛选，标签取 taxonomy；原型 category 聚合仅演示。n=组内招聘记录，salaryN=有效月薪记录，披露率=salaryN/n。全局分母为 filtered.length，不拿多城市组数之和做分母。零表示本次样本未观察，null表示不能计算，二者样式/文案区别。

## 四视角

| 视角 / 用户问题 | 视觉映射、尺度与下一步 |
|---|---|
| 市场总览：当前范围在哪些地方/方向有更多样本？ | 地图+职业横条。条长度=n，自0起；最多10方向，其余表可查。地图圆面积=n，半径与sqrt(n)成比例；提供1k/5k/10k圆图例。色彩仅分类蓝，默认不编码价值判断。点城市→局部城市详情；查看职位才应用全局城市 |
| 地图视图：这些城市的样本规模/薪资如何？ | 真geoJSON行政面 PolygonLayer + cp中心 PointLayer；统一WGS84，不对无坐标项生成随机点。可切换 count / salary：salary只改变颜色，不改变圆面积；连续顺序蓝色、null灰轮廓，动态元/月图例。详细表等价访问全部城市。显示“城市示意中心，非企业坐标” |
| 机会矩阵：什么职业×城市样本较多？ | 行=职业、列=城市；计数蓝色顺序（0浅灰），薪资顺序teal，null=—并标n<10。数字和按钮是主要读取层，色深辅助。hover/点击显示n、salaryN、披露率、P50/P25–P75；职业行/城市列可选。锁定单元格仅局部状态；看原始职位才提交精确职业×城市筛选 |
| 行业结构：披露行业如何组成？ | 覆盖条先写known/filtered。G2横条显示已知原行业前10，表保留全部已知+未知；可行业×职业表同样矩阵规则。份额若按全部样本计算含未知，若按已知行业计算必须标“已披露行业内”，不能交替。点击行业→局部详情及原始职位 |

## 保留六旧视图与G2映射

bar→interval + transpose；box→boxplot/box使用预先算出的组内min/P25/P50/P75/max并注明须线为min/max；distribution→interval使用明确bin字段；CDF→line + step形状，y百分比[0,100]，最多6组；heat→原生表等效matrix；bubble→point x=n y=P50 size=sqrt(salaryN)（面积salaryN），n<10不画点但保留表。任何新增图不移除旧视图可达入口。

G2使用v5完整spec `Chart({container,autoFit:true,renderer:'svg'})`→options→render；多层用view.children。异步render使用代次token防过时数据覆盖；卸载destroy，window resize重布局。L7使用Scene + token-free MapLibre空样式({version:8,sources:{},layers:[]}) + 本地GeoJSON面层，不依赖在线瓦片/API key。按容器resize、状态切换destroy；WebGL/context/network引擎失败显示同等表，明确可重试。

## 本地静态依赖与导出

以独立build目录 pin npm @antv/g2 5.x、@antv/l7 2.x、@antv/l7-maps同版本，esbuild entry→静态IIFE vendor-antv.js，暴露window.CareerViz；将lock和MIT licenses一起保留。生产HTML只载本地bundle，本地地理资产。延期加载L7地图避免首屏阻塞。完整离线HTML可内嵌JSON和vendor，但WebGL不可用时原生表及SVG地图必须存在；SVG/PDF导出走G2 SVG + 确定性静态SVG地理回退，不能截图空WebGL画布。

## 交互与验收

全部tooltip内容在选中面板/数字表可读。chart click精确指向对象，不读取未验证HTML。矩阵cell为button aria-pressed，选中/清除键盘可达；aria-live汇报对象及数量。矩阵容器内部滚动，页面390px不溢出。增长率/竞争度不可用按钮有相邻原因而非disabled-tooltip。map圆n比例图例、薪资连续图例、行业分母、city未映射数量均在图下。0/稀少/null/空筛选/长名字/离线/低薪资n/reduced-motion均为显式状态。
