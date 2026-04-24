import { ethers } from 'ethers';
import { ZKVOTING_ADDRESS } from '../constants/addresses';
import ZKVotingABI from '../abi/ZKVoting.json';

export const getProvider = () => {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

export const getZKVotingContract = async (signer) => {
  return new ethers.Contract(ZKVOTING_ADDRESS, ZKVotingABI.abi, signer);
};

export const registerCommitment = async (commitment, signer) => {
  const contract = await getZKVotingContract(signer);
  const tx = await contract.registerCommitment(commitment);
  return await tx.wait();
};

export const castVote = async (proofA, proofB, proofC, nullifier, commitment, voteOption, proposalId, signer) => {
  const contract = await getZKVotingContract(signer);
  const tx = await contract.castVote(proofA, proofB, proofC, nullifier, commitment, voteOption, proposalId);
  return await tx.wait();
};

export const getResults = async (proposalId, provider) => {
  const contract = new ethers.Contract(ZKVOTING_ADDRESS, ZKVotingABI.abi, provider);
  return await contract.getResults(proposalId);
};
