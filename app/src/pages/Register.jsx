import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useWallet } from "../wallet.jsx";

// Onboarding screen. register() flips userData[msg.sender].isActive so the account can buy/like/list.
// It's self-service (no approval) — a documented limitation, fine for a course-scope demo.
export default function Register() {
  const { account, registered, connect, writeContract, refreshRegistered } = useWallet();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function register() {
    setMsg("");
    setBusy(true);
    try {
      const c = await writeContract();
      const tx = await c.register();
      await tx.wait();
      await refreshRegistered();
      setMsg("You're registered. You can now buy charges and like chargers.");
    } catch (e) {
      setMsg(e?.reason ?? e?.shortMessage ?? e?.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 520 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Register
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Registering marks your account active so you can pay for charges, like chargers, and list
        your own. One transaction, then you're in.
      </Typography>

      {msg && <Alert severity="info" sx={{ mb: 2 }}>{msg}</Alert>}

      {!account ? (
        <Button variant="contained" onClick={connect}>
          Connect wallet first
        </Button>
      ) : registered ? (
        <Alert severity="success">This account is already registered.</Alert>
      ) : (
        <Button variant="contained" onClick={register} disabled={busy}>
          {busy ? "Registering…" : "Register this account"}
        </Button>
      )}
    </Box>
  );
}
