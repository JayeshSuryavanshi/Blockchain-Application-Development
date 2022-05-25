import { Routes, Route } from "react-router-dom";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import Header from "./components/Header.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import Register from "./pages/Register.jsx";
import Upload from "./pages/Upload.jsx";
import { useWallet } from "./wallet.jsx";

// Root component index/main.jsx renders. Header + routes; the wallet lives in WalletProvider above.
export default function App() {
  const { error } = useWallet();
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Container>
    </>
  );
}
