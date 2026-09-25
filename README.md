# ZKVote

**A privacy-preserving decentralized voting system built with Zero-Knowledge Proofs and Ethereum smart contracts.**

ZKVote lets a voter prove they're eligible, that their vote is for a valid option, and that they haven't voted before — all without revealing *who* they voted for. No one, not even the contract itself, can link a vote to a voter.

🔗 **Live app:** https://04arush.github.io/ZKVote
📜 **Contracts (Sepolia):** [ZKVoting](https://sepolia.etherscan.io/address/0x42F9091025fd63d3a37e7df4e13b297589D1A885#code) · [Verifier](https://sepolia.etherscan.io/address/0x9bA41ff29C52471a79DEF89dfBD189498a2227f2#code)

---

## How it works

1. **Register** — pick your vote, and your browser locally computes a cryptographic *commitment* that seals your choice without revealing it. Only the commitment gets sent on-chain.
2. **Vote** — your browser generates a zero-knowledge proof (Groth16, via a Circom circuit) proving your vote is valid, and derives a *nullifier* that lets the contract detect a double-vote without ever learning your identity.
3. **Verify** — the smart contract checks the proof on-chain. If it's valid, your vote is tallied. Your raw vote and secret never leave your browser.
4. **Results** — anyone can read the live, on-chain tally at any time. Individual votes stay private forever.

## Tech stack

| Layer | Tools |
|---|---|
| ZK Circuit | Circom, snarkjs, Poseidon hash |
| Smart Contracts | Solidity, Foundry |
| Frontend | React (Vite), ethers.js, snarkjs (in-browser proving) |
| Backend | Node.js, Express |
| Database | MySQL |
| Chain | Ethereum (Sepolia testnet) |

## Project structure

```
zkvote/
├── circuits/     # Circom circuit, trusted setup, proving/verification keys
├── contracts/    # Solidity contracts + Foundry tests
├── backend/      # REST API serving election/candidate metadata
└── frontend/     # React DApp
```

## Running locally

Each module has its own setup — circuit compilation and trusted setup, contract deployment via Foundry, a MySQL-backed API, and a Vite/React frontend. Environment variable templates (`.env.example`) are included in each module; copy them to `.env` and fill in your own values (RPC URL, DB credentials, deployed contract address, etc.) before running.

```bash
# circuits
cd circuits && npm install

# contracts
cd contracts && forge install && forge test

# backend
cd backend && npm install && node src/index.js

# frontend
cd frontend && npm install && npm run dev
```

## Security properties

- **Vote privacy** — enforced cryptographically, not by trust in any party.
- **Double-vote prevention** — an on-chain nullifier registry rejects any repeat attempt.
- **Public verifiability** — anyone can audit the contract and its tallies independently on Etherscan.

## License

MIT

---

*Built as a final-year college project.*
