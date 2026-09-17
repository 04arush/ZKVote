import { useState } from "react";
import { computeCommitment, computeNullifier } from "../lib/poseidon";
import { generateVoteProof, formatProofForSolidity } from "../lib/prove";
import { getZKVotingContract } from "../hooks/useZKVoting";

export default function CastVote({ signer, proposalId, numOptions }) {
  const [secretInput, setSecretInput] = useState("");
  const [voteChoice, setVoteChoice] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | generating | submitting | done | failed
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  async function handleVote() {
    setError(null);
    try {
      setStatus("generating");
      const secret = BigInt(secretInput);
      const commitment = await computeCommitment(voteChoice, secret);
      const nullifier = await computeNullifier(secret, proposalId);

      const { proof } = await generateVoteProof({
        vote: voteChoice,
        secret,
        commitment,
        nullifier,
        proposalId,
        voteOption: voteChoice,
        numOptions,
      });
      const { proofA, proofB, proofC } = formatProofForSolidity(proof);

      setStatus("submitting");
      const contract = getZKVotingContract(signer);
      const tx = await contract.castVote(proofA, proofB, proofC, nullifier, commitment, voteChoice, proposalId);
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setError(mapError(err));
      setStatus("failed");
    }
  }

  return (
    <div>
      <h2>Cast Your Vote</h2>
      <input
        type="text"
        placeholder="Your secret"
        value={secretInput}
        onChange={(e) => setSecretInput(e.target.value)}
      />
      <input
        type="number"
        min="0"
        max={numOptions - 1}
        value={voteChoice}
        onChange={(e) => setVoteChoice(Number(e.target.value))}
      />
      <button onClick={handleVote} disabled={status === "generating" || status === "submitting"}>
        Cast Vote
      </button>
      {status === "generating" && <p>Generating proof in-browser (2–5s)...</p>}
      {status === "submitting" && <p>Waiting for transaction confirmation...</p>}
      {status === "done" && <p>Vote recorded! Tx: {txHash}</p>}
      {status === "failed" && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

/** Maps common revert reasons to user-facing messages (FR-8). */
function mapError(err) {
  const msg = err?.reason || err?.message || "";
  if (msg.includes("VotingEnded")) return "Voting period has ended.";
  if (msg.includes("NullifierAlreadyUsed")) return "You have already voted.";
  if (msg.includes("NotRegistered")) return "This commitment is not registered.";
  if (msg.includes("InvalidProof")) return "Proof verification failed — check your secret and vote choice.";
  if (msg.includes("user rejected")) return "Transaction was rejected in MetaMask.";
  return "Something went wrong. Please try again.";
}
