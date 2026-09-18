import { useEffect, useState } from "react";
import { getZKVotingContract } from "../hooks/useZKVoting";

export default function Results({ provider, proposalId, candidates }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const contract = getZKVotingContract(provider);
        const tallies = await contract.getResults(proposalId);
        setResults(tallies.map((t) => Number(t)));
      } catch (err) {
        console.error(err);
        setError("Could not load results.");
      }
    }
    fetchResults();
  }, [provider, proposalId]);

  if (error) return <div className="card"><div className="banner error">{error}</div></div>;
  if (!results) return <div className="card"><p>Loading results...</p></div>;

  const total = results.reduce((a, b) => a + b, 0);

  return (
    <div className="card">
      <h2>3. Results</h2>
      <p className="subtitle">{total} vote{total !== 1 ? "s" : ""} cast so far. Individual votes remain private forever.</p>
      {candidates.map((c) => {
        const votes = results[c.option_index] ?? 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        return (
          <div className="results-row" key={c.candidate_id}>
            <div className="meta">
              <span>{c.candidate_name}</span>
              <span>{votes} vote{votes !== 1 ? "s" : ""} ({pct}%)</span>
            </div>
            <div className="results-bar-track">
              <div className="results-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
