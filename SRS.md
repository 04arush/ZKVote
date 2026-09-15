# Software Requirements Specification (SRS)

## ZKVote: A Privacy-Preserving Decentralized Voting System Using Zero-Knowledge Proofs and Smart Contracts

- **Prepared for:** Final Year Project Report
- **Prepared by:** Arush Singh
- **Guide:** Kushagra Sahni
- **Document Version:** 1.0

---

## Table of Contents

1. Introduction
2. Overall Description
3. System Features (Functional Requirements)
4. External Interface Requirements
5. System Analysis (DFDs, ER Diagram, Data Dictionary)
6. Data Design (Database, Smart Contract Storage, Circuit Signals)
7. Non-Functional Requirements
8. Design & Implementation Constraints
9. Security Requirements
10. Testing Requirements (Traceability)
11. Appendices

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the complete functional and non-functional requirements for **ZKVote**, a privacy-preserving decentralized voting DApp built on the Ethereum Sepolia testnet using Zero-Knowledge Proofs (Groth16/Circom), Solidity smart contracts, a React.js frontend, and a MySQL-backed metadata service.

### 1.2 Scope
ZKVote allows a registered voter to prove — via a zero-knowledge proof — that they are eligible to vote, are voting for a valid option, and have not voted before, **without revealing which option they chose**. The system guarantees:
- **Vote privacy** — no on-chain observer can link a vote to a voter.
- **Double-vote prevention** — enforced cryptographically via a nullifier registry.
- **Public verifiability** — anyone can verify that only valid votes were tallied, and can independently audit the final tally.

The system is scoped as an academic proof-of-concept, deployed to the Ethereum Sepolia public testnet, with a Web 2.5 hybrid architecture: cryptographic/state-critical data lives entirely on-chain; non-sensitive, read-only election metadata (candidates, election schedule, admin accounts) is served from a MySQL database via a Node/Express REST API.

Out of scope for the current version (see Future Scope): PLONK/STARK proof systems, ZK-rollup deployment, decentralized identity for eligibility, multi-proposal/ranked-choice voting, IPFS key distribution, Noir circuit migration, native mobile client, and formal verification — all listed as future enhancements, not current deliverables.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| ZKP | Zero-Knowledge Proof — a cryptographic method allowing one party to prove a statement is true without revealing supporting information. |
| Groth16 | A zk-SNARK proving system requiring a circuit-specific trusted setup; used here for its small proof size and cheap on-chain verification. |
| Circom | A domain-specific language for writing arithmetic circuits, compiled to R1CS/WASM for witness and proof generation. |
| snarkjs | A JavaScript library implementing trusted setup ceremonies, witness computation, proof generation, and Solidity verifier export. |
| Poseidon Hash | A hash function designed to be efficient inside arithmetic (ZK) circuits; used for commitments and nullifiers. |
| Commitment | `Poseidon(vote, secret)` — a hiding, binding value registered on-chain in place of the raw vote. |
| Nullifier | `Poseidon(secret, proposalId)` — a unique, unlinkable value stored on-chain after voting to prevent a voter from voting twice on the same proposal. |
| R1CS | Rank-1 Constraint System — the intermediate representation of a compiled Circom circuit. |
| Trusted Setup | A ceremony (Powers of Tau + circuit-specific Phase 2) that generates the proving/verification key pair for a Groth16 circuit. |
| DApp | Decentralized Application — a frontend that interacts directly with smart contracts on a blockchain. |
| EOA | Externally Owned Account — a user-controlled Ethereum account (e.g. a MetaMask wallet). |
| Web 2.5 | An architecture hybridizing a traditional Web2 backend (database, REST API) for non-critical metadata with Web3 (blockchain) for trust-critical state. |
| Sepolia | A public Ethereum test network used for deployment and testing without real-value transactions. |

### 1.4 References
1. Ben-Sasson, E., et al., "Succinct Non-Interactive Zero Knowledge for a von Neumann Architecture," USENIX Security Symposium, 2014.
2. iden3 / Polygon Hermez, Circom Language Documentation — docs.circom.io
3. iden3, snarkjs Library Documentation — github.com/iden3/snarkjs
4. Ethereum Foundation, Solidity Language Documentation v0.8.x — docs.soliditylang.org
5. Foundry Book — book.getfoundry.sh
6. Grassi, L., et al., "Poseidon: A New Hash Function for Zero-Knowledge Proof Systems," USENIX Security 2021.
7. Ethers.js Documentation v6 — docs.ethers.org/v6

### 1.5 Overview
Section 2 gives the overall product context. Section 3 enumerates functional requirements as discrete system features. Section 4 specifies external interfaces. Section 5 reproduces and extends the DFDs, ER diagram, and data dictionary. Section 6 details the data design across all three storage layers (MySQL, smart contract storage, circuit signals). Section 7 covers non-functional requirements. Section 8 lists constraints. Section 9 isolates security requirements (given their centrality to a voting system). Section 10 maps mandated testing levels. Section 11 holds supporting appendices.

---

## 2. Overall Description

### 2.1 Product Perspective
ZKVote is a new, self-contained system — not a modification of an existing product. It is composed of four cooperating subsystems, each independently developed and tested per the module breakdown in the synopsis:

```
                        ┌───────────────────────────┐
                        │        VOTER BROWSER        │
                        │  (React.js + ethers.js +    │
                        │   snarkjs WASM prover)       │
                        └───────┬───────────┬─────────┘
                                │           │
                     MetaMask   │           │  REST (candidates,
                     tx / calls │           │  election schedule)
                                ▼           ▼
                  ┌──────────────────┐   ┌───────────────────────┐
                  │ Ethereum Sepolia │   │ Node.js/Express Backend │
                  │  ZKVoting.sol    │   │  + MySQL 8.0            │
                  │  Verifier.sol    │   │ (Admin_Users, Elections,│
                  │ (on-chain state) │   │  Candidates)            │
                  └──────────────────┘   └───────────────────────┘
```

The blockchain layer is the **sole source of truth** for anything that affects vote validity or tallying (commitments, nullifiers, tallies, deadlines). The MySQL layer is a **read-only convenience layer** for election/candidate presentation data and has no bearing on cryptographic guarantees.

### 2.2 Product Functions (Summary)
- Voter wallet connection and commitment-based registration.
- In-browser, client-side Groth16 proof generation (private inputs never leave the browser).
- On-chain proof verification, nullifier-based double-vote prevention, and tally update.
- Public, permissionless result retrieval after the voting deadline.
- Admin-side election and candidate metadata management (MySQL/backend).
- Full error handling for wallet, proof, and transaction failure states.

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Proficiency Assumed |
|---|---|---|
| Voter | Any registered wallet holder eligible to vote in an election | Owns a MetaMask wallet; no cryptography knowledge required — proof generation is automated |
| Election Administrator | Creates elections and candidate lists via the backend/admin portal | Basic database/admin-portal familiarity |
| Public Auditor / Result Viewer | Anyone verifying results or auditing on-chain state | May use Etherscan or the results dashboard; no login required |
| Developer/Evaluator (Project Guide/Examiner) | Reviews code, circuits, and contracts for correctness | Solidity/Circom familiarity |

### 2.4 Operating Environment
- **Client:** Google Chrome or Firefox with the MetaMask browser extension, on Windows 11 or Ubuntu.
- **Blockchain:** Ethereum Sepolia public testnet.
- **Backend server:** Node.js 18+ / Express 4.x, connecting to MySQL 8.0+ via `mysql2`.
- **Development tooling:** Foundry (forge/anvil/cast) for Solidity; Circom 2.0+ and snarkjs 0.7+ for the ZK circuit toolchain.

### 2.5 Design and Implementation Constraints
- Must use Solidity 0.8.20 (per synopsis Tools table); no use of deprecated/unsafe patterns.
- Groth16 requires a circuit-specific trusted setup (Powers of Tau + Phase 2) — a known constraint acknowledged and slated for future migration to PLONK/STARKs.
- Circuit correctness is fixed at compile time; any change to voting logic (e.g., new constraint) requires re-running trusted setup and redeploying `Verifier.sol`.
- Gas costs bound the practical size of on-chain state (mappings only, no arrays iterated on-chain for tallying beyond `optionIndex` bounds).

### 2.6 Assumptions and Dependencies
- Voters have access to a funded Sepolia wallet (testnet ETH) for gas.
- The voter's secret (`secret`) is generated and safeguarded client-side; loss of the secret means the voter cannot cast a valid vote (no recovery mechanism in this version).
- The MySQL backend and the blockchain are assumed independently available; a MySQL outage degrades the candidate-display experience but does not compromise on-chain voting integrity, since the contract does not depend on the database.
- The Powers of Tau ceremony output used for Phase 1 setup is assumed to be honestly generated (standard practice: reuse of a public, audited Powers of Tau file).

---

## 3. System Features (Functional Requirements)

Each feature is expressed as: description, inputs, processing, outputs, and priority, per module.

### 3.1 FR-1: Wallet Connection
- **Description:** The voter connects a MetaMask wallet to establish `walletState { address, signer, provider }`.
- **Input:** User action ("Connect Wallet").
- **Processing:** `ethers.js` requests account access from MetaMask; provider/signer objects are cached in frontend state.
- **Output:** Displayed wallet address; enabled registration/voting UI.
- **Priority:** High (blocking precondition for all other features).

### 3.2 FR-2: Candidate/Election Metadata Retrieval
- **Description:** Before registration or voting, the frontend fetches the active election's candidate list and option-index mapping from the backend.
- **Input:** `election_id` / active election query.
- **Processing:** REST GET call to Express backend → MySQL `Elections` + `Candidates` join.
- **Output:** Candidate list rendered with `candidate_name`, `bio`, `party_or_affiliation`, `option_index`.
- **Priority:** High.

### 3.3 FR-3: Voter Registration (Commitment Submission)
- **Description:** Voter selects a vote choice and a secret passphrase; the browser computes a Poseidon commitment and registers it on-chain.
- **Input:** `vote` (private, 0 to N−1), `secret` (private, client-generated).
- **Processing:**
  1. `commitment = Poseidon(vote, secret)` computed client-side via snarkjs/circomlibjs.
  2. `registerCommitment(commitment)` called on `ZKVoting.sol`.
  3. Contract checks commitment not already registered; stores it in `commitments` mapping; emits event.
- **Output:** On-chain registration confirmation; voter instructed to securely retain `secret`.
- **Priority:** High.
- **Pre-condition:** Wallet connected, election active, voting deadline not passed.
- **Post-condition:** `commitments[commitment] == true` on-chain.

### 3.4 FR-4: Zero-Knowledge Proof Generation
- **Description:** At voting time, the browser regenerates the commitment/nullifier and produces a Groth16 proof attesting to a valid, unlinkable vote.
- **Input:** `vote`, `secret` (private, re-entered/cached), `proposalId` (public).
- **Processing (sub-steps, per Level-2 DFD):**
  1. P2.1 Collect private inputs (`vote`, `secret`).
  2. P2.2 Compute Poseidon `commitment` and `nullifier = Poseidon(secret, proposalId)`.
  3. P2.3 Generate witness via the compiled WASM circuit.
  4. P2.4 Run the Groth16 prover (`snarkjs.groth16.fullProve`) — target 2–5 seconds.
  5. P2.5 Format proof (`proofA`, `proofB`, `proofC`) into Solidity calldata shape.
- **Output:** `{ proof, publicSignals }` ready for on-chain submission.
- **Priority:** High (core cryptographic feature).

### 3.5 FR-5: Vote Casting (On-Chain Verification & Tally)
- **Description:** The proof and public signals are submitted to `ZKVoting.sol`, which verifies the proof and updates state atomically.
- **Input:** `proofA`, `proofB`, `proofC`, `nullifier`, `commitment`, `voteOption`, `proposalId`.
- **Processing:**
  1. Contract checks `block.timestamp <= votingDeadline`.
  2. Contract checks `nullifierUsed[nullifier] == false`.
  3. Contract checks `commitments[commitment] == true`.
  4. Contract calls `verifier.verifyProof(proofA, proofB, proofC, [nullifier, commitment, voteOption, proposalId])`.
  5. On success: `nullifierUsed[nullifier] = true`; `tally[proposalId][voteOption]++`.
  6. On any failure: transaction reverts with a specific custom error (`AlreadyRegistered`, `NotRegistered`, `VotingEnded`, `InvalidProof`, `NullifierAlreadyUsed`).
- **Output:** Transaction hash; UI vote-confirmation screen.
- **Priority:** Critical (this is the system's core correctness guarantee).

### 3.6 FR-6: Result Retrieval
- **Description:** After the voting deadline, anyone can query aggregate results.
- **Input:** `proposalId`.
- **Processing:** `getResults(proposalId)` reads `tally[proposalId][...]` and returns a `uint256[]` array indexed by option.
- **Output:** Bar-chart-style results dashboard; individual votes remain permanently unlinkable to voters.
- **Priority:** High.

### 3.7 FR-7: Election & Candidate Administration (Backend)
- **Description:** An administrator creates elections and candidate entries via the MySQL-backed admin flow.
- **Input:** Election `title`, `description`, `start_time`, `end_time`, `on_chain_proposal_id`; per-candidate `candidate_name`, `party_or_affiliation`, `bio`, `option_index`, `profile_image_url`.
- **Processing:** Standard CRUD via Express REST endpoints against `Elections` and `Candidates` tables, gated by `Admin_Users` authentication (`password_hash`).
- **Output:** Persisted election/candidate records consumed by FR-2.
- **Priority:** Medium (supports the voter-facing flow but is not part of the cryptographic trust boundary).

### 3.8 FR-8: Error Handling & User Feedback
- **Description:** The system surfaces user-friendly errors for all failure states identified in the synopsis: MetaMask not connected, secret/commitment mismatch, double-vote attempt, expired voting period, rejected/failed transaction, invalid proof.
- **Priority:** Medium-High (essential for usability and for grading rubric coverage of "complete error handling").

---

## 4. External Interface Requirements

### 4.1 User Interfaces
The frontend must provide, at minimum:

| Screen | Key Elements |
|---|---|
| Registration Screen | Wallet address display, vote-choice input, secret-passphrase input, computed commitment preview, "Register" button |
| Proof Generation Screen | Progress indicator (Idle / Generating / Complete / Failed), generated nullifier display |
| Vote Casting Screen | Formatted `proofA`/`proofB`/`proofC`, public signals, "Cast Vote" button, MetaMask confirmation dialog |
| Transaction Confirmation Screen | Sepolia tx hash, block number, gas used, Etherscan link |
| Results Dashboard | Proposal title, total votes cast, per-option vote-count table/bar chart |
| Error Screens | Contextual messages for each error state listed in FR-8 |

### 4.2 Hardware Interfaces
None directly (no custom hardware). Indirect dependency on a MetaMask-compatible browser environment and sufficient client RAM (8 GB min., 16 GB recommended) for in-browser proof generation.

### 4.3 Software Interfaces
| Interface | Purpose |
|---|---|
| MetaMask (window.ethereum) | Wallet connection, transaction signing |
| snarkjs (WASM) | Witness generation, Groth16 proving, in-browser |
| ethers.js v6 | Contract calls, event listening, provider/signer management |
| Express REST API | Candidate/election metadata retrieval (`GET /api/elections/:id`, `GET /api/elections/:id/candidates`) |
| mysql2 driver | Node.js ↔ MySQL 8.0 connectivity |

### 4.4 Communication Interfaces
- HTTPS between frontend and Express backend (REST/JSON).
- JSON-RPC over HTTPS/WSS between frontend and Sepolia node (via MetaMask's injected provider or a public RPC endpoint).

---

## 5. System Analysis

### 5.1 Data Flow Diagrams

**Level 0 (Context Diagram)**
External entities: **Voter**, **Ethereum Blockchain**, **MySQL/Backend**. The ZKVote System is the single process receiving registration requests, ZK proofs, and vote options from the Voter; exchanging proof data, nullifiers, commitments, and tally updates with the Ethereum Blockchain; and reading election/candidate metadata from MySQL/Backend. No sensitive data (`secret`, raw `vote`) ever leaves the voter's browser.

**Level 1 (Five Sub-Processes)**
1. **P1 – Register Voter:** Voter Address + Commit Hash → Commitments Mapping (on-chain).
2. **P2 – Generate ZK Proof:** Private Vote Choice + Secret + Proposal ID → Groth16 Proof + Nullifier (client-side only).
3. **P3 – Verify Proof On-Chain:** Proof + Public Signals → Valid/Invalid boolean (via `Verifier.sol`); also fetches candidate/option data from MySQL for display consistency.
4. **P4 – Record Vote & Nullifier:** Verified Proof + Nullifier + Vote Option → Nullifiers store + Tally Mapping update.
5. **P5 – Retrieve Results:** Proposal ID + Read Request → Vote Counts per Option (array) → Result Viewer.

A pre-proof data-retrieval flow feeds candidate metadata from MySQL into the voter interface before P2 is triggered, ensuring the `vote` private input corresponds to a legitimate, database-registered `option_index`.

**Level 2 (Expansion of P2 – Generate ZK Proof)**
- P2.1 Collect Private Inputs (`vote`, `secret`, `proposal_id`)
- P2.2 Compute Poseidon Hashes (→ `commitment`, `nullifier`)
- P2.3 Generate Witness
- P2.4 Run Groth16 Prover (→ raw proof)
- P2.5 Format for Solidity (→ calldata-formatted proof)

All five sub-steps execute client-side; only the final formatted proof and public signals cross the client/chain boundary into P3.

### 5.2 Entity-Relationship Diagram (MySQL Layer)

```
ADMIN_USERS (1) ──Manages──< (N) ELECTIONS (1) ──Contains──< (N) CANDIDATES
```

- **ADMIN_USERS**: `admin_id (PK)`, `full_name`, `email (UNIQUE)`, `password_hash`, `created_at`
- **ELECTIONS**: `election_id (PK)`, `admin_id (FK → ADMIN_USERS)`, `title`, `description`, `start_time`, `end_time`, `on_chain_proposal_id`, `is_active`
- **CANDIDATES**: `candidate_id (PK)`, `election_id (FK → ELECTIONS)`, `candidate_name`, `party_or_affiliation`, `bio`, `option_index`, `profile_image_url`

**Relationship notes:**
- One `Admin_Users` record manages many `Elections` (1:N).
- One `Elections` record contains many `Candidates` (1:N).
- `on_chain_proposal_id` bridges the relational layer to the blockchain layer (links a DB election to its on-chain `proposalId`).
- `option_index` maps each candidate directly to the integer vote option enforced inside the Circom circuit, keeping the off-chain display layer and on-chain cryptographic layer consistent.

*(This diagram, and the on-chain "entities" below, together satisfy the BCSP-064 requirement for "E-R diagrams/Class diagrams/any related diagrams" — the MySQL ERD covers the relational side; Section 6.2/6.3 below document the smart-contract storage layout and circuit signal "schema" as the class/structure-equivalent for the on-chain and circuit layers, which are not naturally modeled as relational entities.)*

### 5.3 Data Dictionary

| Field / Variable | Type | Location | Description |
|---|---|---|---|
| `vote` | uint (0 to N−1) | Circuit (private) | Voter's actual choice; never leaves the browser |
| `secret` | bytes32 | Client-side only (private) | Random salt generated in-browser; used to compute commitment and nullifier |
| `commitment` | uint | Circuit (public) + Chain | `Poseidon(vote, secret)`; registered on-chain during registration |
| `nullifier` | uint | Circuit (public) + Chain | `Poseidon(secret, proposalId)`; stored on-chain post-vote to prevent double-voting |
| `proposalId` | uint | Circuit (public) + Chain | Unique identifier for the voting proposal/election |
| `proofA` | uint[2] | Chain (calldata) | Groth16 proof component (G1 point) |
| `proofB` | uint[2][2] | Chain (calldata) | Groth16 proof component (G2 point) |
| `proofC` | uint[2] | Chain (calldata) | Groth16 proof component (G1 point) |
| `voteOption` | uint | Chain (calldata) | Vote option index submitted on-chain; verified inside the circuit against `vote` |
| `commitments` | mapping(uint ⇒ bool) | Smart Contract storage | Registry of valid voter commitment hashes |
| `nullifierUsed` | mapping(uint ⇒ bool) | Smart Contract storage | Registry of spent nullifiers |
| `tally` | mapping(uint ⇒ mapping(uint ⇒ uint)) | Smart Contract storage | `proposalId ⇒ (optionIndex ⇒ voteCount)` |
| `votingDeadline` | uint | Smart Contract storage | Unix timestamp after which `castVote()` reverts |
| `admin_id`, `full_name`, `email`, `password_hash`, `created_at` | INT / VARCHAR / DATETIME | MySQL `Admin_Users` | Admin account fields |
| `election_id`, `title`, `description`, `start_time`, `end_time`, `on_chain_proposal_id`, `is_active` | mixed | MySQL `Elections` | Election metadata |
| `candidate_id`, `candidate_name`, `party_or_affiliation`, `bio`, `option_index`, `profile_image_url` | mixed | MySQL `Candidates` | Candidate metadata |

---

## 6. Data Design

### 6.1 Design Rationale — Web 2.5 Hybrid
State is partitioned by trust requirement, not convenience:
- **Trust-critical / privacy-critical state** (commitments, nullifiers, tallies, deadlines) → **on-chain**, verified purely by cryptography and consensus.
- **Read-only presentational metadata** (candidate bios, images, election titles/schedules, admin accounts) → **MySQL**, chosen for efficient querying, relational integrity, and ease of admin CRUD — explicitly *not* used for anything that affects vote validity.

### 6.2 Smart Contract Storage Layout (`ZKVoting.sol`)

```solidity
mapping(uint256 => bool) public commitments;
mapping(uint256 => bool) public nullifierUsed;
mapping(uint256 => mapping(uint256 => uint256)) public tally;

struct ProposalConfig {
    uint256 deadline;
    uint256 numOptions;
    bool active;
}
mapping(uint256 => ProposalConfig) public proposals;
```

### 6.3 Circuit Signal Schema (`vote.circom`)

```
signal private input vote;         // [0, numOptions-1]
signal private input secret;       // 253-bit random field element
signal input commitment;           // Poseidon(vote, secret)
signal input nullifier;            // Poseidon(secret, proposalId)
signal input proposalId;
signal input voteOption;           // must equal private `vote` (constraint: vote === voteOption)
```

### 6.4 Relational Schema (MySQL DDL)

```sql
CREATE TABLE Admin_Users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Elections (
    election_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    on_chain_proposal_id BIGINT UNSIGNED NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (admin_id) REFERENCES Admin_Users(admin_id)
);

CREATE TABLE Candidates (
    candidate_id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    candidate_name VARCHAR(150) NOT NULL,
    party_or_affiliation VARCHAR(150),
    bio TEXT,
    option_index TINYINT UNSIGNED NOT NULL,
    profile_image_url VARCHAR(255),
    FOREIGN KEY (election_id) REFERENCES Elections(election_id)
);
```

### 6.5 Data Integrity Constraints
- `option_index` must be unique per `election_id` and within `[0, numOptions-1]`, matching the circuit's `numOptions` for that proposal — enforced at the application layer (backend validation), since MySQL cannot itself enforce cross-system consistency with the on-chain `ProposalConfig.numOptions`.
- `on_chain_proposal_id` must be unique per active election to avoid tally collisions.
- `email` uniqueness enforced at the DB layer for `Admin_Users`.
- On-chain: `commitments`, `nullifierUsed` are append-only (never cleared), guaranteeing the double-vote and re-registration invariants hold for the lifetime of the contract.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | In-browser proof generation should complete within 2–5 seconds on a mid-range machine (Intel i5/Ryzen 5, 8–16 GB RAM). On-chain `verifyProof` gas cost should remain within typical Sepolia block gas limits for a single Groth16 verification (~250–300k gas, to be benchmarked in testing). |
| Reliability | Contract logic must be deterministic and idempotent for invalid inputs (always revert cleanly, never leave partial state). |
| Availability | On-chain voting functionality must remain available independent of MySQL backend uptime (no hard dependency). |
| Usability | Non-technical voters should be able to complete registration and voting using only wallet-connect and form interactions; no manual cryptography required. |
| Security | See Section 9 (dedicated section given the domain). |
| Scalability | Current design targets small-to-medium elections (per Future Scope: ZK-rollup integration is the identified path to large-scale, thousands-of-voters deployments). |
| Maintainability | Modular separation (circuit / contracts / frontend / backend) per Section 3 of the synopsis allows each layer to be modified independently, provided public interfaces (ABI, circuit public signals) remain stable. |
| Portability | Frontend runs in any modern Chromium/Firefox browser with MetaMask; backend runs on any Node.js 18+ environment. |
| Auditability | All vote-affecting state transitions are recorded immutably on Sepolia and are independently verifiable via Etherscan. |

---

## 8. Design and Implementation Constraints (Consolidated)

- **Language/Version locks:** Solidity 0.8.20, Circom 2.0+, snarkjs 0.7+, Node 18+, React 18+, ethers.js 6.x, MySQL 8.0+.
- **Trusted setup dependency:** Groth16 requires a per-circuit trusted setup; compromise of the toxic waste from this ceremony would theoretically allow forged proofs — mitigated by using a well-known, multi-party Powers of Tau ceremony output for Phase 1.
- **BCSP-064 compliance constraints:** No Visual Basic + MS-Access combination; no C/C++ for the database-facing module; project must be undertaken solo (per guideline: "Not more than one student is permitted to work on a project").
- **Browser-only proving:** All private-input cryptographic operations must run client-side (WASM) — no server ever sees `vote` or `secret`.

---

## 9. Security Requirements

| ID | Requirement |
|---|---|
| SEC-1 | The raw `vote` and `secret` values must never be transmitted to any server or logged anywhere outside the voter's local browser session. |
| SEC-2 | `castVote()` must verify, in order: deadline not passed → commitment registered → nullifier unused → proof valid, reverting on the first failed check to avoid unnecessary gas expenditure and to give precise error feedback. |
| SEC-3 | The nullifier scheme (`Poseidon(secret, proposalId)`) must ensure a given `secret` produces a distinct nullifier per proposal, preventing cross-proposal correlation while still preventing double-voting within a single proposal. |
| SEC-4 | `Verifier.sol` must be the unmodified, auto-generated output of the snarkjs Phase 2 setup for the exact deployed circuit — any mismatch invalidates all proof verification guarantees. |
| SEC-5 | Admin authentication (`password_hash`) must use a strong hashing algorithm (e.g., bcrypt/argon2) — plaintext passwords must never be stored. |
| SEC-6 | The backend REST API must only expose read access to election/candidate metadata for voters; write access (election/candidate creation) must be restricted to authenticated admin sessions. |
| SEC-7 | Smart contract functions must follow checks-effects-interactions ordering and use custom errors/require statements for all invariant checks (registration status, deadline, nullifier state). |
| SEC-8 | The system must be resistant to front-running of the vote-casting transaction — since the proof does not reveal `vote`, a miner/observer reordering `castVote` transactions learns nothing about vote content, only timing and voter address. |

---

## 10. Testing Requirements — Traceability to BCSP-064 Testing Levels

Separate Unit, Integration, and System testing reports:

| Requirement | Test Level | Sample Test Case |
|---|---|---|
| FR-3 (Registration) | Unit | Register valid commitment → stored + event emitted |
| FR-3 (Registration) | Unit | Reject duplicate commitment → revert `AlreadyRegistered` |
| FR-5 (Vote Casting) | Unit | Reject unregistered commitment in `castVote` → revert `NotRegistered` |
| FR-5 (Vote Casting) | Unit | Reject vote after deadline → revert `VotingEnded` |
| FR-5 (Vote Casting) | Unit | Accept valid proof → tally incremented, nullifier stored |
| FR-3 + FR-4 + FR-5 | Integration | Full registration → proof generation → vote → tally flow |
| FR-5 (double vote) | Integration | Same nullifier submitted twice → second tx reverts |
| FR-5 + FR-6 | Integration | Multiple voters, differing choices → tally reflects correct per-option counts |
| SEC-4 | System | Manipulated proof bytes → `verifyProof` returns false → revert |
| End-to-end | System | Full browser proof generation + MetaMask tx → vote recorded on Sepolia |
| FR-3/FR-5 (fuzz) | Fuzz (Foundry) | Random `uint256` commitment inputs → no unexpected reverts |
| FR-5 (fuzz) | Fuzz (Foundry) | Random nullifiers → no collision false positives |
| P2 (circuit) | Circuit test | Off-chain witness generation and proof verification against known-good/known-bad inputs |

---

## 11. Appendices

### 11.2 Tools, Platform, Hardware & Software Requirements
(Circom 2.0+, snarkjs 0.7+, circomlibjs, Solidity 0.8.20, Foundry, Node.js 18+/Express 4.x, React 18+, ethers.js 6.x, MetaMask, Sepolia testnet, MySQL 8.0+, mysql2, Postman, npm/yarn, Git/GitHub, VS Code, Windows 11/Ubuntu; minimum 8 GB RAM (16 GB recommended), 5 GB free storage, stable broadband.)

### 11.3 Open Items for Design Document
The following are flagged for elaboration in the subsequent Design Document: detailed procedural design (pseudocode per function), full user-interface wireframes/mockups, and finalized custom-error naming conventions for the Solidity contracts.

---

*End of Software Requirements Specification.*
