---
name: "职业观测站 V2"
description: "克制的深色研究工作台，蓝色操作与紧凑证据"
colors:
  canvas: "#0c1017"
  surface: "#151b24"
  input: "#10151d"
  text: "#e6eaf0"
  muted: "#adb7c6"
  border: "#2b3543"
  control-border: "#354151"
  primary: "#2563eb"
  primary-hover: "#3478f6"
  on-primary: "#ffffff"
  chart: "#5797f5"
  focus: "#83b3f7"
  link: "#a5c8f7"
  selected: "#203552"
  selected-border: "#354f73"
  secondary: "#1c2430"
  secondary-hover: "#263244"
  grid: "#293341"
typography:
  journey-display:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "clamp(28px,3.3vw,44px)"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-.025em"
  journey-title:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "18px"
    fontWeight: 600
  headline:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  subtitle:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  composer-note:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.7
  metadata:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.7
  metric:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.5
  map-metric:
    fontFamily: '"Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    fontSize: "26px"
    fontWeight: 600
rounded:
  composer: "12px"
  control: "6px"
  panel: "8px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  panel-block: "18px"
  panel-inline: "20px"
  desktop-gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "34px"
    typography: "{typography.control}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "34px"
    typography: "{typography.control}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "34px"
    typography: "{typography.control}"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
    height: "34px"
    typography: "{typography.control}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "18px 20px"
  navigation-active:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.link}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
    height: "38px"
  chart:
    height: "320px"
    textColor: "{colors.muted}"
  filter:
    backgroundColor: "{colors.input}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
    height: "34px"
---
# Design System: 职业观测站 V2

## Overview

**Creative North Star: "紧凑深色研究工作台"**

以近黑底色、深灰工作区域、近白文字与蓝色操作建立统一的研究界面。普通产品密度优先，标题、表单、数字和来源说明采用紧凑而明确的尺度；边线组织内容，蓝色表示操作、选择与数据。视觉参考不提供本产品的文案或功能。

当前实现以 public/workbench-system.css、public/workbench-layout.js 及局部扩展 public/career-journey.js/css 为准，产品权威为 [PRODUCT-JOURNEY.md](PRODUCT-JOURNEY.md)，未冲突能力继承 PRODUCT-V2.md。此文件记录已批准的视觉系统与现有布局表达；旧样式、错位和溢出不构成新规范。

**Key Characteristics:**
- 近黑背景与深灰平面表面。
- 紧凑标题、控件和相邻证据说明。
- 蓝色操作与单色系数据表达。
- 细边线、小圆角、明确键盘焦点。
- 任务分区与职业主从布局。

## Colors

近黑、深灰与近白构成主体，蓝色承担操作和数据角色。令牌以 frontmatter 为准，不从旧样式提取另一套颜色。

### Primary

- **操作蓝**（`primary`）：主要按钮；悬停使用 `primary-hover`，文字使用 `on-primary`。
- **数据蓝**（`chart`）：主要图表系列及分区选中下划线。
- **焦点浅蓝**（`focus`）：键盘焦点与图表线框。
- **链接浅蓝**（`link`）：链接、选中分区和侧栏文字。

### Neutral

- **近黑背景**（`canvas`）：整个工作区的底色。
- **深灰表面**（`surface`）：侧栏、筛选栏、面板和表格。
- **输入暗色**（`input`）：输入、选择和筛选控件。
- **近白文字**（`text`）：标题、主要数值和正文。
- **说明灰**（`muted`）：字段标签、来源、坐标、分母与限制说明。
- **章节边线**（`border`）：面板、章节和列表分隔。
- **控件边线**（`control-border`）：输入、次级按钮、浮层和坐标轴线。
- **选中蓝灰**（`selected`）与 **选中边线**（`selected-border`）：导航与职业列表选中行。
- **次级表面**（`secondary`）：次级操作与表格表头；悬停使用 `secondary-hover`。
- **网格暗灰**（`grid`）：图表网格及比例条的未填充部分。

**The Blue State Rule.** 蓝色用于可操作状态、焦点与数据；常规区域保持中性暗色，不用额外彩色面板建立层级。

## Typography

字体统一为 Segoe UI、微软雅黑 UI、微软雅黑和无衬线回退。标题与正文共享字体，不引入装饰字体。层级通过字号、字重和紧凑间距表达。

### Hierarchy

- **Journey Display**：仅职业探索首页使用 journey-display；850px 及以下固定 28px。旅程分区标题使用 18px 的 journey-title，不改变原分析页 title 令牌。
- **Headline**：分析页面标题，使用 headline 令牌。
- **Title**：分区与面板标题，使用 title 令牌。
- **Subtitle**：面板内标题，使用 subtitle 令牌。
- **Body**：默认正文使用 body 令牌；解释段落为（13px），行高（1.7）。
- **Control**：按钮、输入与导航为（13px）；按钮字重（500）。
- **Metadata**：来源、图例和坐标固定采用 metadata 令牌。不要因窄屏压缩坐标字号。
- **Metric**：分析页核心数值使用 metric，地图统计使用 map-metric。数字采用等宽数字；职业详情和窄屏局部数值可按现有实现收至（20–22px）。

## Layout

固定左侧栏（200px），主工作区在侧栏右侧连续展开，桌面页边距采用 desktop-gutter。分析筛选保留岗位、城市与应用/重置；行业、经验、学历、薪资通过“更多筛选”展开，筛选状态仍显示在控件中。旅程扩展允许筛选行换行，窄屏取消黏附，避免浮层被滚动容器裁切。

职业探索首页采用最大 1100px 的起步区，桌面三个字段并排，700px 及以下为单列；850px 及以下提供黏附的四任务导航。首页主要按钮至少 48px 高，字段至少 44px 高，这是首页局部尺寸，不替换全站 34px 控件令牌。

当前指标分析使用顶部五个任务分区，每次展示当前分区的指标、设置、图表与数字表。数据设置采用四个分区与行式操作。职业探索在桌面采用列表与详情并排的主从布局，列表可内部滚动，详情内依次展开统计、要求、技能与证据。这些是当前页面表达，不要求所有新页面复制同一构图。

响应基线：1200px 收紧页面留白和职业列表；1024px 缩窄职业列表并整理双列内容；850px 导航变为抽屉，职业探索切换列表、详情与返回；600px 设置行与图表控制重排，门槛和技能必须单列，地图详情移到地图下方。不得让正文依赖整页横向滚动。表格、矩阵和长图有独立滚动区域。

原对比页维持职业、城市、行业对象选择和同口径表的结构。薪资直方图使用固定（320px）高度及同一比较轴上限。图表一般采用相同高度；超过十组的条形图在（344px）图框内滚动，不靠增加整页高度解决。

## Elevation & Depth

普通容器保持平面：深灰表面、近黑底色与单像素边线共同表达层次，不增加卡片阴影、发光或模糊背景。浮层通过位置、边线和内容覆盖表达暂时性；不继承旧样式的装饰阴影作为系统令牌。

动效限于按钮背景变化（150ms，ease）与窄屏侧栏展开（180ms，ease）。图表关闭入场动画；状态变化不能依赖动效才可理解。

## Shapes

控件采用 control 圆角，面板、收藏区域和对话框采用 panel 圆角。单像素边线保持稳定。顶部任务分区为平直文字按钮，选中项使用下沿细蓝线（2px）；不要把分区变成彩色卡片或大胶囊。比例条和地图点维持其数据几何形状。

## Components

### Buttons

主要操作为蓝底白字，次级操作为次级表面配控件边线，文字操作为透明底与说明灰。按钮高度和内边距使用组件令牌；各类按钮共享普通字重与小圆角。主要按钮悬停提亮，次级按钮悬停提亮表面，文字按钮悬停采用暗蓝灰底与链接浅蓝。禁用透明度为（0.5），取消可点击光标。

### Inputs / Fields

输入和选择采用输入暗色、控件边线和近白字，使用固定控件高度。占位文字为清晰灰色；筛选有值时以浅蓝文字与蓝灰边线标识。键盘焦点为浅蓝外轮廓（2px），间隙（2px）。浮层使用面板圆角，并在自身高度范围内滚动。

### Navigation

四个一级入口为职业探索、市场分析、研究助手、我的研究；地图、比较、真实岗位位于市场分析子入口。侧栏导航为细线 SVG 图标与文字并列，行高基线（38px），选中项采用选中蓝灰底、链接浅蓝和内描边。顶部功能分区用文字、下划线与选中状态表达，同一个分区在正文内不重复渲染旧工作台。

### Research Workspace

2026-10-20 修复用户反馈：市场分析子导航必须紧跟市场分析主按钮，位于研究助手之前；缩进、1px 纵线和独立选中态表达归属。窄屏提供市场分析内部视图导航。

桌面助手采用 248px 研究工具栏 + 主对话区，间隔 28px。左侧显示历史，回答方式、研究范围、模型连接与配置统一归入“研究设置”。1000px 及以下将工具折叠到“研究记录与设置”，默认不展开。

右侧以“研究对话”明确区域；示例标为“点击后填入输入框”，用户和助手消息分别标注角色。输入区采用 12px 圆角、1px 蓝色边框和明确标签“在这里输入你的问题”。消息独立滚动，输入区是对话容器底部的正常布局，不浮在消息上。窄屏输入区脚注 11px，主要控件与正文保留原字号。查询依据位于对话区后方，引用自动展开并聚焦结果。保存成果与归档行为不变。

### Cards / Containers

面板保持平面、深灰底、章节边线与 panel 圆角，内边距采用组件令牌。收藏、真实岗位和职业列表以行式内容、细分隔线与紧邻操作呈现。设置为说明在左、操作在右的行；窄屏将操作移到说明下方。

### Compact States

分类切换采用小型文字操作，选中使用暗蓝灰底与链接浅蓝。历史与计算限制保持为紧凑说明和可展开证据，不以彩色状态卡或大块空图占据页面。

### Charts and Evidence

图表采用蓝色与中性灰蓝系列，线图通过线型同时区分系列；不恢复旧彩色系列。坐标、图例和数字标签固定（12px）。网格使用 grid，轴线使用 control-border；背景融入面板。有效值、空值、样本数量和单位由相邻说明或数字表承载，不能只依靠悬停提示。

职业门槛比例条采用细蓝线与暗灰轨道，标签、比例与数量保持同一行；技能为有分隔线的紧凑列表。窄屏两者使用单列。矩阵在自己的容器内滚动，焦点与选中状态仍可见。

## Do's and Don'ts

### Do:

- **Do** 使用当前颜色、字号和圆角令牌。
- **Do** 使用细边线和表面差异组织层级，保持常规容器平面。
- **Do** 保持图表坐标和证据说明可读，使用固定说明字号。
- **Do** 在窄屏让筛选、表格和矩阵在自身容器内滚动。
- **Do** 保留对比分析原有结构，用共享图表主题保持一致。

### Don't:

- **Don't** 复制参考界面的文案、数据或功能。
- **Don't** 引入大幅宣传区域、玻璃、发光、彩色卡片或成片阴影。
- **Don't** 将探索首页 display 扩散到分析页；保留原分析标题、指标和坐标尺度，不恢复高圆角容器。
- **Don't** 将不可计算的指标渲染成空白大图或虚构数据。
- **Don't** 把局部错位、旧配色或横向溢出写成设计规则。

### Data Lifecycle and Evidence First

数据载入、校验失败与零匹配分开呈现。未完成载入时只显示深色状态面板，隐藏分析占位数字；失败提供至少 44px 的重试按钮。工作区在这些状态下建立独立格式化上下文，防止外边距露出旧浅色底。

载入完成后，以紧凑数据状态行展示历史记录总数和底座整理日期，样本纳入窗口与来源边界按需展开。市场分析按用户最新要求以大图优先：桌面主图在左、280px 解读栏在右（1150px 以下为 240px，900px 以下堆叠），发现与统计移入图旁；图表设置默认收起。颜色、字体、圆角继续使用现有令牌，不新增身份样式。


### Chart-first Market Canvas (2026-10-20)

首页标题在桌面合为一行，第二分句用现有浅蓝色强调；首页字号局部覆盖为 clamp(24px,2.35vw,36px)，900px 以下 clamp(24px,3.5vw,30px)，700px 以下 26px 并允许在逗号后换行。36/30px 仅为响应式标题上限；图旁统计 22px 保持紧凑层级，不扩散到全站。

指标五分区、地图、比较均以主图占据首屏。默认需求图使用气泡，现有图形选择、筛选、保存与导出保留。数据来源、图形说明与完整对比按需展开；历史样本属性、样本数及薪资 n<10 留空规则保留。主图高度随视口伸展，矩阵仅在自身容器滚动，窄屏解读移到图下。实现集中在 public/chart-stage.js/css。


### V23 Progressive Disclosure and Comparison

主任务画布只保留筛选、分区和图形。数据状态及研究步骤不占主区；来源仍在数据设置。首页为方向选择加主操作，补充资料使用原生 details。地图统计置于解读侧栏的折叠项。所有主图都有相邻解读；900px 以下置于图后。

比较页继承指标分析的 workbench 标题、文字分区、主图与280px侧栏；对象标签可直接移除。具体岗位为并列分区，以原始月薪区间图配解读、横向可滚动的条件表及展开职责呈现，不使用旧橙色工资卡片。比较图形默认气泡，结构使用不同点形区分对象。

助手由固定248px工具侧栏改为单列对话；研究记录与设置默认折叠，打开后桌面两列、手机单列。示例独立折叠，错误、发送、停止和导入同意控件保持可见。颜色字号沿用原系统；布局扫描无命中。


### V24 Direct Actions and Unconstrained Answers

比较页由维度分区与紧凑对象工具条直接开始，移除正文重复页面标题。真实岗位页使用蓝色主要比较入口和明确的行式勾选标签，比较栏在列表内黏附；列表父容器允许黏附，横向表格滚动仍限制在 table-scroll。岗位标题与招聘方使用现有浅蓝/灰色，修正旧样式的暗色残留。

助手宽度填满工作区，消息高度由内容决定，滚动归页面。记录和设置为独立 details，桌面并列，手机展开项各占一行；查询依据独立在对话后。取消原980px与固定视口高度约束，输入区正常排布。


### V24 Final Chat Window

用户最终明确聊天窗口而非长页面。助手使用站点现有侧栏承载对话选择，避免新增第二个常驻侧栏压窄回答。右侧桌面填满1192px可用宽度，消息占剩余视口，输入区在底部正常布局且始终可见；本次桌面实测消息区637px高。手机从顶部按钮打开同一侧栏，明确关闭/选中后收起。设置在顶部独立展开，导出、保存、依据为顶部操作。R1 使用右侧独立滚动依据面板，手机全屏；主对话不跳转，关闭返回原引用焦点。


### V25 Dedicated Conversation Navigation and Research Typography

用户明确不接受对话与全站功能同列。对话列表改为助手内部分区，228px宽、细右分隔线、平面深色背景；可收起恢复全部阅读宽度。手机列表为工作区内抽屉，主导航不随其展开。

头像为34px圆形（手机30px），助手用蓝色线性机器人头像，用户用中性人物头像，旁边保留角色与回答方式。助手回答使用正常段落排版，不再pre-wrap整段Markdown。标题16px、正文14px、表格13px（手机12px）；表格使用真实thead/th/td，细分隔线、表头背景、数字等宽，横向滚动限于表格本身。必要强调使用strong/em；代码使用等宽字体，仅限代码角色。

实现 public/assistant-polish.css、public/assistant-markdown.js；Markdown解析器及清理器本地托管，依据按钮在清理后由本地DOM构建。版式参考实现依据：https://github.com/markdown-it/markdown-it 与 https://github.com/cure53/DOMPurify 。

### V26 Visible Context, Chart Tools, and Message Alignment

首页阶段与专业为常显 section，保留可选说明、排序边界和记住选择。图表设置、图形说明、口径与来源放在主图下方的 chart-tools 区域；右侧保留解读与证据操作。窄屏依次为主图、设置说明、图表解读。

用户消息为右对齐蓝色气泡，人物头像在气泡右侧外部，与助手的左侧头像构成对话关系。头像34px，手机30px；气泡宽度最多86%（手机96%），长文本可换行。气泡沿用12px圆角，靠头像的右上角2px，用于明确消息发出方向，是本次聊天布局的有意例外。

数据设置只高亮底部对应入口，不激活市场分析。高级条件统一由顶部“更多筛选”打开同一个完整条件编辑器；编辑器继承尚未应用的岗位/城市草稿，明确应用才更新图表，关闭取消不改已应用范围。原专业、行业、来源、技能、薪资、日期、招聘状态及未知字段条件均保留。

本次 detector 的其余四项命中位于 V25 已有 Markdown/抽屉样式（强调文字色、代码圆角、Consolas代码字体、抽屉阴影），不属于本次布局变更；保持现有渲染行为。本次未刷新旧设计 sidecar。

### V27 Direction Selector and Unified Filter Entry

首页只保留一个“方向”下拉框，第一组列出可选的完整方向（AI应用、产品等现有分类），后续按方向分组列出细分岗位。方向与岗位在同一控件中互斥选择；整组选入该分类下全部有样本的职业ID，细分岗位只选该ID。保留阶段与专业常显，以及记住选择；旧版岗位选择继续兼容。

顶部只有一个“筛选”按钮，旁边显示已应用方向和城市。职业、城市、薪资与高级条件统一在原完整编辑器中修改，应用/取消行为保留；地图框选也打开同一编辑器确认。

新增样式只沿用现有色板和原生选择器。detector 命中为已有地图色值和 V25 Markdown/抽屉样式，无新增色值。

### V28 Six Filters and Adjacent Parent/Child Choices

首页方向按组排列：每组第一项是可选的“方向（全部）”，紧接该组细分岗位；不再将所有整类方向集中在前、所有细分岗位另列在后。市场方向多选器也使用可全选的父级和紧随其后的子级；部分选择用原生 indeterminate 状态。

筛选界面只暴露六类条件：方向、城市、月薪、经验、学历、关键词。前三类常显，其余三类在“更多”中。关键词同时查岗位、公司、技能和描述；不再单列企业、技能、来源、行业、日期、规模、性质、渠道、招聘状态或多套匹配算法。阶段与专业仍在首页常显。应用和重置后收起“更多”。

旧收藏/导入/助手带入的其他查询参数仍可参与证据复核，但不重新暴露为筛选编辑项；存在时用相邻只读提示列出并提供清除，避免隐藏限制。原全条件表单仅作为旧数据/同步兼容的内部实现保留，不再由用户入口打开。地图框选进入常用城市选择器确认。界面入口实现为 public/simple-filters.js 和 public/simple-filters.css。

本次针对新筛选与方向列表的设计检测为零命中；浏览器检查覆盖父子选择、草稿/应用/重置、六类输入、旧条件清除、手机边界及地图框选。

V28 比较图默认改为“关键指标对照”：记录数与月薪中位数使用独立刻度与固定12px圆点，不使用样本量决定点面积。桌面并列、手机上下排列；未披露行业保留为对象，月薪有效n<10时标明留空。原气泡、箱线、学历和经验视图继续手动可选。浏览器核对点值与实际分组统计一致；大样本组不再覆盖其余对象。
