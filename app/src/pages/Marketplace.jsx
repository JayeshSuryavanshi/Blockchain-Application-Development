import { useEffect, useState, useCallback } from "react";
import { formatEther } from "ethers";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import mapping from "../mapping.json";
import { useWallet } from "../wallet.jsx";

// The browse-and-transact home screen. On-chain ChargingData gives price/likes/owner/isListed;
// mapping.json supplies only the cosmetic name + image. We join the two by charger id (1..9).
export default function Marketplace() {
  const { account, registered, readContract, writeContract, refreshRegistered } = useWallet();
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // id currently mid-transaction
  const [msg, setMsg] = useState("");
  const [chainDown, setChainDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setChainDown(false);
    try {
      const c = readContract();
      const count = Number(await c.CHARGER_COUNT());
      const rows = [];
      for (let id = 1; id <= count; id++) {
        const d = await c.ChargingData(id);
        const meta = mapping[id] ?? {};
        const mine = account && d.owner.toLowerCase() === account.toLowerCase();
        rows.push({
          id,
          name: meta.name ?? `Charger #${id}`,
          image: meta.ChargingLoc,
          owner: d.owner,
          priceWei: d.price,
          priceEth: formatEther(d.price),
          isListed: d.isListed,
          likes: Number(d.countLikes),
          youLiked: account ? await c.liked(id, account) : false,
          mine,
        });
      }
      setChargers(rows);
    } catch {
      setChainDown(true);
    } finally {
      setLoading(false);
    }
  }, [account, readContract]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id, fn) {
    setMsg("");
    setPending(id);
    try {
      const c = await writeContract();
      const tx = await fn(c);
      await tx.wait(); // no events-driven refresh in this contract, so we re-read after the tx
      await load();
      await refreshRegistered();
    } catch (e) {
      // ethers surfaces the revert reason here (e.g. "wrong price", "user not registered")
      setMsg(e?.reason ?? e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setPending(null);
    }
  }

  const buy = (row) => run(row.id, (c) => c.buyCharging(row.id, { value: row.priceWei }));
  const like = (row) => run(row.id, (c) => c.like(row.id));
  const unlike = (row) => run(row.id, (c) => c.unlike(row.id));

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (chainDown) {
    return (
      <Alert severity="error">
        Couldn't reach the contract. Start the local chain and deploy it: run{" "}
        <code>npx hardhat node</code> then <code>npm run deploy:local</code> in <code>contracts/</code>.
        See <code>docs/SETUP.md</code>.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Available chargers
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Pay a host for a single charge. Prices are per charge, paid in ETH straight to the host.
      </Typography>

      {!account && <Alert severity="info" sx={{ mb: 2 }}>Connect your wallet to like or buy.</Alert>}
      {account && !registered && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You're connected but not registered yet — head to Register to enable buying and liking.
        </Alert>
      )}
      {msg && <Alert severity="warning" sx={{ mb: 2 }}>{msg}</Alert>}

      <Grid container spacing={3}>
        {chargers.map((row) => {
          const busy = pending === row.id;
          const canAct = Boolean(account) && registered && !busy;
          return (
            <Grid item xs={12} sm={6} md={4} key={row.id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {row.image && (
                  <CardMedia component="img" height="160" image={row.image} alt={row.name} />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {row.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {row.priceEth} ETH / charge
                  </Typography>
                  {row.mine && (
                    <Typography variant="caption" color="success.main">
                      You host this charger
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                      size="small"
                      disabled={!canAct}
                      onClick={() => (row.youLiked ? unlike(row) : like(row))}
                      color="error"
                    >
                      {row.youLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <Typography variant="body2">{row.likes}</Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!canAct || row.mine || !row.isListed}
                    onClick={() => buy(row)}
                  >
                    {busy ? "Working…" : row.mine ? "Yours" : "Buy a charge"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
