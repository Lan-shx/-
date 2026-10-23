# 本轮技能路由

三角色流水线：A（当前主负责人）冻结产品并最终验收；B（dataviz子agent）提供可视化规格与原型；C（UI子agent）在冻结规格后提供完整实现和浏览器验证。B/C只提交独立产物，A负责集成与Sites发布。

| 角色 | 已安装且本轮采用 |
|---|---|
| A | product-design、impeccable |
| B | antv-g2-chart、antv-l7 |
| C | ui-design、design-taste-frontend（Taste）、motion、ui-verification |

antv-s2-expert本轮未在已安装目录发现，进一步通过官方安装脚本和指定仓库master完整归档核查，该路径不存在，无法按蓝图名称安装（见S2-SKILL-CHECK.md）。机会矩阵使用可键盘访问的语义table保证排序、指标、hover与钻取，不以Skill名称作为实现质量的证明。无需为30方向×40城市的规模引入大表虚拟化。

新增三个项目wrapper由skill-creator与writing-for-agents指导，路由到既有专业工具而不复制其内容。用户蓝图对结构和视觉的明确约束高于第三方技能的自由风格探索流程，不再重新要求用户选择视觉方案。

Impeccable Windows上下文launcher本轮已实际尝试，持续无输出后中止；直接读取PRODUCT/IA及对应reference继续。此记录不宣称detector执行成功。Sites已有静态实现沿用以保留原功能；可视化依赖本地打包，不靠运行时CDN。
