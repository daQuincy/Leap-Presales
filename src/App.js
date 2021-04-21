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

  const buyPresalesTokens = async () => {
    await pluto.buyPresalesTokens(beneficiary, {value: contribution});
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
        <label>
          BNB to contribute:
          <input type="text" onChange={handleContribution} />
        </label>
      </form>


      <div>
        <h2>Buy Presales Tokens:</h2>
        <button onClick={buyPresalesTokens} className="btn-primary">Buy</button>
      </div>
      

    </div>
  );
}

export default App;
