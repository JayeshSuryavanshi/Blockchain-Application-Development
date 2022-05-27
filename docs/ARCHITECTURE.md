# Architecture

Beacon is two halves that meet in one file.

```
   MetaMask (your wallet)
        │  signs transactions
        ▼
   ethers v6  ──────────────►  Chargings.sol   (the source of truth:
        ▲                        owner / price / isListed / likes
        │  reads state           per charger id 1..9)
        │
   React + Vite UI
        │  joins on-chain state with…
        ▼
   mapping.json   (cosmetic name + image per id)
```

The meeting point is **`app/src/config.js`** — it holds the deployed contract address and ABI, and
it's regenerated every time you deploy (`contracts/scripts/deploy.js` writes it). Nothing is
hand-copied, so the frontend and the on-chain contract can't drift apart.

## The contract (`contracts/contracts/Chargings.sol`)

Two pieces of state:

- `ChargingData[id] → { owner, price, isListed, countLikes }` for charger ids `1..9`.
- `userData[address] → { isActive }` — who has registered. (Read it through `isRegistered(addr)`,
  which returns a clean bool; the raw mapping getter is awkward because the struct has one field.)

Two roles:

- **Host:** `register()` → `upload(id, price)` to list a charger they own at a wei price.
- **Driver:** browse → `like`/`unlike` → `buyCharging(id)` with `msg.value == price` to pay the host.

The key design decision: **a charge is not a sale.** `buyCharging` pays the host and emits an
event, but does *not* transfer ownership or unlist the charger — the host keeps hosting it. (My
first version flipped ownership to the buyer, which never made sense for pay-as-you-go.)

Money never sits in the contract. `buyCharging` forwards the buyer's own `msg.value` straight to
the host with a checked low-level `call`, and there's no function that lets anyone withdraw a
pooled balance. That's deliberate — it's what makes the old drain bugs impossible.

## The frontend (`app/src/`)

- **`wallet.jsx`** — a React context that owns every bit of web3. It exposes `connect()`, the
  current `account`, whether it's `registered`, a read-only contract (talks to the RPC directly, so
  the marketplace loads before you connect a wallet), and a write contract (needs the MetaMask
  signer). Pages never touch `window.ethereum` themselves.
- **`pages/Marketplace.jsx`** — loads all 9 chargers, joins each with `mapping.json` by id, and
  renders a card grid with like / unlike / buy.
- **`pages/Register.jsx`** — one button, calls `register()`.
- **`pages/Upload.jsx`** — a form that calls `upload(id, price)`, converting the ETH you type into
  wei with `parseEther` so units match the contract.
- **`components/Header.jsx`** — nav + the connect button / account chip.

## Why the UI polls instead of listening

My first contract emitted no events, so the original plan (had there been one) would have had to
re-read the getters after every action. I added events later, but the frontend still uses the
simpler pattern: after a transaction confirms (`await tx.wait()`), it just re-reads
`ChargingData(id)` and redraws. It works and it's easy to follow. Listening to the events (or
indexing them with something like The Graph) is the cleaner approach and is on the roadmap — but
for 9 chargers on a local chain, polling after a tx is honestly fine.

## Known gaps

- Registration is self-service — anyone can flip themselves active, so `registeredUser` is a soft
  gate, not real trust.
- In the seeded demo all 9 chargers are owned by the deploying account, so the host-listing flow is
  really "re-price your own charger" unless you deploy differently.
- No escrow, no reputation, no scheduling, native ETH only (no ERC-20 despite what the report says).
