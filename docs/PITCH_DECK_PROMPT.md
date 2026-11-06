# Nova — Claude prompt for the winning pitch deck

How to use:
1. Capture the screenshots listed in "SCREENSHOT SHOT LIST" below (run `npm run dev`, open http://localhost:3000, 1440x900 browser window, 100% zoom).
2. Open Claude, attach the screenshots, and paste everything under the line `=== PASTE FROM HERE ===`.
3. If Claude can create files, ask it for a `.pptx`. Otherwise ask for the slide-by-slide text and paste it into Gamma, Canva, or Google Slides.

---

=== PASTE FROM HERE ===

You are a world-class startup pitch-deck designer and storyteller. You have helped teams win fintech and crypto hackathons. Build me a winning pitch deck for **Nova**, which I am presenting at a **Roqqu-sponsored hackathon**. The judges are Roqqu staff and partners, so they care about:
- real use of Roqqu's API
- Nigerian market fit
- a clear product
- a working demo
- a believable path to users and revenue

## 1. The product (source of truth, do not contradict)

**Nova is a prediction market built for Nigerians.**
- Users trade YES/NO on real-world questions across crypto, finance, sports, politics, technology and pop culture (BBNaija).
- Examples: "Will the naira close below ₦1,400 per US dollar by Dec 31, 2026?", "Will Nigeria's inflation fall below 15%?", "Will Arsenal win the Premier League?", "Will Bitcoin close above $150,000?"
- Odds are simple pool odds, shown as a probability (for example 58% YES). Stakes set the price. There is no order book.
- When a market closes, the creator posts the YES or NO result. Winners share the losing pool, minus a 2% fee.
- Private, invite-only markets: friends, communities and syndicates can run their own markets, unlocked with an invite code.

**The problem we solve:** Nigerians already bet on everything, and are among the world's most active crypto users. But:
1. Existing prediction markets (such as Polymarket) are built for the US and Europe. They need USD bank accounts, crypto wallets, gas fees and KYC friction.
2. Local betting is limited to football and casino-style games, with no markets on the economy, the naira, politics or tech.
3. Getting money in and out is the hardest part. People don't want to learn wallets or bridges.

**Our answer:** the whole money flow runs through **Roqqu**, so a user never needs to understand crypto to take part. They pay in naira, trade, and cash out to USDT.

## 2. How we use Roqqu (the core of the pitch, make this prominent)

Nova integrates the **Roqqu RAS API**. Show it as one loop:

1. **Fund in naira, USDT or BTC:** `POST /payment-links` creates a Roqqu hosted payment link. The user pays in NGN, USDT (TRC20/BEP20) or BTC.
2. **Instant credit via webhook:** Roqqu sends an encrypted webhook (`payment_link_completed`, AES-256-CTR). Nova decrypts it, verifies it, and credits the user's balance. This is idempotent, so a replayed event never double-credits.
3. **Live prices and naira rate:** `GET /tokens` and `GET /rates` power a "Roqqu live" chip on crypto markets (BTC price plus the naira rate) and a "price evidence" block when a market is resolved.
4. **Treasury visibility:** `POST /balances` and `POST /history` show the Roqqu treasury wallet and its activity.
5. **Cash out in USDT:** `POST /wallets/send` sends winnings to any TRC20 or BEP20 address. There is a 1% fee preview, address validation, min $5 and max $5,000, and status tracking through `GET /transaction/refId/:refid`.

### Accounts and retention (include on the Roqqu slide and the roadmap slide)
- Users **sign in with their Roqqu email** (one-time code, no passwords, no crypto wallet to install). A Roqqu-powered Nova wallet is created automatically.
- Their **balance and activity are saved to their account**, so they come back to the same wallet on any device. That is the retention loop: fund once, return to trade, cash out to USDT.
- Be precise: the wallet is a Nova account backed by Roqqu payments and payouts. It is not a separate account that Roqqu issues to each user.

Key line for the deck: **"Roqqu is the cashier of Nova. Every naira in and every dollar out flows through Roqqu."**

### Honesty rule (important)
Roqqu's sandbox credentials were not available during the hackathon, so the integration is built to the published RAS API spec and runs in a **faithful simulation mode** (simulated hosted checkout, simulated webhook, simulated treasury). The only thing that changes to go live is setting `ROQQU_API_KEY` and `ROQQU_MODE=live`. Do NOT claim real money has moved or that we have live Roqqu users. Say "built to Roqqu's API spec, running in sandbox mode today, live with one config change." Say this once, confidently, on the architecture or roadmap slide. Don't hide it and don't apologise for it.

## 3. Positioning rules
- Position Nova purely as **"prediction markets for Nigeria, powered by Roqqu."**
- **Never call Nova a "hackathon project", "demo" or "prototype" anywhere in the deck or script.** It is a startup product in **private beta**. The hackathon is only the room we're pitching in, so don't mention it on slides. Describe the Roqqu payments as running in "sandbox mode" and the live launch as the next milestone.
- Keep the deck about the product, the Nigerian market and the Roqqu integration.
- Do **not** put blockchain-network branding in the deck (no chain logos, no wallet names). If you need an architecture slide, say "smart-contract settlement layer, on the roadmap." If a judge asks which chain, I will answer honestly in Q&A.
- Do not invent statistics. For market-size claims, use only widely reported figures (for example Nigeria consistently ranking among the top countries in global crypto adoption indexes, and the size of Nigerian sports betting). Mark every external number with **[VERIFY]** so I can check it before presenting. Don't make up user counts, revenue or partnerships.

## 4. Brand and design direction
- **Look:** black background `#000000`, accent yellow `#FDDA24`, off-white text, green `#5CB87A` for YES and red `#D95C5C` for NO. Clean, modern, premium fintech. Think Linear, Stripe or Robinhood.
- **Type:** large, bold, geometric sans (for example DM Sans or Inter). Use a mono font for numbers and labels.
- Generous whitespace, one idea per slide, big numbers, minimal bullets (max 3 per slide, max 8 words each).
- Screenshots go inside clean device frames (browser window for desktop, phone for mobile) with a subtle yellow glow. Don't stretch or crop them awkwardly.
- Add a subtle Nigerian touch (naira ₦ symbol, green-white-green accent line or Lagos skyline silhouette) without clichés.

## 5. Slide-by-slide structure (12 slides + 2 backup)

For EACH slide give me:
**(a)** slide title (an insight headline, not a label)
**(b)** exact on-slide copy
**(c)** which screenshot to use and how to frame it
**(d)** layout and visual direction
**(e)** 2 to 4 sentences of speaker notes (about 20 seconds each)

1. **Cover:** "Nova: call it. back it. cash out." Tagline: Prediction markets for Nigeria, powered by Roqqu.
2. **Hook:** open with a relatable question ("Will the naira hit ₦1,400 by December? Everyone has an opinion. Nobody can back it.") that leads into the problem.
3. **The problem:** 3 pain points (global platforms aren't built for Nigeria, local betting is football-only, money in/out is painful).
4. **The solution:** one sentence plus the home screen (markets grid).
5. **How it works:** 4 steps (Pick, Fund, Trade, Cash out) as a simple visual flow.
6. **Product demo (market):** market detail page with the odds, the YES/NO panel and the Roqqu live price chip.
7. **Roqqu integration (hero slide):** the full money loop as a diagram. Show the 5 Roqqu endpoints we use as labelled nodes: payment-links, webhook, tokens/rates, balances/history, wallets/send. Use the funding screen and the simulated checkout screenshots.
8. **Why Nigeria, why now:** adoption, naira volatility as a reason people want to hedge or speculate, mobile-first, stablecoin demand **[VERIFY all figures]**.
9. **Private markets:** invite-only markets for friends, communities and creators. Include the Private tab screenshot. Frame it as a growth loop (every private market brings in its own friends).
10. **Business model:** 2% fee on payouts, 1% cash-out fee, plus a path to sponsored markets and creator revenue share. Include a simple illustrative unit-economics example, clearly labelled as illustrative.
11. **Traction and roadmap:** what is built today (public and private markets, the full Roqqu money loop in simulation, the resolver flow, live price evidence), and what comes next (live Roqqu keys, KYC and compliance via Roqqu, mobile PWA, hidden amounts, on-chain settlement). Be honest about what is simulated.
12. **The ask and close:** what we want (a Roqqu partnership, sandbox/production keys, pilot users) and a memorable closing line. Add a QR code placeholder to the live demo or repo.
- **Backup A:** architecture diagram.
- **Backup B:** risks and how we handle them (resolution trust, regulation, fraud). Be honest, for example creator-resolved markets today and moving to oracle or multi-signer resolution.

## 6. Screenshot shot list (I will attach these, number them in your answer)

Capture at 1440x900 with the app running at http://localhost:3000. The app is in demo mode and the balance lives in the browser, so do the funding flow first.
- **S1:** Home page, hero and featured market (`/`)
- **S2:** Home page, "Browse markets" grid with category tabs (`/`, scroll down)
- **S3:** Naira market detail page with the YES/NO panel (`/market/6`)
- **S4:** Bitcoin market with the "Roqqu live · BTC $… · ₦…" chip (`/market/1`)
- **S4b:** Sign-in page with the one-time code step (`/signin`)
- **S5:** Funding page with naira amount, quote and "Pay with Roqqu" (`/fund`)
- **S6:** Simulated Roqqu Pay checkout with deposit addresses (`/fund/checkout/<ref>`)
- **S7:** "Payment confirmed by Roqqu, +$10.00 added" state (`/fund` after paying)
- **S8:** Cash-out card showing "Sent on-chain" with fee, net amount and tx hash (`/fund`)
- **S9:** Private markets tab (`/` then the Private filter)
- **S10:** Create-a-market page with the private/invite toggle (`/create`)
- **S11 (optional):** mobile view of S3 or S5

If any screenshot is missing, tell me exactly which one and give me a clean placeholder frame with a caption.

## 7. Output format
1. First, a **one-paragraph narrative** of the deck's story arc.
2. Then the **12 + 2 slides** in the structure above.
3. Then a **90-second elevator pitch** and a **3-minute pitch script** that matches the slides.
4. Then the **10 toughest judge questions** with strong, honest answers. Include: "Is the Roqqu integration live?", "How do you resolve markets fairly?", "Is this legal in Nigeria?", "Why would people trust a new platform?", "What's your moat?"
5. If you can create files, produce a polished **.pptx** using the brand rules above, with the screenshots placed in device frames. Otherwise, give me copy I can paste straight into Gamma, Canva or Google Slides, plus a short design spec (colors, fonts, spacing).

Make it bold, specific and memorable. Cut anything generic. Write for judges who've seen 50 decks today.

=== END OF PROMPT ===
