import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import RegisterVoter from './components/RegisterVoter';
import CastVote from './components/CastVote';
import Results from './components/Results';

function App() {
  const [signer, setSigner] = useState(null);
  const [activeTab, setActiveTab] = useState('register');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>ZKVote: Privacy-Preserving Voting</h1>
      
      <WalletConnect onConnect={setSigner} />

      {signer && (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('register')}
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                backgroundColor: activeTab === 'register' ? '#4CAF50' : '#ddd',
                color: activeTab === 'register' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px'
              }}
            >
              Register
            </button>
            <button 
              onClick={() => setActiveTab('vote')}
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                backgroundColor: activeTab === 'vote' ? '#4CAF50' : '#ddd',
                color: activeTab === 'vote' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px'
              }}
            >
              Vote
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              style={{ 
                padding: '10px 20px', 
                cursor: 'pointer',
                backgroundColor: activeTab === 'results' ? '#4CAF50' : '#ddd',
                color: activeTab === 'results' ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px'
              }}
            >
              Results
            </button>
          </div>

          {activeTab === 'register' && <RegisterVoter signer={signer} />}
          {activeTab === 'vote' && <CastVote signer={signer} />}
          {activeTab === 'results' && <Results />}
        </>
      )}
    </div>
  );
}

export default App;
