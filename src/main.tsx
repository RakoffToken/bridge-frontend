import React, { Dispatch, SetStateAction, useContext} from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { createContext, useState } from 'react'
import { AppBar, Drawer, IconButton, List, ListItem, ListItemText, MenuItem, Toolbar } from '@material-ui/core'
import { NavLink, Outlet} from 'react-router-dom'
import { createTheme, ThemeProvider } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { ConnectedWallet, KeplrController, WalletType } from 'cosmes/wallet';
import CloseIcon from '@mui/icons-material/Close';
import { CHAINS, getChainIds } from './utils'
import { Select, SelectChangeEvent } from '@mui/material'
import { App } from './App'
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

const WC_PROJECT_ID = "dced411346559f847a4aa0425d0bc122";
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
        await CONTROLLER.connect(WalletType.EXTENSION, [chainInfo]);
      }
      setConnected(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function disconnect() {
    try {
      await CONTROLLER.disconnect(getChainIds());
      setConnected(false);
    } catch (err) {
      console.error(err);
    }
  }

  const c = (_wallets: ConnectedWallet[]) => {
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
