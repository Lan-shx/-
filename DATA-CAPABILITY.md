# B · 数据能力审计（2026-10-07）

对原始 14 个分片逐片验证 SHA256、分片 rowCount，合计 69,465，未修改任何原数据。运行 `python aggregate.py` 可复核；audit.json 是本次结果。全底座数不是应用默认大陆筛选后的数。

| 字段 / 能力 | 实际结果与产品边界 |
|---|---|
| 历史记录 | 69,465；明确未截止 23,030，截止未知 46,435；不得称全部在招 |
| 有效月薪 | 54,415；继承应用规则 finite min/max 且 0≤min≤max，中点统计不计额外薪数 |
| 全底座月薪 | n=54,415 时中位数 6,500，P25=4,500，P75=8,500；仅说明审计，页面必须随当前条件重算 |
| 城市 | workCities 去重后 317 组；多城市记录属于多组，城市合计不能当全站分母 |
| 地理锚点 | geoCN 的 properties.cp 精确全名或市后缀规范化匹配 304 组；13 组不匹配仍保留表中；不猜坐标 |
| 行业 | 19,767 披露行业，49,698 未披露；497 个值含未披露，即 496 原始已知行业值；不可自动猜粗行业 |
| 增长 / 90日趋势 | 无同口径连续快照；发布时间直方图只能称发布分布，不能充作趋势 |
| 竞争 / 录用概率 | 无申请人数、求职者供给与录用结果；不可算 |
| 薪资 n<10 | 中位数、四分位与箱线全部 null；必须显式“有效薪资不足10条” |

地图使用的是历史行政区示意底图和城市中心锚点，不是企业位置。无坐标不能隐式消失；城市表需披露未映射组数。采集日、维护日、发布时间和底座整理日分别说明，不能用 manifest.collectedAt 冒充所有岗位更新日。

## 地理资产来源与许可

china-cities.geojson：geoCN `geojson/china_cities.json`，455 历史行政区要素，原样保留 geometry 与 cp；补充同库 china_provinces.json 的34个省级面，四直辖市使用原 longitude/latitude 属性经名称显式匹配；MIT (c) 2017 Jun Wang，许可全文 GEO-LICENSE.txt。来源 https://github.com/junwang23/geoCN ; 原文件 https://raw.githubusercontent.com/junwang23/geoCN/master/geojson/china_cities.json ; license https://raw.githubusercontent.com/junwang23/geoCN/master/LICENSE 。保留署名和许可。该资产是示意级历史行政边界，不宣称最新测绘底图；不可将旧区划映射误当缺招聘记录。

所有样本规模、月薪和行业覆盖只描述便利样本，不表达市场份额或统计置信度。
