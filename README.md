# Game Live Comment

[中文说明](README-CN.md)

Forward live comments from specified streaming platforms to a PS5 Twitch chat overlay and a local web overlay.

First version:

- Douyu single-room adapter
- Huya single-room adapter
- Bilibili single-room adapter without login
- Twitch IRC/TMI emulator on port `6667`
- Web overlay at `/` and `/overlay`
- Status API at `/api/status`
- Test comment API at `/api/test-comment`

## Development

```bash
npm install
npm run dev
```

Open:

- `http://127.0.0.1:3010/`
- `http://127.0.0.1:3010/api/status`

Send a local test comment:

```bash
curl -X POST http://127.0.0.1:3010/api/test-comment \
  -H 'content-type: application/json' \
  -d '{"username":"本地测试","content":"hello ps5"}'
```

Switch Douyu room:

`123456` is a sample room ID. Replace it with your own Douyu room ID.

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/douyu/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"123456"}'
```

Switch Huya room:

`123456` is a sample room ID. Replace it with your own Huya room ID.

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/huya/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"123456"}'
```

Switch Bilibili room:

`123456` is a sample room ID. Replace it with your own Bilibili room ID.

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/bilibili/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"123456"}'
```

## Docker

Use the published image:

After the container starts, open `http://127.0.0.1:3010/` and configure room IDs there.

```bash
docker run -d \
  --name gamelivecomment \
  --restart unless-stopped \
  -p 3010:3010 \
  -p 6667:6667 \
  -v gamelivecomment-data:/app/data \
  your-dockerhub-username/gamelivecomment:latest
```

Or build locally with Docker Compose:

```bash
docker compose up -d --build
```

Ports:

- `3010/tcp`: HTTP API and web overlay
- `6667/tcp`: Twitch IRC/TMI emulator for PS5

The official Docker image stores room settings in `/app/data/config.json`. Use the same Docker volume when recreating the container to keep saved room IDs after image updates. UI language is stored in the current browser and is not written to the container config.

Docker Compose example:

```bash
docker compose up -d --build
```

Supported environment variables:

| Variable | Meaning |
| --- | --- |
| `SERVER_HOST` | HTTP and IRC bind host |
| `HTTP_PORT` | HTTP API and overlay port |
| `IRC_PORT` | Twitch IRC emulator port |
| `DOUYU_ENABLED` | Optional force switch. `false` disables Douyu even when `DOUYU_ROOM_ID` is set. |
| `DOUYU_ROOM_ID` | Douyu room ID |
| `DOUYU_INCLUDE_GIFTS` | Include Douyu gifts |
| `HUYA_ENABLED` | Optional force switch. `false` disables Huya even when `HUYA_ROOM_ID` is set. |
| `HUYA_ROOM_ID` | Huya room ID |
| `HUYA_INCLUDE_GIFTS` | Include Huya gifts |
| `BILIBILI_ENABLED` | Optional force switch. `false` disables Bilibili even when `BILIBILI_ROOM_ID` is set. |
| `BILIBILI_ROOM_ID` | Bilibili room ID |
| `BILIBILI_INCLUDE_GIFTS` | Include Bilibili gifts |
| `OUTPUT_FORMAT` | PS5 message format |
| `QUEUE_INTERVAL_MS` | PS5 IRC output interval |

Setting `DOUYU_ROOM_ID`, `HUYA_ROOM_ID`, or `BILIBILI_ROOM_ID` automatically enables that platform. Use `*_ENABLED=false` only when you want to force-disable a configured platform. If a configured room cannot be resolved, that platform enters `error` status and will not keep reconnecting.

## Web Overlay Settings

The web page includes room settings. You can update Douyu, Huya, and Bilibili room IDs there. Empty room IDs disable the corresponding platform. UI language is saved in the current browser only.

Room changes are applied immediately and saved to `config.json` or the file pointed to by `CONFIG_PATH`. The official Docker image uses `CONFIG_PATH=/app/data/config.json`; prefer a Docker named volume for `/app/data`. If Docker environment variables such as `DOUYU_ROOM_ID` are set, they still take precedence after the container restarts.

## API

- `GET /`: web overlay for debugging
- `GET /overlay`: the same web overlay, useful as an OBS browser source
- `GET /api/status`: service, platform, queue, and recent comment status
- `POST /api/test-comment`: publish a local test comment
- `POST /api/platforms/douyu/room`: switch Douyu room and reconnect
- `POST /api/platforms/huya/room`: switch Huya room and reconnect
- `POST /api/platforms/bilibili/room`: switch Bilibili room and reconnect

## PS5 Interaction Self Check

Automated checks cover the local Twitch IRC/TMI behavior that PS5 depends on:

- `CAP REQ` returns Twitch capability ACK
- `NICK` returns IRC welcome handshake
- `JOIN` returns join and names responses
- `PING` returns `PONG`
- comments are formatted as Twitch `PRIVMSG`
- `CommentBus` queues comments before broadcasting to IRC clients

Run:

```bash
npm run test
```

This cannot prove DNS redirection or the real PS5 screen overlay. Those still require a PS5 smoke test:

1. Redirect `irc.twitch.tv` and `tmi.twitch.tv` to this service.
2. Start the app.
3. Open PS5 Twitch broadcast UI.
4. Call `POST /api/test-comment`.
5. Confirm the comment appears on the PS5 overlay.

## PS5 DNS Redirect

Redirect these Twitch IRC domains to the machine running this service:

- `irc.twitch.tv:6667`
- `tmi.twitch.tv:6667`

DNS is intentionally not bundled in this first version.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
