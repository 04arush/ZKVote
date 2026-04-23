const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");

async function generateWitness(vote, secret, proposalId, numOptions) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    
    // Compute commitment = Poseidon(vote, secret)
    const commitment = poseidon([vote, secret]);
    
    // Compute nullifier = Poseidon(secret, proposalId)
    const nullifier = poseidon([secret, proposalId]);
    
    // voteOption equals vote
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
        "../circuits/build/vote_js/vote.wasm",
        "../circuits/keys/vote_final.zkey"
    );
    
    return { proof, publicSignals, commitment, nullifier };
}

module.exports = { generateWitness };
