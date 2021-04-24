import { useState, useEffect } from 'react';
import { ethers, Contract , utils} from 'ethers';
import { Button, TextField, Grid, Card, CardContent } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Alert } from '@material-ui/lab';

import Leap from './contracts/Leap.json';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

let provider = undefined;
let signer = undefined;
let leap = undefined;

const useCardStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

function App() {
  const [connection, setConnection] = useState(false);
  const [signerAddress, setSignerAddress] = useState(undefined);

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

  const cardClasses = useCardStyles();

  useEffect(() => {
    const load = setInterval(async () => {
      if (provider !== undefined) {
        const _chainID = (await provider.getNetwork())["chainId"];
        signer = provider.getSigner();
        const _address = await signer.getAddress();
        setSignerAddress(_address);

        if (_chainID === 97 || _chainID === 56){
          setConnection(true);
          
          if (leap === undefined) {
            leap = new Contract(
              Leap.networks[_chainID].address,
              Leap.abi,
              signer
            )
          }

          let _tokensAmount = await leap.getTokens(_address);
          _tokensAmount = utils.formatUnits(_tokensAmount, 9);

          let _contributed = await leap.getContribution(_address);
          _contributed = utils.formatEther(_contributed);

          let _totalContribution = await leap.weiRaised();
          _totalContribution = utils.formatEther(_totalContribution);

          const _presalesStart = await leap.getPresalesStarted();
          const _presalesEnd = await leap.getPresalesEnded();
          const _capReached = await leap.capReached();

          const _allowBuy = _presalesStart && !_presalesEnd;

          setTokenAmounts(_tokensAmount);
          setContributed(_contributed);
          setTotalContribution(_totalContribution);
          setPresalesStart(_presalesStart);
          setPresalesEnd(_presalesEnd);
          setAllowBuy(_allowBuy);
          setCapReached(_capReached);
          setConnection(true);
        } else {
          setConnection(false);
        }

      } else {
        setConnection(false);
      }
    }, 1000);

    return () => clearInterval(load);
  }, []);

  const getProvider = async (e) => {
    let providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            // mainnet: https://bsc-dataseed.binance.org/
            // testnet: https://data-seed-prebsc-1-s1.binance.org:8545/
            56: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
          },
          network: 'binance',
          chainId: 56,
          infuraId: "1212",
        }
      }
    };

    const web3Modal = new Web3Modal({
      network: "binance",
      cacheProvider: true, 
      providerOptions, 
    });

    let _provider = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(_provider, "any");
    const _chainID = (await provider.getNetwork())["chainId"];
    signer = provider.getSigner();

    setChainID(_chainID);
  };

  const buyPresalesTokens = async (e) => {
    e.preventDefault();
    setBuyButtonLoading(true);
    const tx = await leap.buyPresalesTokens(beneficiary, {gasLimit: 500000, value: contribution});
    await tx.wait();

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    }

    let _tokensAmount = await leap.getTokens(beneficiary);
    _tokensAmount = utils.formatUnits(_tokensAmount, 9);

    let _contributed = await leap.getContribution(beneficiary);
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
    const tx = await leap.withdrawPresalesTokens(beneficiary, {gasLimit: 500000});
    await tx.wait();

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    }

    setTxnHash(tx.hash);
    setTxnLink(txLink);
    setWithdrawButtonLoading(false);
  }

  const refundCapNotReached = async (e) => {
    e.preventDefault();
    setRefundButtonLoading(true);
    const tx = await leap.refund(beneficiary, {gasLimit: 500000});
    await tx.wait();

    let _tokensAmount = await leap.getTokens(beneficiary);
    _tokensAmount = utils.formatUnits(_tokensAmount, 9);

    let _contributed = await leap.getContribution(beneficiary);
    _contributed = utils.formatEther(_contributed);
    
    setBeneContributed(_contributed);
    setBeneTokensAmount(_tokensAmount);    

    let txLink;
    if (chainID === 97) {
      txLink = "https://testnet.bscscan.com/tx/" + tx.hash;
    } else if (chainID === 56) {
      txLink = "https://bscscan.com/tx/" + tx.hash;
    }

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

        let _tokensAmount = await leap.getTokens(_beneficiary);
        _tokensAmount = utils.formatUnits(_tokensAmount, 9);

        let _contributed = await leap.getContribution(_beneficiary);
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
        let _contributed = await leap.getContribution(beneficiary);
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

      <Button variant="outlined" color={connection ? "primary" : "secondary"} onClick={getProvider}>{connection ? "Connected" :"Connect to Web3"}</Button>
      <br></br>
      {connection ? <Alert variant="outlined" severity="info">{"Address: " + signerAddress}</Alert> : <Alert severity="error">"Please connect to BSC through your wallet!"</Alert>} 
      {(!presalesStart || connection) ? <Alert variant="outlined" severity="warning">Presales has not started</Alert> : " "}
      {presalesEnd ? <Alert variant="outlined" severity="warning">"Presales has already ended</Alert> : " "}
      <Alert variant="outlined" severity="info">{"Current toal contribution: " + totalContribution + " BNB"}</Alert>

      <br></br>
      <Grid>
        <TextField
            onChange={handleBeneficiary}
            label="Beneficiary Address"
            placeholder="Enter a valid BNB address"
            variant="outlined"
            fullWidth={true}
        />

        <TextField
          onChange={handleContribution}
          label="Amount to Contribute (BNB)"
          placeholder="MAX: 0.5 BNB per address (cumulative)"
          variant="outlined"
          fullWidth={true}
          disabled={presalesEnd}
        />
      </Grid>
      <br></br>

      {indvCap ? <Alert error>This transaction will fail because you exceeded individual limit. Enter a lower amount</Alert> : " "}

      <Grid 
        container
        direction="row"
        justify="space-evenly"
        alignItems="center"
      >
        <Button color="primary" variant="contained" disabled={!valContribution || !valBeneficiary || !allowBuy || !connection} loading={buyButtonLoading} onClick={buyPresalesTokens}>
          Buy Tokens!
        </Button>
        {" "}
        <Button color="primary" variant="contained" disabled={!(presalesEnd && capReached) || !valBeneficiary || !connection} loading={withdrawButtonLoading} onClick={withdrawPresalesTokens}>
          Withdraw
        </Button>
        {" "}
        <Button color="primary" variant="contained" disabled={!(presalesEnd && !capReached) || !valBeneficiary || !connection} loading={refundButtonLoading} onClick={refundCapNotReached}>
          Refund
        </Button>
      </Grid>

      <br></br>
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
      >
        <Card className={cardClasses.root}>
          <CardContent>
            <Typography className={cardClasses.title} color="textSecondary" gutterBottom>
              Your stats
            </Typography>
            <Typography variant="body2" component="p">
                Tokens bought: {tokensAmount}
            </Typography>
            <Typography variant="body2" component="p">
                BNB contributed: {contributed}
            </Typography>
          </CardContent>
        </Card>

        <Card className={cardClasses.root}>
          <CardContent>
            <Typography className={cardClasses.title} color="textSecondary" gutterBottom>
              Beneficiary's stat
            </Typography>
            <Typography variant="body2" component="p">
                Tokens bought: {beneTokensAmount}
            </Typography>
            <Typography variant="body2" component="p">
                BNB contributed: {beneContributed}
            </Typography>
          </CardContent>
        </Card>

      </Grid>

      {txnHash ? <Alert severity="info">{"Verify you transaction here"} content={<a href={txnLink}>{txnHash}</a>}</Alert> : " "}

    </div>
  );
}

export default App;
