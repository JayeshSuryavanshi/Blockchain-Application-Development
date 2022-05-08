import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";

import LocalCharging from "@mui/icons-material/LocalCharging";

export default function Header() {
  let navigate = useNavigate();

  //handle route change ,reroutes to home
  const routeChangeHome = () => {
    let path = "/";
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar style={{background:"orange"}} position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{color:"black", flexGrow: 1 }}>
            <center>EV Charging</center>
          </Typography>
          <LocalCharging
            onClick={() => {
              routeChangeHome();
            }}
          />
        </Toolbar>
      </AppBar>
    </Box>
  );
}
