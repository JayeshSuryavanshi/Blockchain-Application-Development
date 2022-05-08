# Beacon — Peer-to-Peer EV Charger Sharing dApp

A blockchain application that opens up private EV charging stations — homes, restaurants,
garages — for public, rentable use. Hosts list their chargers and set prices in ERC20 tokens;
EV owners discover nearby availability and pay on-chain for a charge.

> **Course:** CSE 526 — Blockchain Application Development, University at Buffalo (Spring 2022)
> **Team Beacon:** Jayesh Kishor Suryavanshi · Fardin Apurbo

## Overview

A peer-to-peer network of shared EV chargers. Anyone can list a home charger for rent to earn
ERC20 tokens and help others drive electric. Hosts set availability and pricing on the web app;
drivers browse hosts and pay for a reliable charge — increasing the number of usable charging
points without requiring expensive new installations.

## Tech stack

- **Smart contracts:** Solidity (`>=0.4.22 <0.9.0`), compiled & migrated with **Truffle**
- **Frontend:** React 17, **Material UI (MUI 5)**, **web3.js**, React Router, React Query

## Repository layout

```
contracts/          Truffle project
  contracts/        Chargings.sol (the marketplace) + Migrations.sol
  migrations/       Truffle deployment scripts
  build/contracts/  Compiled ABIs / artifacts
app/                React frontend (MUI + web3.js)
report/             Beacon-Final-Report.pdf — full project report
```

## Smart contract — `Chargings`

The core contract models the charger marketplace:

- **Structs:** `Charging { owner, price, isListed, countLikes }`, `user { isActive }`
- **Access control:** modifiers for `onlyAdmin`, `registeredUser`, `verifyPrice`, `balanceCheck`
- **Actions:** `register` / `deregister`, `upload` (list a charger), `buyCharging` (pay a host),
  `addBalance` / `sendBalance`, `like` / `unlike`, and balance/address views
- Seeds an initial set of listed chargers in the constructor

## Getting started (contracts)

```bash
cd contracts
truffle compile
truffle migrate
```

## Note on the frontend

This archived copy preserves the complete **smart contract**, **compiled artifacts**, and the
**final report**. The React frontend is **partial** — `App.js` and the page components under
`app/src/pages/` were not preserved in this archive, so `npm start` will not compile as-is. The
`header.js` component, routing/state dependencies, and build config are included and reflect the
intended MUI + web3 structure. See the report for full screens, wireframes, and architecture.

## Report

The full write-up — abstract, UML use-case diagram, wireframes, contract design, and
architecture — is in [`report/Beacon-Final-Report.pdf`](report/Beacon-Final-Report.pdf).
