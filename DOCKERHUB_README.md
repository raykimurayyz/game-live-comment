# Game Live Comment

Forward live comments from specified streaming platforms to a PlayStation Twitch chat overlay and a local web monitor.

Supported platforms:

- Douyu
- Huya
- Bilibili, without login

## Preview

![Game Live Comment web monitor](https://raw.githubusercontent.com/raykimurayyz/game-live-comment/main/docs/screenshots/en/live-monitor.png)

## Quick Start

Start the container:

```bash
docker run -d \
  --name gamelivecomment \
  --restart unless-stopped \
  -p 3010:3010 \
  -p 6667:6667 \
  -v gamelivecomment-data:/app/data \
  __IMAGE_NAME__:latest
```

Open:

```text
http://127.0.0.1:3010/
```

Then enter room IDs on the web page and save.

## Usage

- `3010/tcp`: web page and HTTP API
- `6667/tcp`: Twitch IRC/TMI emulator for PlayStation
- Room settings are stored in `/app/data/config.json`
- The web page can keep a room ID while disabling that platform
- Use the same Docker volume to keep saved room IDs after image updates
- UI language is stored in the current browser only

## PlayStation DNS Redirect

Redirect these Twitch IRC domains to the machine running this service:

- `irc.twitch.tv:6667`
- `tmi.twitch.tv:6667`

DNS is not bundled in this image.

## Environment Variables

Environment variables are optional. The web page is the recommended way to configure room IDs.

| Variable | Meaning |
| --- | --- |
| `SERVER_HOST` | HTTP and IRC bind host |
| `HTTP_PORT` | HTTP API and web page port |
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
| `OUTPUT_FORMAT` | PlayStation message format |
| `QUEUE_INTERVAL_MS` | IRC output interval |

Setting `DOUYU_ROOM_ID`, `HUYA_ROOM_ID`, or `BILIBILI_ROOM_ID` automatically enables that platform. Use the corresponding `*_ENABLED=false` variable only when you want to force-disable a configured platform.

## Source

https://github.com/raykimurayyz/game-live-comment
