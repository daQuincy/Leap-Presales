import { useState, useEffect } from 'react';
import { ethers, Contract , utils} from 'ethers';
import { Form, Input, Message, Button } from 'semantic-ui-react';
import Pluto from './contracts/Pluto.json';
import 'semantic-ui-css/semantic.min.css'

// if use this, it does not connect to metamask after build
//const provider = new ethers.providers.Web3Provider(window.ethereum);

// https://stackoverflow.com/questions/60785630/how-to-connect-ethers-js-with-metamask
let provider;
window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum, "any"));
const signer = provider.getSigner();

const pluto = new Contract(
  "0xB22dee4B962303D42b4fC04B0eEc7429CE512239",
  Pluto.abi,
  signer
);

function App() {
  const [connection, setConnection] = useState(false);
  const [totalContribution, setTotalContribution] = useState(0);
  const [chainID, setChainId] = useState(undefined);
  const [allowBuy, setAllowBuy] = useState(false);
  const [presalesStart, setPresalesStart] = useState(false);
  const [presalesEnd, setPresalesEnd] = useState(false);

  const [beneficiary, setBeneficiary] = useState(undefined);
  const [contribution, setContribution] = useState(0);
  const [valBeneficiary, setValBeneficiary] = useState(false);
  const [valContribution, setValContribution] = useState(false);

  const [buttonLoading, setButtonLoading] = useState(false);

  const [address, setAddress] = useState(undefined);
  const [txnLink, setTxnLink] = useState(undefined);
  const [txnHash, setTxnHash] = useState(undefined);
  const [tokensAmount, setTokenAmounts] = useState(0);

  useEffect(() => {
    const init = setInterval(async () => {
      const _chainID = (await provider.getNetwork())["chainId"];
      if (_chainID === 97 || _chainID === 56){
        setConnection(true);
        const _address = await signer.getAddress();

        let _tokensAmount = await pluto.getTokens(_address);
        _tokensAmount = _tokensAmount.div(1000000000);

        let _totalContribution = await pluto.weiRaised();
        _totalContribution = utils.formatEther(_totalContribution);

        const _presalesStart = await pluto.getPresalesStarted();
        const _presalesEnd = await pluto.getPresalesEnded();

        const _allowBuy = _presalesStart && !_presalesEnd;

        setTokenAmounts(_tokensAmount.toString());
        setTotalContribution(_totalContribution);
        setAddress(_address);
        setChainId(_chainID);
        setPresalesStart(_presalesStart);
        setPresalesEnd(_presalesEnd);
        setAllowBuy(_allowBuy);
      } else {
        setConnection(false)
      }
    }, 1000);
    return () => clearInterval(init);
  }, []);

  const buyPresalesTokens = async (e) => {
    e.preventDefault();
    setButtonLoading(true);
    const tx = await pluto.buyPresalesTokens(beneficiary, {gasLimit: 500000, value: contribution});
    await tx.wait();
    let _tokensAmount = await pluto.getTokens(address);
    _tokensAmount = _tokensAmount.div(1000000000);

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    };
    setTokenAmounts(_tokensAmount.toString());
    setTxnHash(tx.hash);
    setTxnLink(txLink);
    setButtonLoading(false);
  }

  const handleBeneficiary = (e) => {
    let _beneficiary = e.target.value;
    const valid = utils.isAddress(_beneficiary);
    try {
      if (valid) {
        _beneficiary = utils.getAddress(_beneficiary);
        setValBeneficiary(true);
        setBeneficiary(_beneficiary);
      } else {
        setValBeneficiary(false);
        setBeneficiary(0);
      }
    } catch {
      setValBeneficiary(false);
      setBeneficiary(0);
    }
  }

  const handleContribution = (e) => {
    let _contribution = e.target.value;
    try {
      if (_contribution <= 0 || _contribution > 0.5) {
        setValContribution(false);
        setContribution(0);
      } else {
        const contribution = utils.parseEther(e.target.value);
        setValContribution(true);
        setContribution(contribution);
      }
    } catch {
      setValContribution(false);
      setContribution(0)
    }
  }
  
  return (
    <div className="App">
      <h1>Presales</h1>
      <br></br>

      <Message hidden={connection} error={!connection} header="Opps!" content={"Please connect to BSC through Metamask!"} />

      <Message info hidden={presalesStart} header="Presales has not started yet" />
      <Message info hidden={!presalesEnd} header="Presales has already ended" />
      <Message header={"Current Total Contribution"} content={totalContribution + " BNB"} />
 
      <Form onSubmit={buyPresalesTokens}>
        <Form.Field>
            <label>Beneficiary Address</label>
            <Input
                onChange={handleBeneficiary}
                placeholder="Enter a valid BNB address"
            />

            <label>Amount to Contribute</label>
            <Input
              onChange={handleContribution}
              placeholder="MAX: 0.5 BNB"
              label="BNB"
              labelPosition="right"
            />
            <Button primary disabled={(!valContribution || !valBeneficiary || !allowBuy || !connection)} loading={buttonLoading}>
              Buy Tokens!
            </Button>
        </Form.Field>
      </Form>

      <h3>
        Tokens you bought: {tokensAmount}
      </h3>

      <h3>
        Transaction hash: <a href={txnLink}>{txnHash ?  txnHash : " "}</a>
      </h3>

    </div>
  );
}

export default App;
