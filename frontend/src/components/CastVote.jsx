import { useState } from "react";
import { computeCommitment, computeNullifier } from "../lib/poseidon";
import { generateVoteProof, formatProofForSolidity } from "../lib/prove";
import { getZKVotingContract } from "../hooks/useZKVoting";

const STEPS = ["idle", "generating", "submitting", "done"];

export default function CastVote({ signer, proposalId, numOptions }) {
  const [secretInput, setSecretInput] = useState("");
  const [voteChoice, setVoteChoice] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [nullifierPreview, setNullifierPreview] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [receipt, setReceipt] = useState(null); // { hash, blockNumber, gasUsed }

  async function handleVote() {
    setError(null);
    setProofPreview(null);
    setNullifierPreview(null);
    setReceipt(null);
    try {
      setStatus("generating");
      const secret = BigInt(secretInput);
      const commitment = await computeCommitment(voteChoice, secret);
      const nullifier = await computeNullifier(secret, proposalId);
      setNullifierPreview(nullifier.toString());

      const { proof } = await generateVoteProof({
        vote: voteChoice, secret, commitment, nullifier, proposalId,
        voteOption: voteChoice, numOptions,
      });
      const { proofA, proofB, proofC } = formatProofForSolidity(proof);
      setProofPreview(JSON.stringify({ proofA, proofB, proofC }, null, 2));

      setStatus("submitting");
      const contract = getZKVotingContract(signer);
      const tx = await contract.castVote(proofA, proofB, proofC, nullifier, commitment, voteChoice, proposalId);
      const txReceipt = await tx.wait();

      setReceipt({
        hash: tx.hash,
        blockNumber: txReceipt.blockNumber,
        gasUsed: txReceipt.gasUsed?.toString(),
      });
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError(mapError(err));
      setStatus("failed");
    }
  }

  const stepIndex = STEPS.indexOf(status === "failed" ? "idle" : status);

  return (
    <div className="card">
      <h2>2. Cast Your Vote</h2>
      <p className="subtitle">Your proof is generated entirely in this browser — your secret is never sent anywhere.</p>

      <div className="progress-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`progress-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`} />
        ))}
      </div>

      <div className="field">
        <label>Your secret (from registration)</label>
        <input type="text" placeholder="Paste your secret" value={secretInput} onChange={(e) => setSecretInput(e.target.value)} disabled={status === "generating" || status === "submitting"} />
      </div>
      <div className="field">
        <label>Vote option ({0} to {numOptions - 1})</label>
        <input type="number" min="0" max={numOptions - 1} value={voteChoice} onChange={(e) => setVoteChoice(Number(e.target.value))} disabled={status === "generating" || status === "submitting"} />
      </div>

      <button onClick={handleVote} disabled={status === "generating" || status === "submitting" || !secretInput}>
        {status === "generating" ? "Generating proof (2–5s)..." : status === "submitting" ? "Confirm in MetaMask..." : "Cast Vote"}
      </button>

      {nullifierPreview && (status === "generating" || status === "submitting" || status === "done") && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Nullifier (proves this exact vote hasn't been cast before)</label>
          <code>{nullifierPreview}</code>
        </div>
      )}

      {proofPreview && (status === "submitting" || status === "done") && (
        <div className="field">
          <label>Zero-knowledge proof (submitted with your transaction)</label>
          <pre className="proof-preview">{proofPreview}</pre>
        </div>
      )}

      {status === "failed" && <div className="banner error">{error}</div>}

      {status === "done" && receipt && (
        <div className="banner success">
          <p><strong>Vote recorded.</strong></p>
          <p style={{ fontSize: 13 }}>Block: {receipt.blockNumber} · Gas used: {receipt.gasUsed}</p>
          <a className="tx-link" href={`https://sepolia.etherscan.io/tx/${receipt.hash}`} target="_blank" rel="noreferrer">
            View on Etherscan ↗
          </a>
        </div>
      )}
    </div>
  );
}

function mapError(err) {
  const msg = err?.reason || err?.message || "";
  if (msg.includes("VotingEnded")) return "Voting period has ended.";
  if (msg.includes("NullifierAlreadyUsed")) return "You have already voted.";
  if (msg.includes("NotRegistered")) return "This commitment is not registered — did you complete step 1?";
  if (msg.includes("InvalidProof")) return "Proof verification failed — check your secret and vote choice match step 1.";
  if (msg.includes("user rejected")) return "Transaction was rejected in MetaMask.";
  return "Something went wrong. Please try again.";
}
