const { buildPoseidon } = require("circomlibjs");

async function main() {

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const vote = 2n;
    const secret = 123456789n;
    const proposalId = 1n;

    const commitment = F.toObject(poseidon([vote, secret]));
    const nullifier = F.toObject(poseidon([secret, proposalId]));

    console.log(JSON.stringify({
        vote: vote.toString(),
        secret: secret.toString(),
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
        proposalId: proposalId.toString(),
        voteOption: vote.toString(),
        numOptions: "4"
    }, null, 2));
}

main();
