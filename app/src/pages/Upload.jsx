import { useState } from "react";
import { parseEther } from "ethers";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import { useWallet } from "../wallet.jsx";
import mapping from "../mapping.json";

// Host screen: (re)list a charger you own at a price. Maps to upload(id, price).
// price is entered in ETH and converted to wei with parseEther before the call, so units stay
// consistent with the contract (this mismatch was one of the original bugs).
export default function Upload() {
  const { account, registered, connect, writeContract } = useWallet();
  const [id, setId] = useState(1);
  const [price, setPrice] = useState("0.05");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const c = await writeContract();
      const tx = await c.upload(id, parseEther(price || "0"));
      await tx.wait();
      setMsg(`Charger #${id} listed at ${price} ETH.`);
    } catch (e2) {
      // "not your charger" if the slot is owned by someone else; "user not registered" if you skipped register
      setMsg(e2?.reason ?? e2?.shortMessage ?? e2?.message ?? "Listing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 520 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        List a charger
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Set the per-charge price for a charger you host. You can only (re)list a slot you own — in
        the seeded demo all 9 start owned by the deploying account.
      </Typography>

      {msg && <Alert severity="info" sx={{ mb: 2 }}>{msg}</Alert>}

      {!account ? (
        <Button variant="contained" onClick={connect}>
          Connect wallet first
        </Button>
      ) : !registered ? (
        <Alert severity="info">Register your account first, then come back to list a charger.</Alert>
      ) : (
        <Box component="form" onSubmit={submit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            label="Charger"
            value={id}
            onChange={(e) => setId(Number(e.target.value))}
          >
            {Object.entries(mapping).map(([cid, m]) => (
              <MenuItem key={cid} value={Number(cid)}>
                #{cid} — {m.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Price per charge (ETH)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputProps={{ inputMode: "decimal" }}
          />
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Listing…" : "List charger"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
