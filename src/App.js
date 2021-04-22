import { useState, useEffect } from 'react';
import { ethers, Contract , utils} from 'ethers';
import { Form, Input, Message, Button, Card } from 'semantic-ui-react';
import Pluto from './contracts/Pluto.json';
import 'semantic-ui-css/semantic.min.css'

// if use this, it does not connect to metamask after build
//const provider = new ethers.providers.Web3Provider(window.ethereum);

// https://stackoverflow.com/questions/60785630/how-to-connect-ethers-js-with-metamask
let provider, signer, pluto;

if (window.ethereum === undefined) {
  provider = undefined;
  signer = undefined;
  pluto = undefined;
} else {
  window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum, "any"));
}


function App() {
  const [connection, setConnection] = useState(false);
  const [totalContribution, setTotalContribution] = useState(0);
  const [chainID, setChainID] = useState(undefined);

  const [allowBuy, setAllowBuy] = useState(false);
  const [presalesStart, setPresalesStart] = useState(false);
  const [presalesEnd, setPresalesEnd] = useState(false);
  const [capReached, setCapReached] = useState(false);
  const [indvCap, setIndvCap] = useState(false);

  // beneficiary's stats
  const [beneficiary, setBeneficiary] = useState(undefined);
  const [beneContributed, setBeneContributed] = useState(0);
  const [beneTokensAmount, setBeneTokensAmount] = useState(0);
  
  const [contribution, setContribution] = useState(0);
  const [valBeneficiary, setValBeneficiary] = useState(false);
  const [valContribution, setValContribution] = useState(false);

  const [buyButtonLoading, setBuyButtonLoading] = useState(false);
  const [refundButtonLoading, setRefundButtonLoading] = useState(false);
  const [withdrawButtonLoading, setWithdrawButtonLoading] = useState(false);

  const [txnLink, setTxnLink] = useState(undefined);
  const [txnHash, setTxnHash] = useState(undefined);

  // current wallet's stats
  const [contributed, setContributed] = useState(0);
  const [tokensAmount, setTokenAmounts] = useState(0);

  useEffect(() => {
    const load = setInterval(async () => {
      if (provider !== undefined) {
        const _chainID = (await provider.getNetwork())["chainId"];
        if (_chainID === 97 || _chainID === 56){
          setConnection(true);
          const _address = await signer.getAddress();

          let _tokensAmount = await pluto.getTokens(_address);
          _tokensAmount = utils.formatUnits(_tokensAmount, 9);

          let _contributed = await pluto.getContribution(_address);
          _contributed = utils.formatEther(_contributed);

          let _totalContribution = await pluto.weiRaised();
          _totalContribution = utils.formatEther(_totalContribution);

          const _presalesStart = await pluto.getPresalesStarted();
          const _presalesEnd = await pluto.getPresalesEnded();
          const _capReached = await pluto.capReached();

          const _allowBuy = _presalesStart && !_presalesEnd;

          setTokenAmounts(_tokensAmount);
          setContributed(_contributed);
          setTotalContribution(_totalContribution);
          setPresalesStart(_presalesStart);
          setPresalesEnd(_presalesEnd);
          setAllowBuy(_allowBuy);
          setCapReached(_capReached);
        } else {
          setConnection(false);
        }
      } else {
        setConnection(false);
      }
    }, 1000);

    const init = async () => {
      if (provider !== undefined) {
        const _chainID = (await provider.getNetwork())["chainId"];
        signer = provider.getSigner();

        pluto = new Contract(
          Pluto.networks[_chainID].address,
          Pluto.abi,
          signer
        );

        setChainID(_chainID);
      } else {
        signer = undefined;
        pluto = undefined;
      }
    }

    init();

    return () => clearInterval(load);
  }, []);

  const buyPresalesTokens = async (e) => {
    e.preventDefault();
    setBuyButtonLoading(true);
    const tx = await pluto.buyPresalesTokens(beneficiary, {gasLimit: 500000, value: contribution});
    await tx.wait();

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    };

    let _tokensAmount = await pluto.getTokens(beneficiary);
    _tokensAmount = utils.formatUnits(_tokensAmount, 9);

    let _contributed = await pluto.getContribution(beneficiary);
    _contributed = utils.formatEther(_contributed);
    
    setBeneContributed(_contributed);
    setBeneTokensAmount(_tokensAmount);
    setTxnHash(tx.hash);
    setTxnLink(txLink);
    setBuyButtonLoading(false);
  }

  const withdrawPresalesTokens = async (e) => {
    e.preventDefault();
    setWithdrawButtonLoading(true);
    const tx = await pluto.withdrawPresalesTokens(beneficiary, {gasLimit: 500000});
    await tx.wait();

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    };

    setTxnHash(tx.hash);
    setTxnLink(txLink);
    setWithdrawButtonLoading(false);
  }

  const refundCapNotReached = async (e) => {
    e.preventDefault();
    setRefundButtonLoading(true);
    const tx = await pluto.refund(beneficiary, {gasLimit: 500000});
    await tx.wait();

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    };

    setTxnHash(tx.hash);
    setTxnLink(txLink);
    setRefundButtonLoading(false);
  }

  const handleBeneficiary = async (e) => {
    let _beneficiary = e.target.value;
    const valid = utils.isAddress(_beneficiary);
    try {
      if (valid) {
        _beneficiary = utils.getAddress(_beneficiary);

        let _tokensAmount = await pluto.getTokens(_beneficiary);
        _tokensAmount = utils.formatUnits(_tokensAmount, 9);

        let _contributed = await pluto.getContribution(_beneficiary);
        _contributed = utils.formatEther(_contributed);
        
        setBeneContributed(_contributed);
        setBeneTokensAmount(_tokensAmount);
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

  const handleContribution = async (e) => {
    let _contribution = e.target.value;
    try {
      if (_contribution <= 0 || _contribution > 0.5) {
        setValContribution(false);
        setContribution(0);
        setIndvCap(false);
      } else {
        let _contributed = await pluto.getContribution(beneficiary);
        _contributed = utils.formatEther(_contributed);
        const _individualCap = parseFloat(_contribution) + parseFloat(_contributed);
        if (_individualCap > 0.5) {
          setIndvCap(true);
        } else {
          setIndvCap(false);
        }
        _contribution = utils.parseEther(_contribution);
        
        setValContribution(true);
        setContribution(_contribution);
      }
    } catch {
      setValContribution(false);
      setContribution(0);
      setIndvCap(false);
    }
  }
  
  return (
    <div className="App">
      <h1>Presales</h1>
      <br></br>

      <Message hidden={connection} error={!connection} header="Opps!" content={"Please connect to BSC through Metamask!"} />

      <Message info hidden={presalesStart || !connection} header="Presales has not started yet" />
      <Message info hidden={!presalesEnd} header="Presales has already ended" />
      <Message header={"Current Total Contribution"} content={totalContribution + " BNB"} />
 
      <Form>
        <Form.Field>
            <label>Beneficiary Address</label>
            <Input
                onChange={handleBeneficiary}
                placeholder="Enter a valid BNB address"
            />

            <label>Amount to Contribute</label>
            <Input
              onChange={handleContribution}
              placeholder="MAX: 0.5 BNB per address (cumulative)"
              label="BNB"
              labelPosition="right"
              disabled={presalesEnd}
            />

            <Button primary disabled={!valContribution || !valBeneficiary || !allowBuy || !connection} loading={buyButtonLoading} onClick={buyPresalesTokens}>
              Buy Tokens!
            </Button>

            <Button primary disabled={!(presalesEnd && capReached) || !valBeneficiary || !connection} loading={withdrawButtonLoading} onClick={withdrawPresalesTokens}>
              Withdraw
            </Button>

            <Button primary disabled={!(presalesEnd && !capReached) || !valBeneficiary || !connection} loading={refundButtonLoading} onClick={refundCapNotReached}>
              Refund
            </Button>
        </Form.Field>
      </Form>

      <Message hidden={!indvCap} error={true} header="Exceed individual limit!" content={"This transaction will fail because you exceeded individual limit. Enter a lower amount"} />

      <Card.Group>
        <Card
          header="Your stats"
          description={
            <div>
              <p>
                Tokens bought: {tokensAmount}
              </p>
              <p>
                BNB contributed: {contributed}
              </p>
            </div>
          }
        />

        <Card
          header="Beneficiary's stats"
          description={
            <div>
              <p>
                Tokens bought: {beneTokensAmount}
              </p>
              <p>
                BNB contributed: {beneContributed}
              </p>
            </div>
          }
        />
      </Card.Group>

      <h3>
        Transaction hash: <a href={txnLink}>{txnHash ?  txnHash : " "}</a>
      </h3>

    </div>
  );
}

export default App;
