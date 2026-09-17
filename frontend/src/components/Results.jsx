import { useEffect, useState } from "react";
import { getZKVotingContract } from "../hooks/useZKVoting";

export default function Results({ provider, proposalId, candidates }) {
  const [results, setResults] = useState(null);

  useEffect(() => {
    async function fetchResults() {
      const contract = getZKVotingContract(provider);
      const tallies = await contract.getResults(proposalId);
      setResults(tallies.map((t) => Number(t)));
    }
    fetchResults();
  }, [provider, proposalId]);

  if (!results) return <p>Loading results...</p>;

  return (
    <div>
      <h2>Results</h2>
      <ul>
        {candidates.map((c) => (
          <li key={c.candidate_id}>
            {c.candidate_name}: {results[c.option_index]} votes
          </li>
        ))}
      </ul>
    </div>
  );
}
