# TV6 - 观影网站

兼容 dbzy5 采集接口的观影网站。

## 部署状态

当前最新 commit: c4330700 (已删除 wrangler.toml)

## Cloudflare Pages 部署问题解决方法

如果 Cloudflare 仍然拉取旧版本代码：

1. **断开 Git 连接**
   - Cloudflare Dashboard → Pages → 你的项目
   - Settings → Connectivity → Connected Git Repository
   - 点击 "Disconnect"

2. **重新连接**
   - Pages → 创建 Pages → 连接到 Git
   - 选择 ZSFan888/tv6
   - 部署

3. **或者手动触发新部署**
   - Deployments → Retry deployment
