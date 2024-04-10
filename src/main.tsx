import React, { Dispatch, SetStateAction, useContext, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
//import App from './App.tsx'
import './index.css'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { createContext, useState } from 'react'
import { AppBar, Drawer, IconButton, List, ListItem, ListItemText, MenuItem, Toolbar, useEventCallback } from '@material-ui/core'
import { BrowserRouter, NavLink, Outlet, Route, Router, Routes } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@material-ui/core/styles'
import MenuIcon from '@material-ui/icons/Menu'
import { Button } from '@material-ui/core'
import { Typography } from '@material-ui/core'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { ChainInfo, ConnectedWallet, KeplrController, WalletType } from 'cosmes/wallet';
import CloseIcon from '@mui/icons-material/Close';
import { Buffer } from 'buffer';
import { getCw20Balance } from 'cosmes/client'
import { getLcd, CHAINS, getChainIds } from './utils'
import { Select, SelectChangeEvent } from '@mui/material'
import BalanceCard from './BalanceCard'
import { Bridge } from './pages/Bridge'
import { App } from './App'
import Notification from './Notification'
import { RecoilRoot } from 'recoil'

const drawerWidth = 240;



const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  toolbar: theme.mixins.toolbar,
}));

type ChainContextType = {
  chainId: [string, Dispatch<SetStateAction<string>>];
  connected: [boolean, Dispatch<SetStateAction<boolean>>];
};

const ChainContext = createContext<ChainContextType>({
  chainId: ["columbus-5", () => {}], // Initial value and setter function
  connected: [false, () => {}], // Initial value and setter function
});

export const useChain = () => {
  const ctx = useContext(ChainContext);
  return ctx;
};

const ChainProvider = ({ children }: { children: React.ReactNode }) => {

  const [chainId, setChainId] = useState(CHAINS[0].chainId);
  const [connected, setConnected] = useState(false);
  const [wallets, setSelectedWallets] = useState<ConnectedWallet[] | null>(null);

  return (
    <ChainContext.Provider value={{
      chainId: [chainId, setChainId],
      connected: [connected, setConnected]
    }}>
      {children}
    </ChainContext.Provider>
  )
};

const Sidebar = () => {
  return (
    <List>
      <ListItem button component={NavLink} to="/bridge">
        <ListItemText primary="Bridge" />
      </ListItem>
    </List>
  );
};

const WC_PROJECT_ID = "2b7d5a2da89dd74fed821d184acabf95";
export const CONTROLLER = new KeplrController(WC_PROJECT_ID);

export const Home = () => {
  
  const classes = useStyles();
  const chain = useChain();
  const [connected, setConnected] = chain.connected as [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  const [chainId, setChainId] = chain.chainId as [string, React.Dispatch<React.SetStateAction<string>>];

  async function handleChangeChainId(e: SelectChangeEvent<string>) {
    setChainId(e.target.value as string);
  }
  
  // connect to all chains
  async function connect() {
    try {
      for (let chain of CHAINS) {
        const chainInfo = {
          chainId: chain.chainId,
          rpc: chain.rpc,
          gasPrice: chain.gasPrice
        };
        const res = await CONTROLLER.connect(WalletType.EXTENSION, [chainInfo]);
        
      }
      setConnected(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function disconnect() {
    try {
      const res = await CONTROLLER.disconnect(getChainIds());
      setConnected(false);
    } catch (err) {
      console.error(err);
    }
  }

  const c = (wallets: ConnectedWallet[]) => {
    setConnected(false);
    connect();
  }
  
  CONTROLLER.onAccountChange(c);
  
  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            <b>Rakoff</b>Bridge
          </Typography>
          <IconButton>
          {connected ? (
              <CloseIcon
                color="inherit"
                onClick={disconnect}
              />
            ) : (
              <AccountBalanceWalletIcon
                color="inherit"
                onClick={connect}
              />
            )}
          </IconButton>
          <Select
            color='primary'
            style={{ width: 350, height: 40, background: 'white', marginLeft: 30 }}
            value={chainId}
            onChange={(e: SelectChangeEvent<string>) => handleChangeChainId(e)}
          >
            {
              getChainIds().map((chainId) => {
                return (
                  <MenuItem key={chainId} value={chainId}>
                    {chainId}
                  </MenuItem>
                )
              })
            }
          </Select>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.toolbar} />
        <Sidebar />
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Outlet />
      </main>
    </div>
  );
}

export default function AppWithRouter() {
  const theme = createTheme();
  return (
    <ThemeProvider theme={theme}>
      <ChainProvider>
        <App />
      </ChainProvider>
    </ThemeProvider>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <RecoilRoot>
        <AppWithRouter />
      </RecoilRoot>
    </React.StrictMode>
  );
}
