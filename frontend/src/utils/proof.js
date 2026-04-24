import { buildPoseidon } from 'circomlibjs';
const snarkjs = require('snarkjs');

let poseidon = null;

const initPoseidon = async () => {
  if (!poseidon) {
    poseidon = await buildPoseidon();
  }
  return poseidon;
};

export const computeCommitment = async (vote, secret) => {
  const p = await initPoseidon();
  const commitment = p([vote, secret]);
  return p.F.toString(commitment);
};

export const computeNullifier = async (secret, proposalId) => {
  const p = await initPoseidon();
  const nullifier = p([secret, proposalId]);
  return p.F.toString(nullifier);
};

export const generateProof = async (vote, secret, proposalId, numOptions) => {
  const p = await initPoseidon();
  const F = p.F;
  
  const commitment = p([vote, secret]);
  const nullifier = p([secret, proposalId]);
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
    '/vote.wasm',
    '/vote_final.zkey'
  );
  
  return { 
    proof, 
    publicSignals, 
    commitment: F.toString(commitment), 
    nullifier: F.toString(nullifier) 
  };
};

export const formatProofForSolidity = (proof) => {
  return {
    proofA: [proof.pi_a[0], proof.pi_a[1]],
    proofB: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]]
    ],
    proofC: [proof.pi_c[0], proof.pi_c[1]]
  };
};
