# 2026-11 依赖漏洞修复

## 2026-11-24 系统包修复公告

本次扫描中的 7 项告警均来自 Alpine 系统包。最新的 `node:24-alpine3.24` 基础镜像仍包含旧版 zlib 和 OpenSSL 库；仅拉取基础镜像不足以完成修复。

| 包 | 本次最低版本 | 对应 CVE |
| --- | --- | --- |
| zlib | 1.4-r0 | CVE-2026-4738 |
| openssl、libssl3、libcrypto3 | 3.5.9-r1 | CVE-2026-95691、CVE-2026-95692、CVE-2026-107496、CVE-2026-88823、CVE-2026-88822 |
| musl | 1.2.5-r24（Alpine 3.23） | CVE-2026-107891 |

所有构建阶段统一使用 `node:24-alpine3.23`，保留 Node.js 24。Alpine 3.23 的主仓库支持至 2027-11-01，以上包均来自主仓库；运行时移除不需要且已结束支持的 `community` 仓库，仅保留 `main`。该分支包含官方回补补丁，Scout 能正确识别 musl 修复版本，避免继续留下 3.24 分支的扫描差异。未混入 edge 包，也未添加漏洞忽略规则。

OpenSSL 3.5.10 的上游发行计划为 2026-12-01。Alpine 已将本次 5 个 OpenSSL 补丁回补到 3.5.9-r1，因此构建约束使用实际可安装的发行版修复版本。

Dockerfile 将 APK 缓存失效标识更新为 `2026-11-24`，并显式约束全部安全版本，仓库无法提供时构建失败。发布工作流通过 `no-cache-filters: runtime` 每次重新执行系统包升级，缓存标识同时包含 `github.run_id` 和 `github.run_attempt`，防止重跑发布时继续复用旧安全层。

### 运行镜像精简与兼容性

完整复扫额外发现 BusyBox wget 的 CVE-2025-60876，当前分支没有发行版修复包。应用不使用 shell 或命令行 wget，因此最终运行镜像移除 BusyBox、包管理器及相关辅助工具，保留 CA 证书、基础配置、Node.js 和所需动态库。

剩余包的 APK 库存记录保留供扫描，不通过删除库存或忽略规则隐藏告警。入口重置为直接执行 Node.js，无需 shell。调试时使用 `docker exec <container> node ...`；运行镜像不再提供 `sh`、`wget`、`apk`。

### 本次验证结果

以下为 2026-11-24 修复时的本地验证记录：

| 平台 | Node.js | 完整 Docker Scout 扫描 | 默认入口与接口检查 |
| --- | --- | --- | --- |
| linux/arm64 | 24.22.3 | 116 个包，0 个漏洞 | 通过 |
| linux/amd64 | 24.22.3 | 116 个包，0 个漏洞 | 通过 |

- 截图中的 7 项告警及额外发现的 BusyBox 告警全部清除，扫描未设置严重程度过滤或忽略规则。
- 两个平台均验证默认容器启动、HTTP 状态及展示页、WebSocket 弹幕传递、三平台切房和非法输入拒绝；测试容器已清理。
- 类型检查、22 项测试、两平台生产构建均通过；生产 npm 依赖审计为 0。
- 本地镜像标签为 `gamelivecomment:security-fix-20261124-arm64` 和 `gamelivecomment:security-fix-20261124-amd64`；本机 `gamelivecomment:security-fix-20261124` 指向 arm64 镜像。
- arm64 镜像 ID：`sha256:41bab55cac3c22e06fb8638449802adbbf397a4bda16c141bae998e76441a074`。
- amd64 镜像 ID：`sha256:b5e22990c13e572fdf5bd2283a678120c28d9af922d4b31276541d40697068a8`。

### 验证与重新部署

```sh
npm run typecheck
npm test
docker build --pull --no-cache-filter runtime -t gamelivecomment:security-fix-20261124 .
docker scout cves local://gamelivecomment:security-fix-20261124 --exit-code

# 使用本地 Compose 构建的部署
docker compose build --pull --no-cache
docker compose up -d
```

修复需要重新构建并部署新镜像后生效。

### 本次上游依据

- [Alpine 3.23 官方安全数据库](https://secdb.alpinelinux.org/v3.23/main.json)
- [Alpine 支持周期](https://alpinelinux.org/releases/)
- [OpenSSL 2026-11-10 安全公告与发行计划](https://openssl-library.org/news/secadv/20261110.txt)
- [BusyBox CVE-2025-60876 安全记录](https://security.alpinelinux.org/vuln/CVE-2025-60876)

## 2026-11-04 历史修复记录

以下版本与验证结果为 11 月 4 日的历史记录；当前镜像及版本约束以上方 11 月 24 日公告为准。

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

### 历史验证

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

### 历史上游依据

- [Zod 安全公告](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [fast-uri 3.1.9 安全发布](https://github.com/fastify/fast-uri/releases/tag/v3.1.9)
- [Fastify 安全公告](https://github.com/fastify/fastify/security/advisories)
- [ip-address 安全公告](https://github.com/beaugunderson/ip-address/security/advisories)
- [Alpine 3.24.3 安全发布，包含 zlib 和 musl 修复](https://www.alpinelinux.org/posts/Alpine-3.21.9-3.22.7-3.23.7-3.24.3-released.html)
