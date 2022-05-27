# Decisions — what I changed from my first version, and why

A short log of the choices I made finishing this, so the project is transparent about what changed
between my rough first cut (the early commits) and the version that actually works. I'm keeping it
because I don't want anyone to think the first submission was a working, safe app — it wasn't.

## Contract: bug fixes (this is the important part)

| # | First version | Now |
|---|---------------|-----|
| buy | `buyCharging(id, toAddress)` was `payable` but ignored `msg.value`; paid `price * 1e18` from the **contract's** balance to a caller-supplied address; flipped ownership to the buyer | `buyCharging(id)` requires `msg.value == price` and forwards the buyer's own ETH to the stored host; ownership unchanged |
| drain | `sendBalance(to, price)` had no access control — anyone could empty the contract | deleted; pay-as-you-go never holds funds, so there's nothing to drain |
| units | prices seeded as `10..90`, payout scaled by `1e18` — inconsistent | wei everywhere; seeded `0.01..0.09 ETH`; frontend uses `parseEther` |
| likes | `int countLikes`, `unlike` could go negative and likes were unbounded | `uint`, one like per `(charger, account)` tracked in a `liked` mapping |
| guards | `verifyPrice` / `balanceCheck` / `registeredUser` written but commented out of the buy path; `balanceCheck` was a no-op anyway | real inline checks; dead modifiers removed |
| upload | anyone could overwrite any listing | only the current owner can re-list a taken slot |
| misc | deprecated `.transfer`, legacy `constructor() public payable`, no events | checked `.call`, `constructor()`, and events on every state change |

All of this is pinned by `contracts/test/Chargings.test.js` (15 tests). If a fix regresses, a test
goes red.

## Toolchain: switched so it actually runs

- **Truffle → Hardhat.** Truffle got painful on recent Node. Hardhat runs fine, ships its own local
  chain (no separate Ganache), and pins solc `0.8.19` so builds are reproducible.
- **web3.js → ethers.** All my web3 connection code was missing anyway, so there was nothing to
  preserve — ethers handles wei cleanly and doesn't need bundler polyfills.
- **`react-scripts@4` → Vite.** CRA 4 is broken on Node 17+. Vite runs with no legacy flags and a
  far smaller install.
- **Dependency cleanup.** Renamed the package from `contacts` (the tutorial I forked it from),
  dropped `@material-ui/core` v4 (nothing imported it; the app is MUI v5), removed `react-scripts`
  and `web-vitals`.

## Reconstructed from scratch (was missing entirely)

`App.jsx`, `main.jsx`, `wallet.jsx`, `config.js`, and all three pages (`Marketplace`, `Register`,
`Upload`) didn't exist in my first cut — `index.js` imported an `App` that wasn't there. Only
`header.js` and `mapping.json` survived, and both were reused (header rewritten as `Header.jsx`
with real nav + a connect button).

## Deliberately *not* changed

- The data model and function names (`ChargingData`, `register`, `upload`, `buyCharging`,
  `like`/`unlike`) — kept recognizable from the report.
- The native-ETH payment model — the report's ERC-20 design was never built, and building a real
  token was out of scope for "finish the thing that exists." It's noted as a limitation, not hidden.
- The 9 seeded chargers and their `mapping.json` names/images.
