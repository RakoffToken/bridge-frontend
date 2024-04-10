import BalanceCard from "../BalanceCard";
import { useChain } from "../main";

export const Bridge = () => {
    const chain = useChain();
    const [connected, setConnected] = chain.connected as [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    const [chainId, setChainId] = chain.chainId as [string, React.Dispatch<React.SetStateAction<string>>];
  
    const handleClick = () => {
      setConnected(!connected);
    };
  
    return (
      <div>
        <BalanceCard/>
      </div>
    );
};