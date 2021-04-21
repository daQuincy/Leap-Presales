import { useState, useEffect } from 'react';
import { ethers, Contract , utils} from 'ethers';
import Pluto from './contracts/Pluto.json';

// if use this, it does not connect to metamask after build
//const provider = new ethers.providers.Web3Provider(window.ethereum);

// https://stackoverflow.com/questions/60785630/how-to-connect-ethers-js-with-metamask
let provider;
window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum));
const signer = provider.getSigner();

const pluto = new Contract(
  "0xB22dee4B962303D42b4fC04B0eEc7429CE512239",
  Pluto.abi,
  signer
);

function App() {
  const [beneficiary, setBeneficiary] = useState(undefined);
  const [contribution, setContribution] = useState(undefined);
  const [address, setAddress] = useState(undefined);
  const [txnHash, setTxnHash] = useState(false);
  const [tokensAmount, setTokenAmounts] = useState(0);

  useEffect(() => {
    const init = async () => {
      const _address = await signer.getAddress();
      let _tokensAmount = await pluto.getTokens(_address);
      _tokensAmount = _tokensAmount.div(1000000000);
      setTokenAmounts(_tokensAmount.toString());
      setAddress(_address);
    };
    init();
  }, []);

  const buyPresalesTokens = async (e) => {
    e.preventDefault();
    const tx = await pluto.buyPresalesTokens(beneficiary, {gasLimit: 500000, value: contribution});
    await tx.wait();
    let _tokensAmount = await pluto.getTokens(address);
    _tokensAmount = _tokensAmount.div(1000000000);
    setTokenAmounts(_tokensAmount.toString());
    setTxnHash(tx.hash);
  }

  const handleBeneficiary = async (e) => {
    setBeneficiary(e.target.value);
  }

  const handleContribution = async (e) => {
    const contribution = utils.parseEther(e.target.value);
    setContribution(contribution);
  }
  
  return (
    <div className="App">
      <h1>Presales</h1>
      <br></br>

      <form>
        <label>
          Beneficiary Address:
          <input type="text" onChange={handleBeneficiary} />
        </label>
        <br></br>
        <label>
          BNB to contribute:
          <input type="text" onChange={handleContribution} />
        </label>
      </form>

      <div>
        <h2>Buy Presales Tokens:</h2>
        <button onClick={buyPresalesTokens} className="btn-primary">Buy</button>
      </div>
      
      <h3>
        Tokens you bought: {tokensAmount}
      </h3>

      <h3>
        Transaction hash: {txnHash ? txnHash : " "}
      </h3>
    </div>
  );
}

export default App;
