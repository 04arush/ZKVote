// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./IVerifier.sol";

contract ZKVoting {
    IVerifier public immutable verifier;
    address public owner;
    
    mapping(uint256 => bool) public commitments;
    mapping(uint256 => bool) public nullifierUsed;
    mapping(uint256 => mapping(uint256 => uint256)) public tally;
    mapping(uint256 => ProposalConfig) public proposals;
    
    struct ProposalConfig {
        uint256 deadline;
        uint256 numOptions;
        bool active;
    }
    
    event VoterRegistered(uint256 indexed commitment);
    event VoteCast(uint256 indexed nullifier, uint256 indexed proposalId, uint256 voteOption);
    event ProposalCreated(uint256 indexed proposalId, uint256 deadline, uint256 numOptions);
    
    error AlreadyRegistered();
    error NotRegistered();
    error NullifierAlreadyUsed();
    error VotingEnded();
    error VotingNotEnded();
    error InvalidProof();
    error InvalidOption();
    error ProposalNotActive();
    error Unauthorized();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
        owner = msg.sender;
    }
    
    function createProposal(uint256 proposalId, uint256 deadline, uint256 numOptions) external onlyOwner {
        require(deadline > block.timestamp, "Invalid deadline");
        require(numOptions > 1, "Invalid options");
        
        proposals[proposalId] = ProposalConfig({
            deadline: deadline,
            numOptions: numOptions,
            active: true
        });
        
        emit ProposalCreated(proposalId, deadline, numOptions);
    }
    
    function registerCommitment(uint256 commitment) external {
        if (commitments[commitment]) revert AlreadyRegistered();
        commitments[commitment] = true;
        emit VoterRegistered(commitment);
    }
    
    function castVote(
        uint[2] calldata proofA,
        uint[2][2] calldata proofB,
        uint[2] calldata proofC,
        uint256 nullifier,
        uint256 commitment,
        uint256 voteOption,
        uint256 proposalId
    ) external {
        ProposalConfig memory proposal = proposals[proposalId];
        
        if (!proposal.active) revert ProposalNotActive();
        if (block.timestamp > proposal.deadline) revert VotingEnded();
        if (nullifierUsed[nullifier]) revert NullifierAlreadyUsed();
        if (!commitments[commitment]) revert NotRegistered();
        if (voteOption >= proposal.numOptions) revert InvalidOption();
        
        bool valid = verifier.verifyProof(
            proofA,
            proofB,
            proofC,
            [nullifier, commitment, voteOption, proposalId]
        );
        
        if (!valid) revert InvalidProof();
        
        nullifierUsed[nullifier] = true;
        tally[proposalId][voteOption]++;
        
        emit VoteCast(nullifier, proposalId, voteOption);
    }
    
    function getResults(uint256 proposalId) external view returns (uint256[] memory) {
        uint256 numOptions = proposals[proposalId].numOptions;
        uint256[] memory results = new uint256[](numOptions);
        
        for (uint256 i = 0; i < numOptions; i++) {
            results[i] = tally[proposalId][i];
        }
        
        return results;
    }
}
