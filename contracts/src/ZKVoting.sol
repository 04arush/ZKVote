// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IVerifier } from "./interfaces/IVerifier.sol";

// @title ZKVoting
// @notice On-chain registry, proof verification, and tally logic for ZKVote
contract ZKVoting {

    // ==================== STATE VARIABLES ====================

    IVerifier public immutable verifier;
    address public immutable admin;

    struct ProposalConfig {
        uint256 deadline;
        uint256 numOptions;
        bool active;
    }

    // commitment => registered
    mapping(uint256 => bool) public commitments;
    // nullifier => spent
    mapping(uint256 => bool) public nullifierUsed;
    // proposalId => optionIndex => voteCount
    mapping(uint256 => mapping(uint256 => uint256)) public tally;
    // proposalId => config
    mapping (uint256 => ProposalConfig) public proposals;


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

}
