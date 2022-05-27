# Beacon — a peer-to-peer EV charger sharing dApp

Beacon lets people rent out their home EV chargers. A host lists a charger at a price, a driver
browses what's nearby, and pays the host on-chain for a single charge. Think Airbnb, but for the
charger in someone's garage.

I built this with a teammate for **CSE 526 (Blockchain Application Development)** at the University
at Buffalo. My first cut had the smart contract and a report but no working frontend — and, as I
found out, some genuinely scary bugs in the contract that slipped past the demo. This repo is the
version I actually finished: the frontend wired up, the contract bugs fixed, and the docs honest
about what was wrong. (If you want to see the rough starting point, it's in the earlier commits.)

> **Status:** works end-to-end on a local chain. Not deployed to a public testnet, not audited,
> not handling real money. It's a course project I finished properly, not a product.

## What it does

- A host **registers** and **lists** a charger with a per-charge price.
- A driver **browses** the 9 chargers (name + photo come from `mapping.json`; price, likes, and
  owner are read live from the contract).
- Drivers can **like / unlike** chargers.
- A driver **buys a charge** — their ETH goes straight to the host, pay-as-you-go.

That's the whole scope. There's no reputation system, no escrow, no scheduling. It's a prototype.

## Quick start

You need Node 18+ and MetaMask. Full walkthrough (with the MetaMask setup) is in
[`docs/SETUP.md`](docs/SETUP.md), but the short version is three terminals:

```bash
# 1. contracts — start a local chain and deploy
cd contracts && npm install
npx hardhat node                 # leave this running
npm run deploy:local             # in a second terminal; writes the address+ABI into app/src/config.js

# 2. app — run the frontend
cd app && npm install
npm run dev                      # http://localhost:3000
```

Then point MetaMask at the Hardhat network (`http://127.0.0.1:8545`, chain id `31337`), import one
of the test accounts Hardhat prints, connect, hit **Register**, and you can buy a charge.

> Heads up: the tooling I started with (Truffle + `react-scripts@4`) fights you on any recent Node
> — CRA 4's old webpack breaks on Node 17+, and it doesn't fail politely. Moving to Hardhat + Vite
> was step one of getting this to actually run.

## Tech stack

| Part | What I used | Why |
|------|-------------|-----|
| Contract | Solidity `0.8.19` | pinned it so builds are reproducible |
| Contract tooling | Hardhat | Truffle was painful on recent Node; Hardhat ships its own local chain |
| Web3 | ethers | clean wei handling, no bundler polyfill headaches |
| Frontend | React + Vite | `react-scripts@4` is broken on Node 17+; Vite just works |
| UI | MUI + react-router | kept from my first cut (the part that survived) |

## How it works (30 seconds)

The contract (`Chargings`) is the source of truth: for each charger id `1..9` it stores the owner,
price, whether it's listed, and a like count. The frontend reads that and joins it with
`app/src/mapping.json`, which supplies only the cosmetic name and image per id. So the chain owns
the *state*; `mapping.json` owns the *looks*; the UI stitches them together by id. There's more in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## What my first version got wrong

I'm leaving this section in because it's the honest part, and honestly it's the most interesting
part. My first contract *compiled and demoed fine*, which is exactly why I didn't notice it was
broken. What was actually wrong:

- **`buyCharging` didn't check that you paid.** It was `payable` but never looked at `msg.value`.
  It paid out of the *contract's* balance, to an address the caller passed in (so, themselves),
  scaled by `10**18`. In plain terms: you could "buy" a charge for free and have the contract pay
  *you*. In a real deployment that's a drain-the-contract bug. I had the guard modifiers written —
  they were sitting there **commented out**.
- **`sendBalance` had no access control at all.** Anyone could call it and move the contract's
  whole balance to any address. I deleted it; pay-as-you-go doesn't need the contract to hold funds.
- **The price units didn't line up.** Chargers were seeded as `10..90` (wei-ish) but the payout
  multiplied by `10**18` (treating them as whole ETH). Nothing was consistent.
- **Likes could go negative.** `countLikes` was an `int` and `unlike` just subtracted, so you could
  spam it below zero.

The finished contract fixes all of this: the buyer pays exactly the listed price, the money goes
straight to the host, the contract never custodies funds, units are wei everywhere, and likes are
one-per-account and can't go negative. Every one of these fixes is locked in by a test
(`contracts/test/Chargings.test.js`, 15 of them). See [`docs/DECISIONS.md`](docs/DECISIONS.md) for
the full before/after.

One more honest note: our report describes an **ERC-20 token** for payments. There is no ERC-20
contract in this repo — there never was. Payments are native ETH. The token was a design we wrote
up but never shipped, and I'm not going to pretend otherwise.

## What I'd do with more time

Roughly in order:

- Emit-driven UI. The frontend re-reads the contract after every transaction because my first
  contract had no events. I added events, but the UI still polls — wiring it to listen to events
  (or a subgraph) is the obvious next step.
- Real registration (a stake or an approval), so `registeredUser` is an actual trust boundary and
  not just a soft gate anyone can flip.
- Escrow + a dispute path, so a driver isn't just trusting the host's meter.
- Deploy to a public testnet and pin the address, so it's clickable instead of local-only.

## Repo layout

```
contracts/            Hardhat project
  contracts/Chargings.sol     the marketplace contract
  test/Chargings.test.js      15 tests, incl. the security fixes
  scripts/deploy.js           deploys + writes app/src/config.js
app/                  React + Vite frontend
  src/config.js               AUTO-GENERATED on deploy (address + ABI)
  src/wallet.jsx              all the MetaMask/ethers wiring
  src/mapping.json            cosmetic name+image per charger id
  src/pages/                  Marketplace, Register, Upload
report/               the CSE 526 final report (PDF)
docs/                 SETUP, ARCHITECTURE, DECISIONS
```

## Credits

CSE 526 Blockchain Application Development, University at Buffalo, Spring 2022. Team **Beacon** —
Jayesh Kishor Suryavanshi and Fardin Apurbo. The React scaffold was originally forked from a
"contacts" dApp tutorial (you can still find the fingerprints in the git history), then rebuilt.

## License

GPL-3.0 — matches the SPDX header the contract already carried.
