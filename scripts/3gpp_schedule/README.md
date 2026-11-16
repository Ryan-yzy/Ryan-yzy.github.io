# 3GPP RAN1–RAN4 北京时间日程

公共入口：`/3gpp-schedule/`；四个独立页面：`/3gpp-schedule/ran1/` 至 `/3gpp-schedule/ran4/`。

在仓库根目录执行 `python3 scripts/3gpp_schedule/build.py --refresh` 可重新获取四个原日程并生成 HTML 与 JSON 快照。仅使用 Python 标准库。页面共用 `/3gpp-schedule/app.js` 与 `style.css`，不依赖外部脚本或登录。此命令不自动提交或部署。

适用会议：2026-11-16 至 2026-11-20，Calgary。Alberta 自 2026-11-01 起采用 ABT（UTC−6），北京时间快 14 小时。解析器固定本次会期的 UTC−6 偏移，避免旧版时区数据库引入一小时误差；不应直接套用于其他地点和会期。

数据来源：Duckhyun Bae，https://karlla1220.github.io/3GPPSchedule/ 。保留所有原排程条目、课题编号、来源链接与日程补充说明。RAN3/RAN4 保留原站的 Experimental 标签。

RAN2 周四增加的 Breakout 3 单独保留。RAN4 的 BR1、BR2 使用稳定的表格列标识，并在每天的列标题和各场详情保留原始会场名称。

原有 NTN Lab 页面、内容锁和 Jekyll 的 ntn 排除配置未作修改。

## 个人议程导出

每个工作组页面可用列表星标或详情里的“加入我的关注”选择单场，也可用“关注当前筛选”批量关注。点击“导出议程”可选择“我的关注（跨 RAN1—RAN4）”“当前筛选结果”或从详情进入的“本场议程”。

支持 Markdown、UTF-8 CSV 和 iCalendar ICS。关注存在当前浏览器的本地存储中，四个工作组独立存储、汇总导出；全部文件均按完整北京时间日期输出，跨午夜的场次只导出一次。ICS 使用每个工作组独立的稳定事件 UID 和 UTC 时刻，提醒由导入它的日历应用设置。

导出函数位于 `3gpp-schedule/export-core.js`，导出对话框位于 `export-ui.js`。Markdown 与 CSV 可用于个人参会笔记或表格处理；ICS 用于手动导入支持该格式的日历应用。所有页面和导出文件都保留原始日程来源。
