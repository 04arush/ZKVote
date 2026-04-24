import React, { useState, useEffect } from 'react';
import { generateProof, formatProofForSolidity } from '../utils/proof';
import { castVote } from '../utils/contract';
import ErrorScreen from './ErrorScreen';

const CastVote = ({ signer }) => {
  const [candidates, setCandidates] = useState([]);
  const [vote, setVote] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('Idle');
  const [nullifier, setNullifier] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/candidates?election_id=1')
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(err => setError(err.message));
  }, []);

  const handleCastVote = async (e) => {
    e.preventDefault();
    setError(null);
    setNullifier(null);
    setTxHash(null);

    try {
      if (!vote || !secret) {
        throw new Error('Please select a candidate and enter your secret passphrase');
      }

      setStatus('Generating');
      const proposalId = 1;
      const numOptions = 3;

      const { proof, commitment, nullifier: nullifierValue } = await generateProof(
        parseInt(vote),
        BigInt(secret),
        proposalId,
        numOptions
      );

      setStatus('Complete');
      setNullifier(nullifierValue);

      const { proofA, proofB, proofC } = formatProofForSolidity(proof);

      const receipt = await castVote(
        proofA,
        proofB,
        proofC,
        nullifierValue,
        commitment,
        parseInt(vote),
        proposalId,
        signer
      );

      setTxHash(receipt.hash);
      setStatus('Idle');
    } catch (err) {
      setStatus('Failed');
      setError(err.message || 'Vote casting failed');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
      <h2>Cast Your Vote</h2>
      <ErrorScreen error={error} />

      <form onSubmit={handleCastVote}>
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
          <label>Secret Passphrase:</label>
          <input 
            type="password" 
            value={secret} 
            onChange={(e) => setSecret(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter your secret"
          />
        </div>

        <button 
          type="submit" 
          disabled={status === 'Generating' || !signer}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          {status === 'Generating' ? 'Generating Proof...' : 'Cast Vote'}
        </button>
      </form>

      <div style={{ marginTop: '15px' }}>
        <strong>Status:</strong> {status}
      </div>

      {nullifier && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#efe', border: '1px solid #0a0' }}>
          <strong>Nullifier:</strong> {nullifier.slice(0, 20)}...
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

export default CastVote;
