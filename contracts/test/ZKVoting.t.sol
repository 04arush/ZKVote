// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/ZKVoting.sol";
import "../src/IVerifier.sol";

contract MockVerifier is IVerifier {
    bool public shouldReturnTrue = true;
    
    function verifyProof(uint[2] calldata, uint[2][2] calldata, uint[2] calldata, uint[5] calldata) 
        external view returns (bool) {
        return shouldReturnTrue;
    }
    
    function setShouldReturnTrue(bool _value) external {
        shouldReturnTrue = _value;
    }
}

contract ZKVotingTest is Test {
    ZKVoting public zkVoting;
    MockVerifier public mockVerifier;
    address public owner = address(1);
    address public voter = address(2);
    
    uint256 constant PROPOSAL_ID = 1;
    uint256 constant NUM_OPTIONS = 3;
    uint256 constant COMMITMENT = 12345;
    uint256 constant NULLIFIER = 67890;
    
    function setUp() public {
        vm.startPrank(owner);
        mockVerifier = new MockVerifier();
        zkVoting = new ZKVoting(address(mockVerifier));
        
        zkVoting.createProposal(PROPOSAL_ID, block.timestamp + 1 days, NUM_OPTIONS);
        vm.stopPrank();
    }
    
    function test_RegisterValidCommitment() public {
        vm.prank(voter);
        zkVoting.registerCommitment(COMMITMENT);
        assertTrue(zkVoting.commitments(COMMITMENT));
    }
    
    function test_RevertOnDuplicateCommitment() public {
        vm.startPrank(voter);
        zkVoting.registerCommitment(COMMITMENT);
        
        vm.expectRevert(ZKVoting.AlreadyRegistered.selector);
        zkVoting.registerCommitment(COMMITMENT);
        vm.stopPrank();
    }
    
    function test_RevertOnUnregisteredCommitmentInCastVote() public {
        uint[2] memory proofA;
        uint[2][2] memory proofB;
        uint[2] memory proofC;
        
        vm.prank(voter);
        vm.expectRevert(ZKVoting.NotRegistered.selector);
        zkVoting.castVote(proofA, proofB, proofC, NULLIFIER, COMMITMENT, 0, PROPOSAL_ID);
    }
    
    function test_RevertOnVoteAfterDeadline() public {
        vm.prank(voter);
        zkVoting.registerCommitment(COMMITMENT);
        
        vm.warp(block.timestamp + 2 days);
        
        uint[2] memory proofA;
        uint[2][2] memory proofB;
        uint[2] memory proofC;
        
        vm.prank(voter);
        vm.expectRevert(ZKVoting.VotingEnded.selector);
        zkVoting.castVote(proofA, proofB, proofC, NULLIFIER, COMMITMENT, 0, PROPOSAL_ID);
    }
    
    function test_AcceptValidProofAndTally() public {
        vm.prank(voter);
        zkVoting.registerCommitment(COMMITMENT);
        
        uint[2] memory proofA;
        uint[2][2] memory proofB;
        uint[2] memory proofC;
        
        vm.prank(voter);
        zkVoting.castVote(proofA, proofB, proofC, NULLIFIER, COMMITMENT, 1, PROPOSAL_ID);
        
        assertEq(zkVoting.tally(PROPOSAL_ID, 1), 1);
        assertTrue(zkVoting.nullifierUsed(NULLIFIER));
    }
    
    function test_DoubleVoteRejection() public {
        vm.prank(voter);
        zkVoting.registerCommitment(COMMITMENT);
        
        uint[2] memory proofA;
        uint[2][2] memory proofB;
        uint[2] memory proofC;
        
        vm.prank(voter);
        zkVoting.castVote(proofA, proofB, proofC, NULLIFIER, COMMITMENT, 0, PROPOSAL_ID);
        
        vm.prank(voter);
        vm.expectRevert(ZKVoting.NullifierAlreadyUsed.selector);
        zkVoting.castVote(proofA, proofB, proofC, NULLIFIER, COMMITMENT, 0, PROPOSAL_ID);
    }
    
    function test_GetResultsReturnsCorrectArray() public {
        uint256 commitment1 = 111;
        uint256 commitment2 = 222;
        uint256 commitment3 = 333;
        uint256 nullifier1 = 444;
        uint256 nullifier2 = 555;
        uint256 nullifier3 = 666;
        
        vm.startPrank(voter);
        zkVoting.registerCommitment(commitment1);
        zkVoting.registerCommitment(commitment2);
        zkVoting.registerCommitment(commitment3);
        vm.stopPrank();
        
        uint[2] memory proofA;
        uint[2][2] memory proofB;
        uint[2] memory proofC;
        
        vm.prank(voter);
        zkVoting.castVote(proofA, proofB, proofC, nullifier1, commitment1, 0, PROPOSAL_ID);
        
        vm.prank(voter);
        zkVoting.castVote(proofA, proofB, proofC, nullifier2, commitment2, 1, PROPOSAL_ID);
        
        vm.prank(voter);
        zkVoting.castVote(proofA, proofB, proofC, nullifier3, commitment3, 1, PROPOSAL_ID);
        
        uint256[] memory results = zkVoting.getResults(PROPOSAL_ID);
        
        assertEq(results.length, NUM_OPTIONS);
        assertEq(results[0], 1);
        assertEq(results[1], 2);
        assertEq(results[2], 0);
    }
}
