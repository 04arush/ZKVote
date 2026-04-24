import React, { useState, useEffect } from 'react';
import { getProvider, getResults } from '../utils/contract';
import ErrorScreen from './ErrorScreen';

const Results = () => {
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const candidatesRes = await fetch('http://localhost:3001/api/candidates?election_id=1');
        const candidatesData = await candidatesRes.json();
        setCandidates(candidatesData);

        const provider = getProvider();
        const resultsData = await getResults(1, provider);
        setResults(resultsData.map(r => Number(r)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const totalVotes = results.reduce((sum, count) => sum + count, 0);
  const maxVotes = Math.max(...results, 1);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Election Results</h2>
      <ErrorScreen error={error} />

      {loading ? (
        <div>Loading results...</div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <strong>Total Votes Cast:</strong> {totalVotes}
          </div>

          {candidates.map((candidate, idx) => {
            const votes = results[candidate.option_index] || 0;
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
            const barWidth = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;

            return (
              <div key={candidate.candidate_id} style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '5px' }}>
                  <strong>{candidate.candidate_name}</strong> ({candidate.party_or_affiliation})
                </div>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#eee', 
                  height: '30px', 
                  borderRadius: '5px',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: `${barWidth}%`, 
                    backgroundColor: '#4CAF50', 
                    height: '100%', 
                    borderRadius: '5px',
                    transition: 'width 0.3s'
                  }}></div>
                  <div style={{ 
                    position: 'absolute', 
                    top: '5px', 
                    left: '10px', 
                    fontWeight: 'bold'
                  }}>
                    {votes} votes ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default Results;
