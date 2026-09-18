import { useEffect, useState } from "react";
import { useWallet } from "./hooks/useWallet";
import Register from "./components/Register";
import CastVote from "./components/CastVote";
import Results from "./components/Results";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID;

export default function App() {
  const { address, signer, provider, chainId, wrongNetwork, connect, switchAccount, ensureCorrectNetwork } = useWallet();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [setLoadError] = useState(null);

  useEffect(() => {
    async function loadElection() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/elections/active`);
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        const elections = await res.json();
        if (elections.length === 0) {
          setLoadError("No active election found. Check the backend and MySQL seed data.");
          return;
        }
        const active = elections[0];
        setElection(active);

        const candRes = await fetch(`${BACKEND_URL}/api/elections/${active.election_id}/candidates`);
        setCandidates(await candRes.json());
      } catch (err) {
        console.error(err);
        setLoadError("Could not reach the backend. Is it running?");
      }
    }
    loadElection();
  }, []);

  return (
    <>
      <h1>ZKVote</h1>
      <p className="subtitle" style={{ textAlign: "center" }}>
        Privacy-preserving voting, secured by zero-knowledge proofs.
      </p>

      <div className="wallet-bar">
        {!address ? (
          <>
            <span>Not connected</span>
            <button onClick={connect}>Connect MetaMask</button>
          </>
        ) : (
          <>
            <span>Connected: <code>{address}</code></span>
            <button className="secondary" onClick={switchAccount}>Switch Account</button>
          </>
        )}
      </div>

      {address && wrongNetwork && (
        <div className="banner error">
          Wrong network (chain {chainId}) — this app needs chain {import.meta.env.VITE_CHAIN_ID} (Sepolia).{" "}
          <button onClick={ensureCorrectNetwork} style={{ marginLeft: 8 }}>Switch to Sepolia</button>
        </div>
      )}

      {address && !wrongNetwork && election && (
        <>
          <div className="card">
            <h2>{election.title}</h2>
            <p className="subtitle">{election.description}</p>
            <p style={{ fontSize: 13 }}>
              Election ID: {election.on_chain_proposal_id} · Network: chain {CHAIN_ID} · Closes:{" "}
              {new Date(election.end_time).toLocaleString()}
            </p>
          </div>

          <Register signer={signer} proposalId={election.on_chain_proposal_id} candidates={candidates} />
          <CastVote signer={signer} proposalId={election.on_chain_proposal_id} numOptions={candidates.length} />
          <Results provider={provider} proposalId={election.on_chain_proposal_id} candidates={candidates} />
        </>
      )}
    </>
  );
}
