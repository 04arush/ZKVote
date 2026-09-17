import { buildPoseidon } from "circomlibjs";

let poseidonInstance = null;

async function getPoseidon() {
    if (!poseidonInstance) poseidonInstance = await buildPoseidon();
    return poseidonInstance;
}

export async function computeCommitment(vote, secret) {
    const poseidon = await getPoseidon();
    const hash = poseidon([BigInt(vote), BigInt(secret)]);
    return poseidon.F.toObject(hash);
}

export async function computeNullifier(secret, proposalId) {
    const poseidon = await getPoseidon();
    const hash = poseidon([BigInt(secret), BigInt(proposalId)]);
    return poseidon.F.toObject(hash);
}

export function generateRandomSecret() {
    // 253-bit random field element (safely under the BN128 scalar field size)
    const array = new Uint8Array(31);
    window.crypto.getRandomValues(array);
    return BigInt("0x" + Buffer.from(array).toString("hex"));
}
