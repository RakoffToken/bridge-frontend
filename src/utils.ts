type ChainInfoType = {
    chainId: string;
    rpc: string;
    lcd: string;
    channel: string;
    gasPrice: {
      denom: string;
      amount: string;
    };
  };
  
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
        }
      ],
      gasPrice: {
        denom: "uluna",
        amount: "29"
      },
    },
    {
      chainId: "migaloo-1",
      rpc: "https://migaloo.terra.dev",
      lcd: "https://lcd.migaloo.terra.dev",
      channel: "channel-114",
      bridges: [],
      gasPrice: {
        denom: "uwhale",
        amount: "0.15"
      },
    }
  ];
  
  const CW20TOKENS = [
    {
      chainId: "columbus-5",
      tokens: [
        {
          symbol: "Rakoff",
          address: "terra1vhgq25vwuhdhn9xjll0rhl2s67jzw78a4g2t78y5kz89q9lsdskq2pxcj2"
        },
      ],
    },
  ]
  

export function getChainsTokens(chainId: string) {
  return CW20TOKENS.find((c) => c.chainId === chainId);
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