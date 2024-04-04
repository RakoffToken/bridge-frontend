import React, { useState, useRef, useEffect, SetStateAction, Dispatch } from 'react';
import { TextField, Button, Typography, Container, Slider, Card, CardContent, Grid, Select, MenuItem } from '@material-ui/core';
import { getCw20Balance, MsgExecuteContract } from 'cosmes/client';
import { CONTROLLER, getBalanceCw20, useChain } from './main';
import { getBridge, getChainIds } from './utils';
import { ConnectedWallet } from 'cosmes/wallet';

interface BalanceCardProps {
  // Define your props here
  token: string;
}

const marks = [
  { value: 0 },
  { value: 5},
  { value: 25 },
  { value: 50 },
  { value: 75 },
  { value: 95 },
  { value: 100 },
];

const BalanceCard: React.FC<BalanceCardProps> = (props) => {
  
  const token = props.token;
  const cardRef = useRef<HTMLDivElement>(null);

  // State for current balance, amount to send, and address to send
  const [balance, setBalance] = useState<number>(100000); // Initial balance with English-style separation
  const [amountToSend, setAmountToSend] = useState<number>(0);
  const [sendToAddress, setSendToAddress] = useState<string>('');
  const [balanceDisplay, setBalanceDisplay] = useState<string>('');
  const [targetChainId, setTargetChainId] = useState<string>('migaloo-1');
  const [selectibleChains, setSelectibleChains] = useState<string[]>([]);

  const chain = useChain();
  const [chainId, setChainId] = chain.chainId as [string, Dispatch<SetStateAction<string>>];
  const [connected, setConnected] = chain.connected as [boolean, Dispatch<SetStateAction<boolean>>];
  const [selectedWallets, setSelectedWallets] = useState<ConnectedWallet[]>([]);
  const [updated, setUpdated] = useState<boolean>(false);

  useEffect(() => {
    
    console.log(updated);
    setUpdated(false);
    if (!connected) {
      setBalance(0);
      setBalanceDisplay('0');
      return;
    }
    const holder = CONTROLLER.connectedWallets.get(chainId)?.address;
    const bal = getBalanceCw20(chainId, token, holder || "");
    bal
      .then((res) => {
        const balance = res.data.balance;
        const balanceString = balance.toLocaleString('de-DE');
        setBalance(res.data.balance);
        setBalanceDisplay(balanceString);
      })
      .catch((err) => {
        console.log(err);
        setBalance(0);
        setBalanceDisplay('0');
      });
  }, [balance, connected, chainId, updated]);

  useEffect(() => {
    const chainIds = getChainIds();
    const selectible = chainIds.filter((cid) => cid !== chainId);
    if (targetChainId === chainId) {
      setTargetChainId(selectible[0]);
    }
    setSelectibleChains(selectible);
  }, [chainId]);

  // Function to handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    const wallet = CONTROLLER.connectedWallets.get(chainId);
    const sender = CONTROLLER.connectedWallets.get(chainId)?.address || "";
    const bridge = getBridge(chainId, targetChainId);
    if (!bridge) {
      console.log('Bridge not found');
      return;
    }
    const bridgeMsg = {
      channel: bridge.channel,
      remote_address: sendToAddress,
      timeout: 600,
    }
    console.log(bridgeMsg);
    const bridgeMsgBase64 = btoa(JSON.stringify(bridgeMsg));
    console.log(bridgeMsgBase64);
    const msg = new MsgExecuteContract({
      sender: sender,
      contract: token,
      funds: [],
      msg: { send: { contract: bridge.contract, amount: amountToSend.toString(), msg: bridgeMsgBase64 } },
    });
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
      const defaultFee = {gas: 0, amount: {amount: '0', denom: 'uluna'}};
      const fee = await wallet.estimateFee(tx, 1.8);
      const txHash = await wallet?.broadcastTx(tx, fee);
      console.log(txHash);
      alert(txHash);
    } catch (error) {
      console.log(error);
      alert("not able to submit tx");
    }

     
  };

  const handleSliderChange = (event: any, newValue: number | number[]) => {
    setAmountToSend(Math.floor((balance * Number(newValue)) / 100));
  };

  // Function to handle chain ID selection
  const handleChainIdChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTargetChainId(event.target.value as string);
  };

  return (
    <Container maxWidth="sm">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card ref={cardRef} style={{ width: '400px' }}> {/* Set the fixed width here */}
            <CardContent>
              <Typography variant="h5">
                <b>Rakoff</b>
              </Typography>
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
                  value={amountToSend}
                  onChange={(e) => setAmountToSend(parseFloat(e.target.value))}
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
function base64(arg0: string) {
  throw new Error('Function not implemented.');
}

