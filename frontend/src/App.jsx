import { useEffect, useState } from "react";
import { useWallet } from "./hooks/useWallet";
import Register from "./components/Register";
import CastVote from "./components/CastVote";
import Results from "./components/Results";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function App() {
  const { address, signer, provider, connect } = useWallet();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    async function loadElection() {
      const res = await fetch(`${BACKEND_URL}/api/elections/active`);
      const elections = await res.json();
      if (elections.length === 0) return;
      const active = elections[0];
      setElection(active);

      const candRes = await fetch(`${BACKEND_URL}/api/elections/${active.election_id}/candidates`);
      setCandidates(await candRes.json());
    }
    loadElection();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>ZKVote</h1>
      {!address ? (
        <button onClick={connect}>Connect MetaMask</button>
      ) : (
        <p>Connected: {address}</p>
      )}

      {address && election && (
        <>
          <h2>{election.title}</h2>
          <Register signer={signer} proposalId={election.on_chain_proposal_id} candidates={candidates} />
          <hr />
          <CastVote signer={signer} proposalId={election.on_chain_proposal_id} numOptions={candidates.length} />
          <hr />
          <Results provider={provider} proposalId={election.on_chain_proposal_id} candidates={candidates} />
        </>
      )}
    </div>
  );
}
