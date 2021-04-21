import React, { useState, useEffect } from 'react';
import { utils } from 'ethers';
import getBlockchain from './ethereum.js';

function App() {
  const [pluto, setPluto] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const { pluto } = await getBlockchain();
      setPluto(pluto);
    };
    init();
  }, []);

  const buy = async e => {
    e.preventDefault();
    const address = e.target.elements[0].value;
    const contribution = utils.parseEther(e.target.elements[1].value);
    const tx = await pluto.buyPresalesTokens(address, {gasLimit: 500000, value: contribution});
    await tx.wait();
  };

  if(
    typeof pluto === 'undefined'
  ) {
    return 'Loading...';
  }

  return (
    <div className='container'>
      <div className='row'>

        <div className='col-sm-6'>
          <h2>Buy Presales Tokens</h2>
          <form className="form-inline" onSubmit={e => buy(e)}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Address"
            />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Contribution"
            />
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Submit
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default App;
