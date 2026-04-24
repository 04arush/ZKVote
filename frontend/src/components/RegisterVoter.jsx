import React, { useState, useEffect } from 'react';
import { computeCommitment } from '../utils/proof';
import { registerCommitment } from '../utils/contract';
import ErrorScreen from './ErrorScreen';

const RegisterVoter = ({ signer }) => {
  const [candidates, setCandidates] = useState([]);
  const [vote, setVote] = useState('');
  const [secret, setSecret] = useState('');
  const [commitment, setCommitment] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/candidates?election_id=1')
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(err => setError(err.message));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCommitment(null);
    setTxHash(null);

    try {
      if (!vote || !secret) {
        throw new Error('Please select a candidate and enter a secret passphrase');
      }

      const comm = await computeCommitment(parseInt(vote), BigInt(secret));
      setCommitment(comm);

      const receipt = await registerCommitment(comm, signer);
      setTxHash(receipt.hash);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
      <h2>Register to Vote</h2>
      <ErrorScreen error={error} />

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label>Select Candidate:</label>
          <select 
            value={vote} 
            onChange={(e) => setVote(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">-- Choose --</option>
            {candidates.map(c => (
              <option key={c.candidate_id} value={c.option_index}>
                {c.candidate_name} ({c.party_or_affiliation})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Secret Passphrase (remember this!):</label>
          <input 
            type="password" 
            value={secret} 
            onChange={(e) => setSecret(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter a secret number"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !signer}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          {loading ? 'Registering...' : 'Register Commitment'}
        </button>
      </form>

      {commitment && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#efe', border: '1px solid #0a0' }}>
          <strong>Commitment:</strong> {commitment.slice(0, 20)}...
        </div>
      )}

      {txHash && (
        <div style={{ marginTop: '10px', color: '#0a0' }}>
          <strong>Transaction:</strong> {txHash}
        </div>
      )}
    </div>
  );
};

export default RegisterVoter;
