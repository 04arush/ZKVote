# ZKVote: Privacy-Preserving Decentralized Voting System

A blockchain-based voting system using Zero-Knowledge Proofs (ZK-SNARKs) to ensure voter privacy while maintaining verifiability and transparency. Voters can prove their vote is valid without revealing their choice.

## Features

- **Privacy-Preserving**: Votes are cast using zero-knowledge proofs - no one can see how you voted
- **Verifiable**: All votes are verified on-chain using cryptographic proofs
- **Transparent**: Vote tallies are publicly visible on the blockchain
- **Double-Vote Prevention**: Nullifiers prevent the same voter from voting twice
- **Decentralized**: Runs on Ethereum blockchain with no central authority

## Tech Stack

### Zero-Knowledge Layer
- **ZK Circuit**: Circom 2.0+ for circuit definition
- **ZK Proving**: snarkjs 0.7+ for proof generation
- **ZK Hashing**: circomlibjs (Poseidon hash function)

### Blockchain Layer
- **Smart Contracts**: Solidity 0.8.20
- **Development Framework**: Foundry (forge/anvil/cast)
- **Blockchain**: Ethereum Sepolia Testnet
- **Wallet**: MetaMask

### Application Layer
- **Backend**: Node.js 18+ with Express.js 4.x
- **Frontend**: React.js 18+ with ethers.js 6.x
- **Database**: MySQL 8.0+ with mysql2 driver

## Architecture

### 1. Circuits (circuits/)
Circom circuits that prove:
- Voter knows the secret behind their registered commitment
- Vote is within valid range
- Nullifier is correctly computed to prevent double voting
- Vote choice matches what's recorded on-chain

### 2. Smart Contracts (contracts/)
- **Verifier.sol**: Auto-generated ZK proof verifier
- **ZKVoting.sol**: Main voting contract with commitment registration, proof verification, and vote tallying

### 3. Backend (backend/)
REST API serving election and candidate metadata from MySQL database

### 4. Frontend (frontend/)
React DApp for:
- MetaMask wallet connection
- Voter registration (commitment generation)
- Vote casting (ZK proof generation)
- Results viewing

## How It Works

### Registration Phase
1. Voter selects their choice and creates a secret passphrase
2. System computes: `commitment = Poseidon(vote, secret)`
3. Commitment is registered on-chain (vote remains hidden)

### Voting Phase
1. Voter re-enters their choice and secret
2. System generates a zero-knowledge proof that:
   - They know the secret behind a registered commitment
   - Their vote is valid (within range)
   - Their nullifier is unique (prevents double voting)
3. Proof is verified on-chain
4. Vote is tallied without revealing the voter's identity

### Results Phase
- Anyone can view the vote tallies on-chain
- Individual votes remain private
- System prevents double voting via nullifiers

## Quick Start

See [SETUP.md](SETUP.md) for detailed installation and deployment instructions.

```bash
# 1. Setup circuits
cd circuits
npm install
./setup.sh

# 2. Deploy contracts
cd ../contracts
forge test
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast

# 3. Setup database
mysql -u root -p < db/schema.sql
mysql -u root -p < db/seed.sql

# 4. Start backend
cd ../backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start

# 5. Start frontend
cd ../frontend
npm install
# Copy circuit artifacts to public/
# Update contract address in src/constants/addresses.js
npm start
```

## Project Structure

```
zkvote/
├── circuits/          # Circom ZK circuits
├── contracts/         # Solidity smart contracts
├── backend/           # Node.js REST API
├── frontend/          # React DApp
├── db/                # MySQL schema and seeds
└── SETUP.md          # Setup and deployment guide
```

## Security Considerations

- **Secret Passphrase**: Must be kept secure and cannot be recovered if lost
- **Trusted Setup**: Current setup is for testing; production requires multi-party ceremony
- **Smart Contract Audit**: Contracts should be audited before mainnet deployment
- **Private Keys**: Never commit private keys or .env files to version control

## Testing

```bash
# Test smart contracts
cd contracts
forge test -vvv

# Test backend (requires running MySQL)
cd backend
npm start
# Use Postman to test API endpoints

# Test frontend
cd frontend
npm start
# Manual testing with MetaMask on Sepolia
```

## Contributing

This is an educational project demonstrating ZK-SNARK voting systems. Contributions welcome!

## License

MIT

## Acknowledgments

- [Circom](https://github.com/iden3/circom) - Circuit compiler
- [snarkjs](https://github.com/iden3/snarkjs) - ZK proof generation
- [Foundry](https://github.com/foundry-rs/foundry) - Ethereum development framework
- [ethers.js](https://github.com/ethers-io/ethers.js/) - Ethereum library
