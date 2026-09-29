# Security

Chart Run is a static browser game: HTML, CSS and JavaScript with no build step, no dependencies and no secrets. Nothing in this repository can reach or control a server by itself.

## Found a problem?

Please report it privately, not in a public issue:

- GitHub: **Security → Report a vulnerability** on this repository, or
- X: DM [@MGMetaverse](https://x.com/MGMetaverse)

## If you run your own copy

- **Never put a bot token, API key or password in the game's files.** Everything in `js/` is downloaded by every player's browser.
- **Scores sent from a browser can be faked.** If you save scores on a server, verify who sent them there (for a Telegram Mini App, check the signed `initData` with your bot token on the server, as described in Telegram's docs), limit how often one player can submit, and reject impossible scores.
- **Prizes:** keep them free to enter, and review the top scores by hand before paying out.
