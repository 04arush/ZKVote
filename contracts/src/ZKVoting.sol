// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IVerifier } from "./interfaces/IVerifier.sol";

/// @title ZKVoting
/// @notice This contract runs a privacy-preserving election. A voter can prove they are
///         eligible, that their vote is for a valid option, and that they have not voted
///         before — all without this contract ever learning who they actually voted for.
/// @dev Vote secrecy is achieved via two derived values, both computed off-chain by the
///      voter and never containing the raw vote choice in readable form:
///        - a "commitment", produced during registration, which locks in a vote choice
///          without revealing it (similar in spirit to a sealed envelope);
///        - a "nullifier", produced at voting time, which lets the contract detect a
///          repeat vote attempt without being able to tell which envelope it came from.
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

    /// @notice Creates a new election that voters can subsequently register and vote in.
    /// @dev Can only be called by `admin` (enforced by the `onlyAdmin` modifier above).
    /// @param proposalId — A unique identifier chosen by the admin for this election.
    /// @param deadline — The Unix timestamp after which no more votes will be accepted.
    /// @param numOptions — How many choices this election has (e.g. 4 for a 4-candidate race).
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

    /// @notice Registers a voter as eligible to vote in an election, without revealing
    ///         which option they intend to vote for.
    /// @dev The `commitment` is computed by the voter's own browser, before this call is
    ///      made, as a one-way cryptographic function of their chosen vote and a secret
    ///      only they know. Because it's one-way, this contract can record the commitment
    ///      on-chain without being able to work backwards to learn the vote it hides.
    /// @param proposalId — The election to register for.
    /// @param commitment — The voter's sealed vote commitment, computed client-side.
    function registerCommitment(uint256 proposalId, uint256 commitment) external {
        if (!proposals[proposalId].active) revert ProposalNotActive();
        if (commitments[commitment]) revert AlreadyRegistered();
        commitments[commitment] = true;
        emit CommitmentRegistered(proposalId, commitment);
    }

    /// @notice Casts a vote by submitting cryptographic proof that it is valid, and — if
    ///         the proof checks out — permanently records it in the running tally.
    /// @dev It checks four things, in order, and stops at the first one that fails:
    ///        1. Does this election exist and is it still active?
    ///        2. Is the election's deadline still in the future?
    ///        3. Has this vote's commitment actually been registered (see `registerCommitment`)?
    ///        4. Has this vote's nullifier already been used (i.e. is this a repeat vote)?
    /// @param proofA — The first component of the zero-knowledge proof.
    /// @param proofB — The second component of the zero-knowledge proof.
    /// @param proofC — The third component of the zero-knowledge proof.
    /// @param nullifier — The one-time-use value proving this specific vote hasn't been cast before.
    /// @param commitment — The previously registered sealed vote commitment this proof corresponds to.
    /// @param voteOption — Which option (e.g. which candidate, as a number) this vote is for.
    /// @param proposalId — The election this vote is being cast in.
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

    /// @notice Returns the current vote count for every option in a given election, so
    ///         anyone can see the outcome without needing any special permission.
    /// @dev Reads directly from the `tally` mapping and reshapes it into a simple list, one
    ///      entry per option, in option order (index 0 first, then 1, 2, and so on). No
    ///      individual vote is ever exposed by this or any other function.
    /// @param proposalId — The election to fetch results for.
    /// @return results — An array where `results[i]` is the number of votes option `i` has received.
    function getResults(uint256 proposalId) external view returns (uint256[] memory results) {
        uint256 n = proposals[proposalId].numOptions;
        results = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            results[i] = tally[proposalId][i];
        }
    }
}
