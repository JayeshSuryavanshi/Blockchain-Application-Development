# Setup — running Beacon locally

This is the full version of the quick start. It assumes you've used a terminal and MetaMask
before, but not that you know Hardhat.

## What you need

- **Node 18 or newer.** (The Truffle + `react-scripts@4` toolchain I started with does not run on
  Node 17+ — that's the whole reason I switched to Hardhat + Vite. If you're looking at the git
  history wondering why Truffle is gone, that's why.)
- **MetaMask** in your browser.

## 1. Start a local blockchain

```bash
cd contracts
npm install
npx hardhat node
```

`hardhat node` starts a local chain on `http://127.0.0.1:8545` and prints 20 test accounts, each
funded with 10000 ETH, along with their private keys. **Leave this terminal running.** You'll
import one of these accounts into MetaMask in a minute.

## 2. Deploy the contract

In a *second* terminal:

```bash
cd contracts
npm run deploy:local
```

This deploys `Chargings` and — importantly — writes the deployed address and the ABI into
`app/src/config.js`. The frontend reads that file, so you don't have to copy anything by hand.

On a fresh `hardhat node`, the address is deterministic: `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
If you restart the node, redeploy so the address stays in sync.

## 3. Run the frontend

In a *third* terminal:

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000.

## 4. Point MetaMask at the local chain

1. In MetaMask, add a network manually:
   - **Network name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** ETH
2. Import a test account: copy one of the private keys the `hardhat node` terminal printed →
   MetaMask → *Import account* → paste. (Use account #0 if you want to be the admin/host who owns
   the seeded chargers.)
3. Back in the app, click **Connect Wallet**, then **Register**.

Now you can like chargers and buy a charge. Buying sends the listed price straight to the host.

## Troubleshooting

- **"Couldn't reach the contract" on the marketplace.** The local chain isn't running or nothing's
  deployed. Do steps 1 and 2.
- **A transaction reverts with "user not registered".** Hit **Register** first — buying, liking,
  and listing all require it.
- **"wrong price" when buying.** The app sends exactly the listed price, so this usually means the
  `config.js` address is stale (you restarted the node without redeploying). Re-run
  `npm run deploy:local`.
- **MetaMask nonce / "already known" errors after restarting the node.** MetaMask caches account
  history. Settings → Advanced → *Clear activity tab data* for the imported account.
- **"Yours" on every Buy button.** You're connected as account #0, which owns all the seeded
  chargers, so you can't buy from yourself. Import a *different* test account to act as a driver.
- **Nothing installs / weird build errors on an old Node.** Use Node 18+. This won't run on the
  original Truffle + CRA toolchain.
