const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");

async function generateProof(vote, secret, proposalId, numOptions) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    
    const commitment = poseidon([vote, secret]);
    const nullifier = poseidon([secret, proposalId]);
    const voteOption = vote;
    
    const input = {
        vote: vote.toString(),
        secret: F.toString(secret),
        commitment: F.toString(commitment),
        nullifier: F.toString(nullifier),
        proposalId: proposalId.toString(),
        voteOption: voteOption.toString(),
        numOptions: numOptions.toString()
    };
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "./build/vote_js/vote.wasm",
        "./keys/vote_final.zkey"
    );
    
    return { proof, publicSignals, commitment: F.toString(commitment), nullifier: F.toString(nullifier) };
}

function formatProofForSolidity(proof) {
    return {
        proofA: [proof.pi_a[0], proof.pi_a[1]],
        proofB: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        proofC: [proof.pi_c[0], proof.pi_c[1]]
    };
}

module.exports = { generateProof, formatProofForSolidity };
