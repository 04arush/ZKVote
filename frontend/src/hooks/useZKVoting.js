import { Contract } from "ethers";
import abiJson from "../abi/ZKVoting.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export function getZKVotingContract(signerOrProvider) {
    return new Contract(CONTRACT_ADDRESS, abiJson.abi, signerOrProvider);
}
