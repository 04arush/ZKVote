// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/ZKVoting.sol";
import "../src/IVerifier.sol";

contract MockVerifier is IVerifier {
    function verifyProof(uint[2] calldata, uint[2][2] calldata, uint[2] calldata, uint[5] calldata) 
        external pure returns (bool) {
        return true;
    }
}

contract ZKVotingFuzzTest is Test {
    ZKVoting public zkVoting;
    MockVerifier public mockVerifier;
    address public owner = address(1);
    
    function setUp() public {
        vm.startPrank(owner);
        mockVerifier = new MockVerifier();
        zkVoting = new ZKVoting(address(mockVerifier));
        vm.stopPrank();
    }
    
    function testFuzz_RegisterRandomCommitments(uint256 commitment) public {
        vm.assume(commitment > 0);
        
        vm.prank(owner);
        zkVoting.registerCommitment(commitment);
        
        assertTrue(zkVoting.commitments(commitment));
    }
    
    function testFuzz_NullifierUniqueness(uint256 nullifier1, uint256 nullifier2) public {
        vm.assume(nullifier1 != nullifier2);
        vm.assume(nullifier1 > 0 && nullifier2 > 0);
        
        uint256 proposalId = 1;
        uint256 commitment1 = 100;
        uint256 commitment2 = 200;
        
        vm.prank(owner);
        zkVoting.createProposal(proposalId, block.timestamp + 1 days, 3);
        
        vm.startPrank(owner);
        zkVoting.registerCommitment(commitment1);
        zkVoting.registerCommitment(commitment2);
        vm.stopPrank();
        
        uint[2] memory proofA;
        uint[2][2] memory proofB;
        uint[2] memory proofC;
        
        vm.prank(owner);
        zkVoting.castVote(proofA, proofB, proofC, nullifier1, commitment1, 0, proposalId);
        
        vm.prank(owner);
        zkVoting.castVote(proofA, proofB, proofC, nullifier2, commitment2, 1, proposalId);
        
        assertTrue(zkVoting.nullifierUsed(nullifier1));
        assertTrue(zkVoting.nullifierUsed(nullifier2));
    }
}
