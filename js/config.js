/* ==========================================================================
   CHART RUN — project settings
   Everything that belongs to Piggy Sats lives here. Change it here and the
   game, the share card and every button follow.
   ========================================================================== */
var PROJECT = {
  name:        'Piggy Sats',
  ticker:      '$PIGSATS',
  chain:       'Arc',
  siteUrl:     'https://piggysats.fun/',
  buyUrl:      'https://argus.world/token/0xeF7e29A61996f7eed5cC53352B0296E7b60B09eB',
  anyChainUrl: 'https://app.debridge.com/?inputChain=7565164&outputChain=5042&inputCurrency=&outputCurrency=0xeF7e29A61996f7eed5cC53352B0296E7b60B09eB&dlnMode=simple',   // deBridge: buy from another chain. Empty = hidden
  telegramUrl: 'https://t.me/piggysats',
  xHandle:     'piggysats',
  gameUrl:     'https://piggysats.fun/game/',   // where the game is hosted. Empty = this page
  contract:    '0xeF7e29A61996f7eed5cC53352B0296E7b60B09eB',   // $PIGSATS on Arc, shown with a copy button
  hashtags:    ['PiggySats'],
  dailyEpoch:  '2026-09-24',               // Daily Run #1 (UTC). Everyone gets the same levels each day, new one at 00:00 UTC.
  apiUrl:      '',   // the bot's Worker: saves runs played inside Telegram. Empty = off
  tgAppUrl:    '',        // the Mini App's direct link (registered in @BotFather); challenge links inside Telegram use it. Empty = off

  // The real tax split, used by the game and the explainer bar
  taxPct:      2,
  split:       { holders: 81, liquidity: 9, argus: 10 }
};
