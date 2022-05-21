require("@nomicfoundation/hardhat-toolbox");

/**
 * Hardhat replaces the original Truffle setup, which doesn't run on modern Node.
 * `npx hardhat node` spins up a local chain with funded test accounts; the deploy
 * script and the frontend both point at http://127.0.0.1:8545 (chainId 31337).
 */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // in-process chain used by `hardhat test`
    hardhat: {},
    // the standalone node you run with `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};
