import { useState } from "react";
import { computeCommitment, generateRandomSecret } from "../lib/poseidon";
import { getZKVotingContract } from "../hooks/useZKVoting";

export default function Register({ signer, proposalId, candidates }) {
  const [voteChoice, setVoteChoice] = useState(0);
  const [secret, setSecret] = useState(null);
  const [status, setStatus] = useState("idle");
  const [txHash, setTxHash] = useState(null);

  async function handleRegister() {
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
  }

  return (
    <div>
      <h2>Register to Vote</h2>
      <select value={voteChoice} onChange={(e) => setVoteChoice(Number(e.target.value))}>
        {candidates.map((c) => (
          <option key={c.candidate_id} value={c.option_index}>
            {c.candidate_name}
          </option>
        ))}
      </select>
      <button onClick={handleRegister} disabled={status === "computing" || status === "submitting"}>
        Register
      </button>
      {status === "done" && (
        <div>
          <p>Registered! Tx: {txHash}</p>
          <p style={{ color: "red" }}>
            SAVE THIS SECRET — you need it to vote and it cannot be recovered:
            <br />
            <code>{secret.toString()}</code>
          </p>
        </div>
      )}
    </div>
  );
}
