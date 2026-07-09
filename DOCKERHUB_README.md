# Game Live Comment

Forward live comments from streaming platforms to a PS5 Twitch chat overlay and a local web overlay.

## Quick Start

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
  __IMAGE_NAME__:latest
```

Open:

- `http://127.0.0.1:3010/overlay`
- `http://127.0.0.1:3010/api/status`

## Ports

- `3010/tcp`: HTTP API and web overlay
- `6667/tcp`: Twitch IRC/TMI emulator for PS5

## Configuration

Environment variables override `config.json`.

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

Setting `DOUYU_ROOM_ID`, `HUYA_ROOM_ID`, or `BILIBILI_ROOM_ID` automatically enables that platform. Use the corresponding `*_ENABLED=false` variable only when you want to force-disable a configured platform.

## API

- `GET /overlay`: web overlay for debugging or OBS browser source
- `GET /api/status`: service, platform, queue, and recent comment status
- `POST /api/test-comment`: publish a local test comment
- `POST /api/platforms/douyu/room`: switch Douyu room and reconnect
- `POST /api/platforms/huya/room`: switch Huya room and reconnect
- `POST /api/platforms/bilibili/room`: switch Bilibili room and reconnect

## Source

https://github.com/raykimurayyz/game-live-comment
