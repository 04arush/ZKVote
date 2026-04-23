pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template Vote() {
    // Private inputs
    signal input vote;
    signal input secret;
    
    // Public inputs
    signal input commitment;
    signal input nullifier;
    signal input proposalId;
    signal input voteOption;
    signal input numOptions;
    
    // Constraint 1: commitment === Poseidon(vote, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== vote;
    commitmentHasher.inputs[1] <== secret;
    commitment === commitmentHasher.out;
    
    // Constraint 2: nullifier === Poseidon(secret, proposalId)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== proposalId;
    nullifier === nullifierHasher.out;
    
    // Constraint 3: vote === voteOption
    vote === voteOption;
    
    // Constraint 4: vote >= 0 AND vote < numOptions
    component lessThan = LessThan(32);
    lessThan.in[0] <== vote;
    lessThan.in[1] <== numOptions;
    lessThan.out === 1;
}

component main {public [commitment, nullifier, proposalId, voteOption, numOptions]} = Vote();
