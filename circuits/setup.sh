#!/bin/bash

echo "Starting ZKVote Trusted Setup..."

# Compile circuit with include path
echo "Compiling circuit..."
circom vote.circom --r1cs --wasm --sym -o build/ -l node_modules

# Powers of Tau Phase 1
echo "Powers of Tau - Phase 1..."
snarkjs powersoftau new bn128 12 pot12_0.ptau -v
snarkjs powersoftau contribute pot12_0.ptau pot12_1.ptau --name="ZKVote" -v -e="$(date +%s)"
snarkjs powersoftau prepare phase2 pot12_1.ptau pot12_final.ptau -v

# Phase 2
echo "Phase 2 setup..."
snarkjs groth16 setup build/vote.r1cs pot12_final.ptau keys/vote_0.zkey
snarkjs zkey contribute keys/vote_0.zkey keys/vote_final.zkey --name="ZKVote" -v -e="$(date +%s)"

# Export keys
echo "Exporting verification key..."
snarkjs zkey export verificationkey keys/vote_final.zkey keys/verification_key.json

echo "Exporting Solidity verifier..."
snarkjs zkey export solidityverifier keys/vote_final.zkey ../contracts/src/Verifier.sol

# Cleanup
echo "Cleaning up intermediate files..."
rm pot12_0.ptau pot12_1.ptau keys/vote_0.zkey

echo "Trusted setup complete!"
echo "Verifier.sol has been generated in ../contracts/src/"
