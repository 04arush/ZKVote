import * as snarkjs from "snarkjs";

/**
 * Generates a Groth16 proof entirely in-browser.
 * Inputs order must match vote.circom's public/private signal declarations (Stage 2 §2.2).
 */
export async function generateVoteProof({ vote, secret, commitment, nullifier, proposalId, voteOption, numOptions }) {
    const input = {
        vote: vote.toString(),
        secret: secret.toString(),
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
        proposalId: proposalId.toString(),
        voteOption: voteOption.toString(),
        numOptions: numOptions.toString()
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "/circuit/vote.wasm",
        "/circuit/vote_final.zkey"
    );

    return { proof, publicSignals };
}

/** Reformats a snarkjs proof object into the calldata shape Solidity expects. */
export function formatProofForSolidity(proof) {
  return {
    proofA: [proof.pi_a[0], proof.pi_a[1]],
    // snarkjs pi_b coordinates are reversed per pair for the EVM's G2 encoding
    proofB: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    proofC: [proof.pi_c[0], proof.pi_c[1]],
  };
}
