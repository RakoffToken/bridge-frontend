import { Buffer } from 'buffer';
import { MsgExecuteContract, MsgIbcTransfer } from 'cosmes/client';

/*type ChainInfoType = {
    chainId: string;
    rpc: string;
    lcd: string;
    channel: string;
    gasPrice: {
      denom: string;
      amount: string;
    };
  };*/
  
export const CHAINS = [
    {
      chainId: "columbus-5",
      rpc: "https://terra-classic-rpc.publicnode.com:443",
      lcd: "https://terra-classic-lcd.publicnode.com:443",
      bridges: [
        {
          chainId: "migaloo-1",
          contract: "terra19pfxzj9580h7rjd6z6sn5x2se76vgrc0etltr79g9z3t82jzp4hq63qguc",
          channel: "channel-87",
        },
        {
          chainId: "stargaze-1",
          contract: "terra19pfxzj9580h7rjd6z6sn5x2se76vgrc0etltr79g9z3t82jzp4hq63qguc",
          channel: "channel-89",
        }
      ],
      gasPrice: {
        denom: "uluna",
        amount: "29"
      },
    },
    {
      chainId: "migaloo-1",
      rpc: "https://migaloo-rpc.polkachu.com/",
      lcd: "https://migaloo-api.polkachu.com",
      channel: "channel-114",
      bridges: [
        {
          chainId: "columbus-5",
          contract: "transfer",
          channel: "channel-114",
        }
      ],
      gasPrice: {
        denom: "uwhale",
        amount: "2"
      },
    },
    {
      chainId: "stargaze-1",
      rpc: "https://stargaze-rpc.polkachu.com/",
      lcd: "https://stargaze-api.polkachu.com",
      channel: "channel-318",
      bridges: [
        {
          chainId: "columbus-5",
          contract: "transfer",
          channel: "channel-318",
        }
      ],
      gasPrice: {
        denom: "ustars",
        amount: "1.1"
      },
    }
  ];

type TokenType = {
  symbol: string;
  address: string;
  type: string;
}
  
const CW20TOKENS = [
  {
    chainId: "columbus-5",
    tokens: [
      {
        symbol: "Rakoff",
        address: "terra1vhgq25vwuhdhn9xjll0rhl2s67jzw78a4g2t78y5kz89q9lsdskq2pxcj2",
        type: "cw20"
      },
      {
        symbol: "FROG",
        address: "terra1wez9puj43v4s25vrex7cv3ut3w75w4h6j5e537sujyuxj0r5ne2qp9uwl9",
        type: "cw20"
      },
      {
        symbol: "SPACEX",
        address: "terra14mqjm7n23ky3479hmaarzqnwrlmapje08runh5m7a29rz6sunhpsn9pq27",
        type: "cw20"
      }
      
    ],
  },
]

const IBCTOKENS = [
  {
    chainId: "migaloo-1",
    tokens: [
      {
        symbol: "Rakoff",
        address: "ibc/44C29C91F202E20C8E28DFB1FA89B725C54171CD77B8948836C72E7A97E4A018",
        type: "ibc"
      },
      {
        symbol: "FROG",
        address: "ibc/B1BD4EF49A2E051EFC85E8C6A932B559CE62F9519E0E83BE29A8F0BDF89BD1D3",
        type: "ibc"
      },
    ],
  },
  {
    chainId: "stargaze-1",
    tokens: [
      {
        symbol: "SPACEX",
        address: "ibc/61D445A08E4B15C4B10A906647D551B1BD93316CCE2FAD17E9D97AF047BC7958",
        type: "ibc"
      },
    ]
  }
]

export async function getDecimals(chain: string, token: string) {
  let tokenDef = getToken(chain, token);
  if (!tokenDef) {
    return 0;
  }
  let lcd = getLcd(chain);
  let query_msg = {
    token_info: {},
  };
  let encodedQuery = Buffer.from(JSON.stringify(query_msg), "ascii").toString('base64');
  const encodedQueryUrl = encodeURIComponent(encodedQuery);
  if (tokenDef.type === "cw20") {
    try {
      let resp = await fetch(
        `${lcd}/cosmwasm/wasm/v1/contract/${tokenDef.address}/smart/${encodedQueryUrl}`,
        { method: 'GET', headers: new Headers({ 'Content-Type': 'application/json' }) },
      );
      let json = await resp.json();
      return Number(json.data.decimals);
    } catch (e) {
      console.log(e);
      return 0;
    }
    return 6;
  } else if (tokenDef.type === "ibc") {
    return 6;
  } else {
    return 0;
  }
}

export function getBridgeMessageContract(chain: string, targetChain: string, token:string, amountToSend:string, sender:string, sendToAddress: string) {
  const bridge = getBridge(chain, targetChain);
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
    msg: { send: { contract: bridge.contract, amount: amountToSend, msg: bridgeMsgBase64 } },
  });
  return msg
}

export function getBridgeMessageIBC(chain: string, targetChain: string, token: string, amountToSend:string, sender:string, sendToAddress: string) {
  const bridge = getBridge(chain, targetChain);
  if (!bridge) {
    console.log('Bridge not found');
    return;
  }
  let timestampCurrent = BigInt(Math.floor(Date.now() / 1000));
  console.log(timestampCurrent);
  let timeout = timestampCurrent + BigInt(600);
  timeout = timeout * BigInt(1000000000);
  return new MsgIbcTransfer({
    sourcePort: "transfer",
    sourceChannel: bridge.channel,
    sender: sender,
    receiver: sendToAddress,
    token: { denom: token, amount: amountToSend },
    timeoutTimestamp: timeout,
    memo: "",
  });

}

export function getBridgeMessage(chain: string, targetChain: string, token: string, amountToSend:string, sender:string, sendToAddress: string) {
  console.log("getting bridge message");
  console.log(chain);
  console.log(targetChain);
  console.log(token);
  console.log(amountToSend);
  const tokenDef = getToken(chain, token);
  if (!tokenDef) {
    console.log('Token not found');
    return undefined;
  }
  const bridge = getBridge(chain, targetChain);
  if (!bridge) {
    console.log('Bridge not found');
    return undefined;
  }
  if (bridge.contract == "transfer") {
    console.log("getting native ibc transfer");
    return getBridgeMessageIBC(chain, targetChain, tokenDef.address, amountToSend, sender, sendToAddress);
  } else {
    console.log("getting cw20 ibc transfer");
    return getBridgeMessageContract(chain, targetChain, tokenDef.address, amountToSend, sender, sendToAddress);
  }
}

export async function getBalanceCw20(chain: string, token: string, holder: string) {
  console.log("getting cw20 balance");
  let lcd = getLcd(chain);
  let query_msg = {
    balance: {
      address: holder,
    },
  };
  let encodedQuery = Buffer.from(JSON.stringify(query_msg), "ascii").toString('base64');
  const encodedQueryUrl = encodeURIComponent(encodedQuery);
  try {
    console.log("fetching")
    console.log(lcd)
    console.log(encodedQueryUrl);
    let resp = await fetch(
      `${lcd}/cosmwasm/wasm/v1/contract/${token}/smart/${encodedQueryUrl}`,
      { method: 'GET', headers: new Headers({ 'Content-Type': 'application/json' }) },
    )
    console.log(resp);
    let json = await resp.json();
    console.log(json)
    return json.data.balance;

  } catch (e) {
    console.log(e);
    return 0;
  }
}

export async function getBalanceNative(chain: string, token: string, holder: string) {
  let lcd = getLcd(chain);
  try {
    console.log("fetching native balance");
    let resp = await fetch(
      `${lcd}/cosmos/bank/v1beta1/balances/${holder}/by_denom?denom=${encodeURIComponent(token)}`,
      { method: 'GET', headers: new Headers({ 'Content-Type': 'application/json' }) },
    );
    console.log(resp);
    let json = await resp.json()
    console.log(json);
    return json.balance.amount;
  } catch (e) {
    console.log(e);
    return 0;
  }
}

export async function getBalance(chain: string, token: string, holder: string) {
  console.log("getting balance");
  let tokenDef = getToken(chain, token);
  console.log(tokenDef);
  if (tokenDef === undefined) {
    return 0;
  }
  if (tokenDef.type === "cw20") {
    return await getBalanceCw20(chain, tokenDef.address, holder);
  } else if (tokenDef.type === "ibc") {
    return await getBalanceNative(chain, tokenDef.address, holder);
  } else {
    console.log("Unknown token type");
    return 0;
  }
}

export function getChainsTokens(chainId: string) {
  let cw = CW20TOKENS.find((c) => c.chainId === chainId) || {tokens: new Array<TokenType>()};
  let ibc = IBCTOKENS.find((c) => c.chainId === chainId) || {tokens: new Array<TokenType>()};
  let concat = cw.tokens.concat(ibc.tokens);
  return concat;
}

export function getToken(chainId: string, symbol: string) {
  let tokens = getChainsTokens(chainId);
  if (tokens.length === 0) {
    return undefined;
  }
  return tokens.find((t) => t.symbol === symbol);
}
  
export function getChain(chainId: string) {
  return CHAINS.find((c) => c.chainId === chainId);
}
  
export function getLcd(chainId: string) {
  return getChain(chainId)?.lcd;
}
  
export function getChainIds() {
  return CHAINS.map((c) => c.chainId);
}

export function getBridge(chainId: string, targetChainId: string) {
  return getChain(chainId)?.bridges.find((b) => b.chainId === targetChainId);
}