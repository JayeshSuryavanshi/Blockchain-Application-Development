import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LocalCharging from "@mui/icons-material/ChargingStation";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useWallet } from "../wallet.jsx";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

const NAV = [
  { label: "Marketplace", to: "/" },
  { label: "Register", to: "/register" },
  { label: "List a charger", to: "/upload" },
];

export default function Header() {
  const { account, connect } = useWallet();
  const { pathname } = useLocation();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ background: "#f59e0b" }}>
        <Toolbar>
          <LocalCharging sx={{ color: "black", mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ color: "black", fontWeight: 700, mr: 3 }}>
            Beacon
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
            {NAV.map((n) => (
              <Button
                key={n.to}
                component={RouterLink}
                to={n.to}
                sx={{
                  color: "black",
                  fontWeight: pathname === n.to ? 700 : 400,
                  textDecoration: pathname === n.to ? "underline" : "none",
                }}
              >
                {n.label}
              </Button>
            ))}
          </Box>

          {account ? (
            <Chip label={short(account)} sx={{ background: "black", color: "#f59e0b", fontWeight: 600 }} />
          ) : (
            <Button variant="contained" onClick={connect} sx={{ background: "black", color: "#f59e0b" }}>
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
