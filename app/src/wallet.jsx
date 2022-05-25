import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, LOCAL_CHAIN } from "./config";

// One place for every bit of web3/MetaMask wiring. Pages never touch window.ethereum directly —
// they ask this context for the account, a read contract, or a write contract.
const WalletContext = createContext(null);
export const useWallet = () => useContext(WalletContext);

const hasMetaMask = () => typeof window !== "undefined" && Boolean(window.ethereum);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  // Read-only contract: talks straight to the local RPC, so the marketplace can load its data
  // even before the user connects a wallet. If the local chain isn't running, reads just fail
  // and the caller shows a "start the chain" message.
  const readContract = useCallback(() => {
    const provider = new JsonRpcProvider(LOCAL_CHAIN.rpcUrls[0]);
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, []);

  // Write contract: needs the connected MetaMask signer to send transactions.
  const writeContract = useCallback(async () => {
    if (!hasMetaMask()) throw new Error("MetaMask not found");
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, []);

  const refreshRegistered = useCallback(
    async (addr) => {
      const a = addr ?? account;
      if (!a) return;
      try {
        setRegistered(await readContract().isRegistered(a));
      } catch {
        // local chain probably isn't up yet; leave registration unknown
      }
    },
    [account, readContract]
  );

  const connect = useCallback(async () => {
    setError("");
    if (!hasMetaMask()) {
      setError("MetaMask isn't installed. Install it and point it at the Hardhat Local network.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accts = await provider.send("eth_requestAccounts", []);
      setAccount(accts[0]);
      await refreshRegistered(accts[0]);
    } catch (e) {
      setError(e?.message ?? "Failed to connect wallet");
    }
  }, [refreshRegistered]);

  // keep the UI in sync when the user switches accounts or networks in MetaMask
  useEffect(() => {
    if (!hasMetaMask()) return;
    const onAccounts = (accts) => {
      const next = accts[0] ?? null;
      setAccount(next);
      setRegistered(false);
      if (next) refreshRegistered(next);
    };
    const onChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [refreshRegistered]);

  const value = {
    account,
    registered,
    error,
    hasMetaMask: hasMetaMask(),
    connect,
    readContract,
    writeContract,
    refreshRegistered,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
