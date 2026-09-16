// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IVerifier } from "./interfaces/IVerifier.sol";

// @title ZKVoting
// @notice On-chain registry, proof verification, and tally logic for ZKVote
contract ZKVoting {

    // =================== TYPE DECLARATIONS ===================

    struct ProposalConfig {
        uint256 deadline;
        uint256 numOptions;
        bool active;
    }


    // ==================== STATE VARIABLES ====================

    IVerifier public immutable verifier;
    address public immutable admin;


    // ======================= MAPPINGS ========================

    // commitment => registered
    mapping(uint256 => bool) public commitments;
    // nullifier => spent
    mapping(uint256 => bool) public nullifierUsed;
    // proposalId => optionIndex => voteCount
    mapping(uint256 => mapping(uint256 => uint256)) public tally;
    // proposalId => config
    mapping (uint256 => ProposalConfig) public proposals;


    // ======================== EVENTS =========================

    event ProposalCreated(uint256 indexed proposalId, uint256 deadline, uint256 numOptions);
    event CommitmentRegistered(uint256 indexed proposalId, uint256 commitment);
    event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint256 voteOption);


    // ======================== ERRORS =========================

    error AlreadyRegistered();
    error NotRegistered();
    error VotingEnded();
    error NullifierAlreadyUsed();
    error InvalidProof();
    error ProposalNotActive();
    error InvalidOptionCount();
    error NotAdmin();
    error DeadlineInPast();


    // ======================= MODIFIERS =======================

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }


    // ======================= FUNCTIONS =======================

    // ---------------------- Constructor ----------------------

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
        admin = msg.sender;
    }


    // ------------------- External Functions ------------------

    /// @notice Creates a new proposal. Mirrors an `Elections` row's on_chain_proposal_id.
    function createProposal(
        uint256 proposalId,
        uint256 deadline,
        uint256 numOptions
    ) external onlyAdmin {
        if (numOptions == 0) revert InvalidOptionCount();
        if (deadline <= block.timestamp) revert DeadlineInPast();
        proposals[proposalId] = ProposalConfig({
            deadline: deadline,
            numOptions: numOptions,
            active: true
        });
        emit ProposalCreated(proposalId, deadline, numOptions);
    }

    /// @notice Registers a voter's commitment = Poseidon(vote, secret), Computed client-side.
    function registerCommitment(uint256 proposalId, uint256 commitment) external {
        if (!proposals[proposalId].active) revert ProposalNotActive();
        if (commitments[commitment]) revert AlreadyRegistered();
        commitments[commitment] = true;
        emit CommitmentRegistered(proposalId, commitment);
    }

    /// @notice Verifies a Groth16 proof and, if valid, records the vote.
    /// Check ordering follows checks-effects-interactions: cheapest/storage checks
    /// first, the expensive pairing check (verifyProof) last before state changes.
    function castVote(
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC,
        uint256 nullifier,
        uint256 commitment,
        uint256 voteOption,
        uint256 proposalId
    ) external {
        ProposalConfig memory p = proposals[proposalId];
        if (!p.active) revert ProposalNotActive();
        if (block.timestamp > p.deadline) revert VotingEnded();
        if (!commitments[commitment]) revert NotRegistered();
        if (nullifierUsed[nullifier]) revert NullifierAlreadyUsed();

        uint256[5] memory publicSignals = [commitment, nullifier, proposalId, voteOption, p.numOptions];
        bool valid = verifier.verifyProof(proofA, proofB, proofC, publicSignals);
        if (!valid) revert InvalidProof();

        nullifierUsed[nullifier] = true;
        tally[proposalId][voteOption] += 1;

        emit VoteCast(proposalId, nullifier, voteOption);
    }

    function getResults(uint256 proposalId) external view returns (uint256[] memory results) {
        uint256 n = proposals[proposalId].numOptions;
        results = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            results[i] = tally[proposalId][i];
        }
    }
}
