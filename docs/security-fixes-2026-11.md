# 2026-11 依赖漏洞修复

截图中的 15 项漏洞通过更新依赖和重新构建镜像处理：

| 依赖 | 旧版本 | 更新版本 | 截图中的 CVE |
| --- | --- | --- | --- |
| zod | 3.25.76 | 4.6.7 | CVE-2023-54404 |
| fastify | 5.12.3 | 5.12.8 | CVE-2026-92081、CVE-2026-107832 |
| fast-uri | 3.1.7 | 3.1.9 | CVE-2026-110306、CVE-2026-110180、CVE-2026-86472、CVE-2026-110725、CVE-2026-110095 |
| ip-address | 10.5.0 | 10.7.6 | CVE-2026-101910、CVE-2026-101913、CVE-2026-111997、CVE-2026-101911、CVE-2026-101912 |
| Alpine zlib | 1.3.2-r0 | 1.3.2-r1（新基础镜像） | CVE-2026-85091 |
| Alpine musl | 1.2.6-r2 | 至少 1.2.6-r3（Alpine 3.24 修复版） | CVE-2026-107891 |

基础镜像使用 `node:24-alpine3.24`，保留构建时 `apk upgrade`，并明确要求 `musl>=1.2.6-r3`、`zlib>=1.3.2-r1`；无法获取安全版本时构建失败。索引在同一步骤内复用并于结束时删除，避免多次下载。发布流程设置 `pull: true`。`.dockerignore` 排除本机 `node_modules` 和 `dist`，防止旧依赖覆盖容器构建结果。

### musl 扫描结果差异

本机 Docker Scout 1.15.1 及临时下载的官方 1.29.0 均对 Alpine 3.24 的 musl 1.2.6-r3 报告 CVE-2026-107891，并要求 1.2.6-r6。[Alpine 官方安全记录](https://security.alpinelinux.org/vuln/CVE-2026-107891)明确列出：3.24 分支的修复版本为 1.2.6-r3，edge 分支才是 1.2.6-r6。3.24 仓库没有 r6。这属于扫描数据与发行版安全记录的差异，升级 CLI 未消除。保留实际扫描发现，不添加忽略规则，也不混用 edge 系统库；复扫时需要核对扫描器数据库是否正确区分分支。

额外升级 Vitest 至 4.1.12，并更新存在漏洞的开发传递依赖。CI 与镜像统一使用 Node.js 24。

## 验证

2026-11-04 本地验证结果：

- Node.js 24 下 `npm ci` 成功，`npm audit` 为 0 个漏洞。
- 类型检查、22 项测试、应用构建均通过。
- 最终镜像 `gamelivecomment:security-fix` 构建成功，平台为 `linux/arm64/v8`，镜像 ID 为 `sha256:77ff335d731cac49e1d9d68bf9bd521148f1edebf339baad9f4ca5204c913a53`。
- 容器内实际启动通过；状态、展示页、测试弹幕、三平台切房接口正常，非法数组房间 ID 被拒绝。
- Docker Scout 1.29.0 索引 121 个包，结果为严重/高危/中危/低危均 0，未定级 1；截图的另外 14 项告警已消除，剩余为上文记录的 musl 分支版本差异。未屏蔽任何漏洞。
- 镜像中实际安装 `musl-1.2.6-r3`、`zlib-1.3.2-r1`，运行时 npm 已删除。

使用 Node.js 24 运行：

```sh
npm ci
npm audit
npm run typecheck
npm test
npm run build
docker build --pull --build-arg APK_CACHE_BUST=2026-11-04 -t gamelivecomment:security-fix .
docker scout cves local://gamelivecomment:security-fix
```

现有配置测试和新增 HTTP 请求测试覆盖 Zod 4 升级后的默认值、测试弹幕、三平台切房与非法输入校验。

旧镜像不会随源代码修改而更新。使用本地 Compose 部署时，需要重建并重新创建容器：

```sh
docker compose build --pull --no-cache
docker compose up -d
```

## 上游依据

- [Zod 安全公告](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [fast-uri 3.1.9 安全发布](https://github.com/fastify/fast-uri/releases/tag/v3.1.9)
- [Fastify 安全公告](https://github.com/fastify/fastify/security/advisories)
- [ip-address 安全公告](https://github.com/beaugunderson/ip-address/security/advisories)
- [Alpine 3.24.3 安全发布，包含 zlib 和 musl 修复](https://www.alpinelinux.org/posts/Alpine-3.21.9-3.22.7-3.23.7-3.24.3-released.html)
