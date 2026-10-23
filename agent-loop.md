# 职场观测站改版验收循环

任务日期：2026-10-07。用户将数据目标调整为至少60000条，并要求重新设计高级工作台和评审标准。

调度 agent 是唯一 Site 源码、合并与发布负责人。UI/UX agent 提供命名、布局、设计系统及限定范围的资产；数据 agent 汇总已有来源证据、标准化和去重；评审 agent 独立检查成品截图、真实交互、数据完整性和来源证据。本轮 UI/UX 角色由 data_source_agent 接任。

循环：基线核验 → UI brief 审查和数据收尾并行 → 代表页集成 → 独立评审 → 缺陷返回责任 agent 迭代 → 全站回归和数据终验 → 发布。调度维护任务状态和版本基线。未通过不能标记完成；不能以 interim 数据校验作为最终证据。

用户否定首版整体观感后，原73分不再作为审美依据。视觉独立评分：艺术方向与辨识度30、构图与比例25、字体与层级20、色彩材质与细节15、全站视觉一致性10；视觉总分至少90且各项至少80%。功能、数据、无错误和可访问性另设硬门槛，不能加视觉得分。附首屏、全页和手机实际截图，说明主观评价边界；不预授设计方向通过。

六入口名称已认可：职业探索、市场分析、对比分析、趋势观察、职位库、我的方案。本轮保留命名，重新设计视觉。研究刊物风格的暖白、墨色与铜橙只是待验证方向；核心真实数据图形、页面比例、字体与统一细节要形成独立识别，不能靠给蓝白框后台换色通过。

硬门槛：原功能完整、无页面错误、390px无页面横向溢出、键盘可操作、正文和图表文字对比度合格、薪资少于10个有效样本留空、未知和零分开、统计能回到真实记录。导航与标题术语不一致、移动核心流程不可用、首屏没有实际任务路径均阻断。

保留职业/城市/任职要求探索；专业映射与共享筛选、全部筛选抽屉；方向比较、市场比较、最多3岗位比较；6指标和6图型；收藏、方案、备注、导入和6类导出；原始岗位链接、数据说明、旧S00–S10链接；移动端和完整离线功能。

数据目标为至少60000条经过质量校验和去重的真实招聘样本记录。URL、来源查询、采集时间和原始证据可追溯；岗位与公司非空；保持大陆经管、产品与AI应用分类、近一年原始发布/维护日期口径；按URL、ID和公司/标题/明确城市集合去重。未知字段保留未知，非月薪不混入月薪统计。

历史记录保留实际采集时间，底座整理日期不表示逐条重新采集或仍在招。明确截止、来源标示未截止与截止未知分别披露。不能以人数、源站原始总量、重复记录、不相关职业或捏造数据补足数量。

终验：分块计数、SHA256与gzip/plain一致；严格数据校验；独立来源质量评审；桌面与移动截图；真实筛选、矩阵下钻、比较与图型、导入导出和离线回归；实际数据量下加载与筛选性能；源码提交、归档和保存版本匹配，发布状态成功。

## Final editorial gate — 2026-10-07
User stopped data collection. Pool locked at 69,465 traceable deduplicated records; no further source collection or refresh. Function names retained. Round 4 independent visual-only review: 90/100 (26/30 art direction, 23/25 composition, 18/20 typography, 14/15 material/color, 9/10 consistency). This is an internal review threshold, not user aesthetic acceptance. Desktop/mobile route, interaction, export and offline regression passed; tablet 768px overflow corrected and verified. Final source prepared for ordinary Sites publication preserving existing access.


## User stop — 2026-10-07
User requested task closure before workflow received publishing input. No push/save/deploy performed. Live version remains 9; local source and evidence retained uncommitted. Collection, preview and publication processes are stopped. No further iteration authorized.


## Publication resumed — 2026-10-07
User clarified that the current workbench should be published as-is. No further UI iteration or data collection. Publish the reviewed local state and fixed 69,465-record snapshot, preserving existing access.

