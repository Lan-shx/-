# 职业观测站 — 从探索到行动的产品契约

2026-10-19，根据用户明确批准的职业决策旅程方案更新。本契约优先于 PRODUCT.md 和 PRODUCT-V2.md 中冲突的默认入口、导航和布局要求；其余数据、分析、比较、导入导出及恢复能力继续继承。实现范围是前端信息架构、交互层级与上下文衔接，不改变采集策略、数据底座或模型 API。

## 用户任务与信息架构

帮助尚未明确职业方向的用户完成“探索方向 → 了解样本机会 → 比较选择 → 核对岗位与追问 → 保存结论与下一步”。这是可跳过的研究路径，不是强制向导，也不提供个人适配评分或录用概率。

| 一级入口 | 当前职责与可达能力 |
|---|---|
| 职业探索 | 无 hash 时默认进入 `#explore`。选择当前阶段、兴趣方向和可选专业；开始后进入原有职业主从列表 `#discover`。阶段影响引导排序，专业沿用专业到职业映射。 |
| 市场分析 | 默认进入指标分析；地图、方向与城市比较、真实岗位是内部视图。既有五分区、完整分析、三轴比较、最多三对象及真实岗位比较继续可达。 |
| 研究助手 | 直接显示问题示例、对话与输入框；支持独立研究以及从方向、岗位、分析、比较带着条件和对象进入。 |
| 我的研究 | 统一进入收藏、保存的比较与分析、研究备注、最近对话、独立保存的结论与行动。查看全部对话和归档仍进入助手管理。 |

地图保留，成为市场分析中的城市证据视图。历史路由继续由既有路由处理；`#research` 指向我的研究。桌面侧栏与窄屏四入口共享路由。

## 渐进展开与下一步

首页只有一个主要行动“开始职业探索”，市场分析与研究助手作为次级捷径。首页隐藏全局分析筛选与查询工作台。市场分析直接保留岗位、城市和应用/重置操作，行业、经验、学历、薪资收进“更多筛选”；来源、企业、日期等完整能力继续在数据设置中可达。导出及专业工具沿用既有入口，避免抢占首页。

分析结果提供真实岗位与助手解释入口；比较、分析可保存。职业详情提供比较候选及助手分析。岗位详情可以将岗位描述、技能、来源与当前范围带入助手。上下文只预填可修改的问题，不自动发送。共享过滤、统计和原始岗位证据继续复用既有实现，不另造统计口径。

## 研究助手与持续研究

2026-10-20 布局修复：桌面左侧为研究记录与设置，右侧为明确标注的研究对话；1000px 及以下收起工具栏。回答方式、范围和模型配置统一放在研究设置。示例注明仅填入输入框，蓝色边框圈定输入区域。输入框在对话容器底部正常排布，消息独立滚动；查询依据按需展开，引用可自动展开并聚焦结果。空白页提供三个问题示例与样本边界；加载、错误、发送和停止继续由既有助手处理。归档对话可阅读、导出，恢复后继续提问。

对话通过当前浏览器 IndexedDB 保存，可按标题和正文搜索，置顶、重命名、归档与恢复。永久删除单独确认。对话、收藏与研究结论分别保存，归档或删除对话不会删除已经保存的收藏和成果。

助手回答后可保存最后一条回答与用户填写的下一步行动。我的研究列出结论并可单独确认删除，可导出包含成果、收藏和备注的 JSON。结论与探索偏好采用浏览器 localStorage；探索阶段和兴趣仅在用户勾选“在此浏览器记住”时持久保存。这里没有账户或云同步，清理浏览器站点数据可能移除本机资料。

## 数据与能力边界

69,465 条是历史公开招聘样本，不代表当前在招库存、招聘人数或全市场；导入数据时范围随当前会话改变。继续使用有效月薪区间中点，n<10 不展示薪资统计，未知不补零，多城市计数不相加。单次快照不能计算增长、趋势、竞争或供需，不推断职业适配和个人录用概率。

这次没有增加采集、实时数据服务或模型 API。站内规则查询与第三方模型解读保持区分；本轮对线上 V20 的同一模型接口执行了一次真实提问，获得回答和一组程序查询证据（见 qa-model-connectivity.json）；这只证明该次调用链路，不代表所有问题或回答质量全面通过。个人设置与聊天仅限当前浏览器；持久化失败须通过界面反馈并允许用户继续工作或导出。

## 视觉继承与实现位置

`public/career-journey.js` 和 `public/career-journey.css` 是既有深色工作台之上的局部扩展。继续使用近黑、深灰、近白、操作蓝及既有控件与面板圆角，不替换全站令牌。

仅探索首页 display 按最新单行要求采用 `clamp(24px,2.35vw,36px)`；700px 及以下为 26px 并允许换行。旅程分区标题为 18px，原分析页标题和图表字号不变。首页较宽松的起步表单、助手折叠层与黏附输入区仅作用于对应范围，详见 DESIGN.md。

## 验证与后续研究

本轮本地浏览器结果记录在 `qa-journey-results.json`：`passed: true`、15 项检查、无已记录错误。该结果支持受测交互和视口的本地实现验收，不代表已部署线上版本、第三方服务成功、真实用户满意或所有可达状态全面覆盖。

首次有效操作、首次价值时间、探索完成、比较/收藏、助手启动与研究恢复是后续建议衡量的指标；本轮未宣称已具备相应埋点或指标结果。5–8 人无提示可用性测试仍是建议，并未执行。推荐和持续研究报告是后续方向，不作为当前已实现功能。

## 2026-10-20 数据状态与结果优先改版

按第二份产品建议继续补强现有结构，不重复重写已完成的首页、分层筛选与助手布局。市场分析先展示当前范围的可核对发现、岗位证据与助手入口，再呈现统计和图表；图表设置默认折叠，完整筛选与导出保留。

页面明确区分样本纳入日期窗口（原始发布或维护日期至少一项命中）、底座整理日期与本次载入完成。14 个分片全部完成读取、哈希及数量检查后才开放分析；请求超时、完整性失败有独立提示和重试，失败不展示部分结果。无匹配记录是载入完成后的筛选状态，不混同读取失败。本次没有采集新招聘数据。

qa-data-experience-audit.json 核对 69,465 条历史样本、14 个分片及两个粒度的重复；来源 URL 只检查语法，不验证当前仍在招。默认大陆明确城市范围 53,450 条、有效月薪 40,782 条、中位数 6,000 元，使用独立 Python 运算与页面比对。qa-data-experience-results.json 覆盖加载、损坏文件与重试、零匹配、五个分析分区和研究保存恢复等 21 项检查。

真实目标用户的无提示可用性实验尚未实施，也未产生真实产品转化指标；不据程序回归宣称产品成熟度评分提高。


## 2026-10-20 主图优先调整

用户最新要求取代上一节的结论优先顺序。市场分析五个分区、城市地图及方向/城市比较把大图放进首屏，桌面解读和统计置于右侧，窄屏置于图下。需求默认气泡图；说明、来源与完整比较表按需展开。首页两分句桌面同行，手机在逗号后自然换行。历史数据、薪资门槛与全部原有分析能力保留；图旁岗位证据与助手入口携带当前临时聚焦及比较对象。

qa-chart-stage-results.json 验证 1024/1280/1440/1920 桌面标题单行、五分区图形首屏位置、图形切换、地图、比较、助手和一句话查询入口，以及手机无横向溢出；未记录页面异常。截图位于 .impeccable/review-chart。


## 2026-10-20 V23 简化与比较深度

主区不再展示数据状态横幅及研究步骤条，完整时间窗口和来源从数据设置进入。首页只保留具体职业方向选择和开始探索；阶段、专业与记住选择收进可选项。方向选择按 occupation id 应用，分类去空白合并，避免分类名被误作关键词。

五个指标分区默认分别为气泡、薪资箱线、城市职业热图、类别点图和交叉矩阵。每张主图旁有数据解读及图形读法。箱线图保留极值，通过不删除数据的范围滑块先聚焦主要区间；热图解读按真实指标值降序取前三。地图顶端统计移至右侧折叠项，城市点击和框选都有对应解读。

比较页与指标分析共享主图加侧栏风格，职业方向、城市、行业、具体岗位为并列入口。方向和城市支持气泡、箱线、经验及学历结构；完整指标、技能和原始岗位仍可展开。具体岗位可搜索、分页选择2–3条，在页内比较原文月薪区间、公司、城市、经验、学历、企业规模、专业、技能、来源和日期，展开职责原文和技能差异，支持带完整对象进入助手。单条区间与群体薪资统计明确区分。岗位勾选继续复用 state.selected。

助手的记录、设置和示例默认折叠，聊天与输入保持主任务。站内规则查询与程序依据、本机保存及原有模型路径保留。

验证见 qa-v23-results.json（首页选择、五默认图、地图、比较、选择上限、手机无横向溢出）、qa-v23-confirm.json（范围滑块、比较移除、空比较、助手本机问答与依据）、qa-v23-heat-reading.json（热图排名核对）。没有新增采集、个人适配分或实时在招声明。


## 2026-10-20 V24 直接操作与宽幅对话

比较页移除重复的大标题与添加对象说明，顶部直接显示比较维度和对象控件；图形仍有表达数据内容的标题。真实岗位页新增跟随滚动的比较栏，列出已选岗位、清空及移除动作；每行以明确的“加入比较/已加入”标签操作原有 checkbox，沿用2–3条选择及页内比较。窄屏独立一行显示比较控件，避免与岗位标题重叠。

助手取消980px宽度与固定高度限制；回答占满可用宽度，随页面自然展开，不再使用短消息滚动框。研究记录和研究设置改为并列独立的折叠分区，查询依据保留为回答区之后的独立分区。保留本机记录、配置、引用展开、导出和结论保存。

qa-v24-results.json覆盖标题移除、滚动时比较栏可见、勾选进入完整岗位比较、两分区独立访问、站内真实问答、依据展开、宽度和自然高度，以及三个手机页面无横向溢出；本轮未执行新的第三方模型调用。


### V24 用户后续明确：Codex 式聊天窗口

用户在发布前进一步要求可选择对话的聊天窗口，并明确 R1 不再向下跳转。最终实现取代上一节助手的整页自然展开方案：沿用站点左侧栏显示新建、搜索、最近与归档对话，右侧占满剩余工作区，上方消息区独立滚动，底部输入框固定在聊天布局中。取消重复对话区标题和额外记录折叠行；设置独立在顶部。对话切换保留每段记录及阅读位置。

R1 打开独立右侧依据面板，仅滚动该面板到对应证据卡，不改变页面或消息区位置；手机使用全屏依据面板，支持关闭与 Escape。手机对话列表提供打开与关闭按钮，选择后自动收起。

qa-chat-window-results.json验证两个独立真实规则查询对话的新建/搜索/切换恢复、操作菜单、R1点击前后页面与消息滚动位置不变、637px高消息区和底部输入可见、离开助手清理专用侧栏与面板、手机对话选择和依据面板。对话继续仅保存在当前浏览器，不宣称账户同步。


## 2026-10-20 V25 对话独立与研究表达

按用户反馈，将对话列表从全站导航中移出，置于助手工作区内部。桌面为可收起的228px列表和聊天区；收起恢复全部可用宽度。1100px及以下为助手区域内的独立抽屉，不打开全站导航。新建、搜索、归档、切换与对话阅读位置延续既有存储。

助手和用户消息新增不同SVG头像和明确身份。模型及站内规则回答均通过本地托管的 markdown-it 15.0.3 渲染、DOMPurify 3.4.17 清理；标准标题、加粗、列表、代码和HTML表格可读，表格仅在自身容器内横向滚动。禁用原始HTML和远程图片，链接仅允许HTTP(S)，代码中引用保持原文，只有实际证据R编号转为依据按钮。R1继续打开侧面板，不跳转。原始聊天文本不修改，旧记录在读取时自动使用新排版。前端依赖来自npm锁文件，prebuild同步浏览器产物与许可。

模型系统规范增加“结论—数据依据—样本局限—下一步核实”结构；简单问题可精简，不输出内部职业ID。百分比注明分母、表格限关键列、保留小样本与缺失边界。不把规范提示当作回答质量全面保证。

qa-v25-results.json覆盖真实程序数据构建的排版验收样例、保存后刷新重新渲染、头像、语义表格、脚本/危险链接阻断、侧栏独立与展开、R1不跳、手机输入与表格无页面溢出。该样例不是第三方模型回答；qa-research-server.mjs 的会话、工具和凭据边界测试也通过。

## V26 interaction corrections

- Stage and major stay visible on the exploration home page.
- Settings, graphic explanations, and provenance belong below each analysis chart.
- User messages align right, with their avatar outside the message bubble.
- Data settings is independent of market navigation. Advanced research filters move into the single market More filters editor; quick-filter drafts are retained and cancellation keeps the applied scope.
- Scoped desktop/mobile browser verification: qa-v26-results.json. Formatting text in screenshots is a UI fixture, not a newly generated model assessment.

## V27 direction selection and unified filtering

One home direction selector includes both entire existing taxonomy groups and grouped specific roles. A group applies all its available occupation IDs; a specific role applies only that ID. Remembered selections support both and older role-only values. The market scope bar has one filter entry and a read-only direction/city summary. Existing advanced fields remain in the shared editor, including map-region confirmation.

## V28 filter reduction

A selectable group is immediately followed by its own roles in home and market direction choices. Only six filter categories are exposed: direction, city, salary, experience, education, keyword. Direction/city/salary remain visible; the rest fold into More. Keyword replaces separate employer/skill searches. Retired query controls are no longer opened from the interface. Nondefault retired conditions brought by an older collection or assistant are explicitly shown with Clear instead of silently constraining results. All sample/evidence rules remain unchanged.

V28 comparison default: fixed-size dot panels for record count and median salary, with separate scales. Unknown industry remains visible and salary n<10 remains blank. Other chart views are still selectable; mobile panels stack.
