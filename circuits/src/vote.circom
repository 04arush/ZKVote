pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template Vote(numOptionsBits) {

    // ----- Private Inputs ---------------

    signal input vote;      // the voter's actual choice (range: 0..numOptions-1)
    signal input secret;    // random client-generated salt

    // ----- Public Inputs ----------------

    signal input commitment;    // must equal Poseidon(vote, secret)
    signal input nullifier;     // must equal Poseidon(secret, proposalId)
    signal input proposalId;
    signal input voteOption;    // must qual the private 'vote'
    signal input numOptions;    // upper bound for the range check

    // 1. Bind the public voteOption to the private vote.
    //    This lets the contract read voteOption in the clear for tallying,
    //    while the circuit proves it's the same value the voter committed to.
    vote === voteOption;

    // 2. Commitment correctness: commitment == Poseidon(vote, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== vote;
    commitmentHasher.inputs[1] <== secret;
    commitmentHasher.out === commitment;

    // 3. Nullifier Correctness: nullifier == Poseidon(secret, proposalId)
    //    Same secret + same proposal always produces the same nullifier,
    //    so reusing it on the same proposal is detectable on-chain.
    //    A different proposalId yields a different, unlinkable nullifier.
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== proposalId;
    nullifierHasher.out === nullifier;

    // 4. Range check: 0 <= vote < numOptions
    component lt = LessThan(numOptionsBits);
    lt.in[0] <== vote;
    lt.in[1] <== numOptions;
    lt.out === 1;
}

component main {public [commitment, nullifier, proposalId, voteOption, numOptions]} = Vote(8);
