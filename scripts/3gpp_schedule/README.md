# 3GPP RAN1–RAN4 北京时间日程

公共入口：`/3gpp-schedule/`；四个独立页面：`/3gpp-schedule/ran1/` 至 `/3gpp-schedule/ran4/`。

在仓库根目录执行 `python3 scripts/3gpp_schedule/build.py --refresh` 可重新获取四个原日程并生成 HTML 与 JSON 快照。仅使用 Python 标准库。页面共用 `/3gpp-schedule/app.js` 与 `style.css`，不依赖外部脚本或登录。此命令不自动提交或部署。

适用会议：2026-11-16 至 2026-11-20，Calgary。Alberta 自 2026-11-01 起采用 ABT（UTC−6），北京时间快 14 小时。解析器固定本次会期的 UTC−6 偏移，避免旧版时区数据库引入一小时误差；不应直接套用于其他地点和会期。

数据来源：Duckhyun Bae，https://karlla1220.github.io/3GPPSchedule/ 。保留所有原排程条目、课题编号、来源链接与日程补充说明。RAN3/RAN4 保留原站的 Experimental 标签。

RAN2 周四增加的 Breakout 3 单独保留。RAN4 的 BR1、BR2 使用稳定的表格列标识，并在每天的列标题和各场详情保留原始会场名称。

原有 NTN Lab 页面、内容锁和 Jekyll 的 ntn 排除配置未作修改。
