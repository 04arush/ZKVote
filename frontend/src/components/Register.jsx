import { useState, useEffect } from "react";
import { computeCommitment, generateRandomSecret } from "../lib/poseidon";
import { getZKVotingContract } from "../hooks/useZKVoting";

export default function Register({ signer, proposalId, candidates }) {
  const [voteChoice, setVoteChoice] = useState(0);
  const [secret, setSecret] = useState(null);
  const [commitmentPreview, setCommitmentPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | computing | submitting | done | failed
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function preview() {
      const previewSecret = generateRandomSecret();
      const c = await computeCommitment(voteChoice, previewSecret);
      if (!cancelled) setCommitmentPreview(c.toString());
    }
    preview();
    return () => { cancelled = true; };
  }, [voteChoice]);

  async function handleRegister() {
    setError(null);
    try {
      setStatus("computing");
      const newSecret = generateRandomSecret();
      const commitment = await computeCommitment(voteChoice, newSecret);

      setStatus("submitting");
      const contract = getZKVotingContract(signer);
      const tx = await contract.registerCommitment(proposalId, commitment);
      await tx.wait();

      setSecret(newSecret);
      setTxHash(tx.hash);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError(err?.reason || err?.message || "Registration failed.");
      setStatus("failed");
    }
  }

  return (
    <div className="card">
      <h2>1. Register to Vote</h2>
      <p className="subtitle">
        Choose your vote now — it's sealed into a commitment before it ever leaves your browser.
      </p>

      <div className="field">
        <label>Your choice</label>
        <select value={voteChoice} onChange={(e) => setVoteChoice(Number(e.target.value))} disabled={status === "done"}>
          {candidates.map((c) => (
            <option key={c.candidate_id} value={c.option_index}>{c.candidate_name}</option>
          ))}
        </select>
      </div>

      {commitmentPreview && status !== "done" && (
        <div className="field">
          <label>Commitment preview (recomputed live — the real one is generated on submit)</label>
          <code>{commitmentPreview}</code>
        </div>
      )}

      <button onClick={handleRegister} disabled={status === "computing" || status === "submitting" || status === "done"}>
        {status === "computing" && "Computing commitment..."}
        {status === "submitting" && "Confirm in MetaMask..."}
        {(status === "idle" || status === "failed") && "Register"}
        {status === "done" && "Registered"}
      </button>

      {status === "failed" && <div className="banner error">{error}</div>}

      {status === "done" && (
        <>
          <div className="banner success">
            Registered successfully.{" "}
            <a className="tx-link" href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
              View transaction ↗
            </a>
          </div>
          <div className="banner error">
            <strong>Save this secret now — it cannot be recovered.</strong> You need it to vote.
            <div style={{ marginTop: 6 }}><code>{secret.toString()}</code></div>
          </div>
        </>
      )}
    </div>
  );
}
