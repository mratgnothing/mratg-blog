# 临时 Apple 风格展示页

日期：2026-10-09。公开地址：https://mra-t-g-blog.cn/demo/apple-showcase/

页面完整内容位于 `public/demo/apple-showcase/`，使用独立 HTML/CSS/JS，不依赖博客布局。首页、站内导航和文章搜索不增加展示入口；通过完整链接分享。页面的 robots meta 与 `public/_headers` 的对应规则声明 noindex、nofollow、noarchive；临时路径使用 no-store。

## 删除

展示结束后删除 `public/demo/apple-showcase/`，只移除 `public/_headers` 中从 `# BEGIN TEMP APPLE SHOWCASE` 到 `# END TEMP APPLE SHOWCASE` 的这一个区块，删除本说明，然后正常构建、提交并推送 main。Cloudflare Pages 下一次发布完成后，应核验展示页及其 assets 返回 404；博客正常文章与 API 保持可用。不要回滚整站到旧版本，因为那会同时撤回后续文章。

此任务没有自动到期或定时删除安排。

## 内容归档

本轮用户要求上传仓库未发布稿件及素材。实际核对发现 8 篇日记及 6 篇 `-2` 文章均与已跟踪原稿重复（两篇只改变图片目录；数学建模稿是较旧副本），Personal Agent 手机长文也已导入为 `ai-personal-agent.md`。因此保留现有发布原稿，不重复生成路由。

未跟踪稿件与素材均与线上现有内容重复；副本保留在原工作区及本次发布工作区的本地归档中，不加入公开 Git 历史，不重复生成网站文章。图片逐字节核对与已有素材一致。Cloudflare 原生产部署源码为 `0baad53`，与已有正式原稿所在 main 版本相同。唯一 draft 为 `new-post-template.md`，是模板，继续保留为草稿。
