import React, { useState, useRef, useEffect, SetStateAction, Dispatch } from 'react';
import { TextField, Button, Typography, Container, Slider, Card, CardContent, Grid, Select, MenuItem } from '@material-ui/core';
import { CONTROLLER, useChain} from './main';
import { getBalance, getBridgeMessage, getChainIds, getChainsTokens, getDecimals } from './utils';
import { useNotifications } from './App';

/*interface BalanceCardProps {
  // Define your props here
  token: string;
}*/

const marks = [
  { value: 0 },
  { value: 5},
  { value: 25 },
  { value: 50 },
  { value: 75 },
  { value: 95 },
  { value: 100 },
];

const BalanceCard: React.FC = () => {
  
  //const token = props.token;
  const cardRef = useRef<HTMLDivElement>(null);

  // State for current balance, amount to send, and address to send
  const [balance, setBalance] = useState<number>(100000); // Initial balance with English-style separation
  const [amountToSend, setAmountToSend] = useState<number>(0);
  const [displayAmountToSend, setDisplayAmountToSend] = useState<string>('0');
  const [sendToAddress, setSendToAddress] = useState<string>('');
  const [balanceDisplay, setBalanceDisplay] = useState<string>('');
  const [targetChainId, setTargetChainId] = useState<string>('migaloo-1');
  const [selectibleChains, setSelectibleChains] = useState<string[]>([]);
  const [decimals, setDecimals] = useState<number>(0);

  const chain = useChain();
  const [chainId, _setChainId] = chain.chainId as [string, Dispatch<SetStateAction<string>>];
  const [connected, _setConnected] = chain.connected as [boolean, Dispatch<SetStateAction<boolean>>];
  //const [selectedWallets, setSelectedWallets] = useState<ConnectedWallet[]>([]);
  const [updated, setUpdated] = useState<boolean>(false);
  const [selectibleTokens, setSelectibleTokens] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const {addNotification} = useNotifications();

  useEffect(() => {
    let selectible = getChainsTokens(chainId).map((t) => t.symbol);
    setSelectibleTokens(selectible);
    setSelectedToken(selectible[0]);
    console.log(selectible);
  }, [chainId, connected]);

  useEffect(() => {

    getDecimals(chainId, selectedToken)
      .then((res) => {
        console.log("fetched decimals");
        console.log(decimals);
        console.log(res);
        setDecimals(res);
      })
      .catch((err) => {
        console.log(err);
        setDecimals(0);
      });
    
    console.log(updated);
    setUpdated(false);
    if (!connected) {
      setBalance(0);
      setBalanceDisplay('0');
      return;
    }
    const holder = CONTROLLER.connectedWallets.get(chainId)?.address;
    const bal = getBalance(chainId, selectedToken, holder || "");
    bal
      .then((res) => {
        console.log(res);
        const balanceString = Number((res/Math.pow(10, decimals)).toFixed(2)).toLocaleString('en-US', {minimumFractionDigits: 2})
        setBalance(res);
        setBalanceDisplay(balanceString);
      })
      .catch((err) => {
        console.log(err);
        setBalance(0);
        setBalanceDisplay('0');
      });
  }, [balance, connected, chainId, updated, selectedToken]);

  useEffect(() => {
    const chainIds = getChainIds();
    const selectible = chainIds.filter((cid) => cid !== chainId);
    if (targetChainId === chainId) {
      setTargetChainId(selectible[0]);
    }
    setSelectibleChains(selectible);
  }, [chainId]);

  // Function to handle form submission
  const handleSubmit = async (_: React.FormEvent) => {
    const wallet = CONTROLLER.connectedWallets.get(chainId);
    const sender = CONTROLLER.connectedWallets.get(chainId)?.address || "";
    const msg = getBridgeMessage(
      chainId,
      targetChainId,
      selectedToken,
      amountToSend.toString(),
      sender,
      sendToAddress,
    )
    if (msg === undefined) {
      console.log("msg is undefined");
      return;
    }
    
    console.log(msg)
    const tx = {
      msgs: [msg],
      memo: '',
    };
    console.log(tx);

    try {
      if (wallet === undefined) {
        console.log("wallet is undefined");
        return;
      }
      //const defaultFee = {gas: 0, amount: {amount: '0', denom: 'uluna'}};
      const fee = await wallet.estimateFee(tx, 1.8);
      const txHash = await wallet?.broadcastTx(tx, fee);
      wallet?.pollTx(txHash)
        .then((_res) => {
          const holder = CONTROLLER.connectedWallets.get(chainId)?.address;
          getBalance(chainId, selectedToken, holder || "")
            .then((res) => {
              console.log(res);
              const balanceString = Number((res/Math.pow(10, decimals)).toFixed(2)).toLocaleString('en-US', {minimumFractionDigits: 2})
              setBalance(res);
              setBalanceDisplay(balanceString);
            })
            .catch((err) => {
              console.log(err);
            });
          addNotification(`${txHash} confirmed`);
        })
        .catch((err) => {
          const holder = CONTROLLER.connectedWallets.get(chainId)?.address;
          getBalance(chainId, selectedToken, holder || "")
            .then((res) => {
              console.log(res);
              const balanceString = Number((res/Math.pow(10, decimals)).toFixed(2)).toLocaleString('en-US', {minimumFractionDigits: 2})
              setBalance(res);
              setBalanceDisplay(balanceString);
            })
            .catch((err) => {
              console.log(err);
            });
            console.log(err);
            setBalance(0);
            setBalanceDisplay('0');
            addNotification(`${txHash} unconfirmed`);
        });
      console.log(txHash);
      addNotification(`${txHash} submitted`);
    } catch (error) {
      console.log(error);
      addNotification("Not able to submit tx");
    }  
  };

  const handleSliderChange = (_: any, newValue: number | number[]) => {
    let val = Math.floor((balance * Number(newValue)) / 100)
    let display = val / Math.pow(10, decimals);
    console.log(display );
    setAmountToSend(val);
    setDisplayAmountToSend(display.toFixed(2));
  };

  // Function to handle chain ID selection
  const handleChainIdChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTargetChainId(event.target.value as string);
  };

  const handleTokenChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedToken(event.target.value as string);
  }

  return (
    <Container maxWidth="sm">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card ref={cardRef} style={{ width: '400px' }}> {/* Set the fixed width here */}
            <CardContent>
              <Select value={selectedToken} onChange={handleTokenChange} variant='outlined'>
                {selectibleTokens.map((token) => (
                  <MenuItem key={token} value={token}>
                    {token}
                  </MenuItem>
                ))}
              </Select>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card ref={cardRef} style={{ width: '400px' }}> {/* Set the fixed width here */}
            <CardContent>
              <Typography variant="h4" gutterBottom style={{ paddingRight: '8px' }} align="right">
                <b>{balanceDisplay}</b>
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Amount to Send"
                  type="number"
                  value={displayAmountToSend}
                  onChange={(e) => {
                    let val = Number((parseFloat(e.target.value) * Math.pow(10, decimals)).toFixed(0));
                    setAmountToSend(Number.isNaN(val) ? 0 : val);
                    console.log(amountToSend);
                    setDisplayAmountToSend(e.target.value);
                  }}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  label="Target Address"
                  value={sendToAddress}
                  onChange={(e) => setSendToAddress(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
                <div style={{ marginBottom: '10px' }}>
                  <Select
                    value={targetChainId}
                    onChange={handleChainIdChange}
                    fullWidth
                    variant="outlined"
                  >
                    {selectibleChains.map((cid) => (
                      <MenuItem key={cid} value={cid}>
                        {cid}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
                <div style={{ width: '95%', margin: 'auto' }}>
                  <Slider
                    value={(amountToSend / balance) * 100}
                    onChange={handleSliderChange}
                    marks={marks}
                    step={null}
                    min={0}
                    max={100}
                    valueLabelDisplay="off"
                    aria-labelledby="range-slider"
                    style={{ width: '100%' }}
                  />
                </div>
                <Button
                  variant="contained" color="primary"
                  onClick={handleSubmit}
                >
                  Transfer
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BalanceCard;
