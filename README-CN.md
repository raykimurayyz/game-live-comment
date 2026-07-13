# Game Live Comment 中文说明

[English](README.md)

Game Live Comment 用于把指定直播平台的弹幕转发到 PS5 的 Twitch 聊天浮层，同时提供本地 Web 调试页面。

当前支持：

- 斗鱼单房间弹幕
- 虎牙单房间弹幕
- B 站单房间弹幕，不需要登录
- PS5 Twitch IRC/TMI 模拟器，默认监听 `6667`
- Web 调试页面：`/overlay`
- 状态接口：`/api/status`
- 测试弹幕接口：`/api/test-comment`

## 开发调试

```bash
npm install
npm run dev
```

打开：

- `http://127.0.0.1:3010/overlay`
- `http://127.0.0.1:3010/api/status`

发送本地测试弹幕：

```bash
curl -X POST http://127.0.0.1:3010/api/test-comment \
  -H 'content-type: application/json' \
  -d '{"username":"本地测试","content":"hello ps5"}'
```

切换斗鱼房间：

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/douyu/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"10942092"}'
```

切换虎牙房间：

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/huya/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"27367112"}'
```

切换 B 站房间：

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/bilibili/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"6"}'
```

## Docker 配置

推荐通过环境变量配置房间号。环境变量优先级高于 `config.json`。

使用已发布的镜像：

```bash
docker run -d \
  --name gamelivecomment \
  --restart unless-stopped \
  -p 3010:3010 \
  -p 6667:6667 \
  -e DOUYU_ROOM_ID=10942092 \
  -e DOUYU_INCLUDE_GIFTS=false \
  -e HUYA_ROOM_ID=27367112 \
  -e HUYA_INCLUDE_GIFTS=false \
  -e BILIBILI_ROOM_ID=6 \
  -e BILIBILI_INCLUDE_GIFTS=false \
  your-dockerhub-username/gamelivecomment:latest
```

也可以用 Docker Compose 在本地构建：

```bash
DOUYU_ROOM_ID=10942092 \
HUYA_ROOM_ID=27367112 \
BILIBILI_ROOM_ID=6 \
docker compose up -d --build
```

也可以修改 `docker-compose.yml`：

```yaml
environment:
  NODE_ENV: production
  DOUYU_ROOM_ID: "10942092"
  DOUYU_INCLUDE_GIFTS: "false"
  HUYA_ROOM_ID: "27367112"
  HUYA_INCLUDE_GIFTS: "false"
  BILIBILI_ROOM_ID: "6"
  BILIBILI_INCLUDE_GIFTS: "false"
```

端口：

- `3010/tcp`：HTTP API 和 Web 调试页面
- `6667/tcp`：给 PS5 使用的 Twitch IRC/TMI 模拟器

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `SERVER_HOST` | HTTP 和 IRC 监听地址 |
| `HTTP_PORT` | HTTP API 和 overlay 页面端口 |
| `IRC_PORT` | Twitch IRC 模拟器端口 |
| `DOUYU_ENABLED` | 可选强制开关。设为 `false` 时，即使配置了 `DOUYU_ROOM_ID` 也禁用斗鱼。 |
| `DOUYU_ROOM_ID` | 斗鱼房间号 |
| `DOUYU_INCLUDE_GIFTS` | 是否包含斗鱼礼物 |
| `HUYA_ENABLED` | 可选强制开关。设为 `false` 时，即使配置了 `HUYA_ROOM_ID` 也禁用虎牙。 |
| `HUYA_ROOM_ID` | 虎牙房间号 |
| `HUYA_INCLUDE_GIFTS` | 是否包含虎牙礼物 |
| `BILIBILI_ENABLED` | 可选强制开关。设为 `false` 时，即使配置了 `BILIBILI_ROOM_ID` 也禁用 B 站。 |
| `BILIBILI_ROOM_ID` | B 站房间号 |
| `BILIBILI_INCLUDE_GIFTS` | 是否包含 B 站礼物 |
| `OUTPUT_FORMAT` | 发送到 PS5 的消息格式 |
| `QUEUE_INTERVAL_MS` | PS5 IRC 输出间隔 |

## 平台启动规则

- 配置 `DOUYU_ROOM_ID`、`HUYA_ROOM_ID` 或 `BILIBILI_ROOM_ID` 会自动启用对应平台。
- 如需强制禁用已配置的平台，设置对应的 `*_ENABLED=false`。
- 平台未启用且未配置房间号：启动时跳过该平台。
- 房间不存在或无法解析：该平台状态会变成 `error`，不会继续处理该平台弹幕。
- 斗鱼、虎牙和 B 站都未配置时：服务仍会启动，PS5 IRC 模拟器、Web 页面和测试弹幕接口仍可用于调试。

查看状态：

```bash
curl http://127.0.0.1:3010/api/status
```

## Web 页面房间设置

`/overlay` 页面顶部提供房间设置栏，可以直接修改斗鱼、虎牙和 B 站房间号。房间号留空会停用对应平台。

页面提交后会立即切换运行中的平台连接，并写回 `config.json` 或 `CONFIG_PATH` 指向的配置文件。如果 Docker 启动时设置了 `DOUYU_ROOM_ID` 等环境变量，容器重启后环境变量仍会覆盖配置文件。若希望页面保存长期生效，建议挂载 `/app/config.json`，并避免用环境变量覆盖同一个房间号。

## API

- `GET /overlay`：Web 调试页面，可作为 OBS 浏览器源
- `GET /api/status`：查看服务、平台、队列和最近弹幕状态
- `POST /api/test-comment`：发送本地测试弹幕
- `POST /api/platforms/douyu/room`：切换斗鱼房间并重连
- `POST /api/platforms/huya/room`：切换虎牙房间并重连
- `POST /api/platforms/bilibili/room`：切换 B 站房间并重连

## PS5 自检

自动化测试覆盖本地 Twitch IRC/TMI 行为：

- `CAP REQ` 返回 Twitch capability ACK
- `NICK` 返回 IRC welcome 握手
- `JOIN` 返回 join 和 names 响应
- `PING` 返回 `PONG`
- 弹幕格式化为 Twitch `PRIVMSG`
- `CommentBus` 会先排队，再广播到 IRC 客户端

运行：

```bash
npm run test
```

自动化测试不能证明 DNS 重定向和真实 PS5 屏幕显示。实机验证仍然需要：

1. 把 `irc.twitch.tv` 和 `tmi.twitch.tv` 重定向到本服务。
2. 启动应用。
3. 打开 PS5 Twitch 直播 UI。
4. 调用 `POST /api/test-comment`。
5. 确认 PS5 屏幕出现测试弹幕。

## PS5 DNS 重定向

把这些 Twitch IRC 域名重定向到运行本服务的机器：

- `irc.twitch.tv:6667`
- `tmi.twitch.tv:6667`

当前版本不内置 DNS 服务。

## 许可证

本项目使用 MIT 许可证。详情见 [LICENSE](LICENSE)。
