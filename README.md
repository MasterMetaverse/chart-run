# 🐷₿ Chart Run

**A side-scrolling platformer where you run on a live-looking crypto chart.** Grab the sats, stomp the scam DMs, jump the rug pits and race to the ATH flag.

Made for [Piggy Sats ($PIGSATS)](https://piggysats.fun) on Arc by [@MGMetaverse](https://x.com/MGMetaverse).

▶️ **Play it:** [piggysats.fun/game](https://piggysats.fun/game/) · in Telegram: [t.me/PiggySatsMemeBot/chartrun](https://t.me/PiggySatsMemeBot/chartrun)

## What's inside

| Classic platformer | Chart Run |
|---|---|
| Ground | **Candles**: green going up, red going down |
| Coins | ₿ coins (1,000 sats each) |
| ? blocks | **TRADE blocks**: hit them for coins or power-ups |
| Walking enemy | **Scam DM bots** (stomp them) |
| Turtle | **Bears** that turn at ledge edges |
| Pits | **Rug pits** |
| Falling crusher | **Crash candles**, with a warning arrow |
| Power-ups | Shield, **Diamond Hands** (invincible), **Claim** magnet, **PUMP** springs |
| Goal flag | **The ATH flag**: grab it higher for a bigger bonus |

- **Daily Run:** the same level for everyone each day (new at 00:00 UTC), Wordle-style.
- **Degen mode:** one heart, faster enemies, double sats.
- **Challenge links:** share your score and a friend sees "Beat it" with a live race bar.
- **Missions, XP, ranks and skins** saved in the browser.
- **Mobile first:** installable as an app (PWA), works offline, touch controls, auto-pause.
- **Telegram Mini App ready:** opens inside Telegram and can send finished runs to your server.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Put the folder on any static host (Netlify, GitHub Pages, Cloudflare Pages) to publish it.

## Make your own version

1. **Settings:** edit `js/config.js` (name, ticker, links, contract, tax split, hashtags).
2. **Your character and art:** replace the images in `img/` and redraw the character in `js/art.js`. The Piggy Sats name, the Piggy character and the logo are not part of the license (see below).
3. **Credit:** keep the line "Chart Run engine by Piggy Sats" visible on the home screen.
4. **Updates:** when you publish a change, bump `VERSION` in `sw.js` so installed copies refresh.

### Leaderboards and Telegram

`apiUrl` in `js/config.js` is empty in this repository, so scores stay on the player's device. To run shared leaderboards or prizes you need your own server (not included). The server must check Telegram's signed `initData` with your bot token, rate-limit players and reject impossible scores. Never put a token or key in the game's files. See [SECURITY.md](SECURITY.md).

## License

[Chart Run License](LICENSE): MIT with two extra conditions.

- ✅ Use, change and publish it, for free, including commercially.
- 📣 Keep a visible "Chart Run engine by Piggy Sats" credit linking to [piggysats.fun](https://piggysats.fun).
- 🐷 Bring your own brand: the Piggy Sats name, $PIGSATS ticker, Piggy character and logo are not included.

Game sats are points, not real Bitcoin. The game never asks players to connect a wallet.
