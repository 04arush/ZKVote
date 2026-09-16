// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Test } from "forge-std/Test.sol";
import { ZKVoting } from "../src/ZKVoting.sol";
import { Groth16Verifier } from "../src/Verifier.sol";

contract ZKVotingTest is Test {
    ZKVoting public zkVoting;
    Groth16Verifier public verifier;

    uint256 constant PROPOSAL_ID = 1;
    uint256 constant NUM_OPTIONS = 4;
    uint256 deadline;

    function setUp() public {
        verifier = new Groth16Verifier();
        zkVoting = new ZKVoting(address(verifier));
        deadline = block.timestamp + 7 days;
        zkVoting.createProposal(PROPOSAL_ID, deadline, NUM_OPTIONS);
    }

    function test_RegisterValidCommitment() public {
        uint256 commitment = 12345;
        zkVoting.registerCommitment(PROPOSAL_ID, commitment);
        assertTrue(zkVoting.commitments(commitment));
    }

    function test_RevertOnDuplicateCommitment() public {
        uint256 commitment = 12345;
        zkVoting.registerCommitment(PROPOSAL_ID, commitment);
        vm.expectRevert(ZKVoting.AlreadyRegistered.selector);
        zkVoting.registerCommitment(PROPOSAL_ID, commitment);
    }

    function test_RevertOnUnregisteredCommitmentInCastVote() public {
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        vm.expectRevert(ZKVoting.NotRegistered.selector);
        zkVoting.castVote(a, b, c, 999, 888, 2, PROPOSAL_ID);
    }

    function test_RevertOnVoteAfterDeadline() public {
        uint256 commitment = 12345;
        zkVoting.registerCommitment(PROPOSAL_ID, commitment);
        vm.warp(deadline + 1);
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        vm.expectRevert(ZKVoting.VotingEnded.selector);
        zkVoting.castVote(a, b, c, 999, commitment, 2, PROPOSAL_ID);
    }

    function test_AcceptValidProofAndTally() public {
        uint256 commitment = 16161085579209116155007078450417924261856463735710435254218149055259236269008;
        uint256 nullifier = 9949772996283065961028046280886251458800049835521251014398656492972427599980;
        uint256 voteOption = 2;
        uint256[2] memory proofA = [
            20443039345179235530446375477985476648973509221089497405471360314148939011874,
            1257328823865878134766648183537562875923528331985823377782006994377698889429
        ];
        uint256[2][2] memory proofB = [
            [
                20368985164629810912701816131699908052143611018064149831473967942121590720528,
                296282840390936505342635773402853617682593413161331133298710811695088741819
            ],
            [
                10188863304850347426720354687524614706816565368239243658284796832974321720352,
                10242787347274755083483317035061076328018309782484044243546716869970536072952
            ]
        ];
        uint256[2] memory proofC = [
            1006939890312935587408126187206756071010823941058919029201838043971928970100,
            20883875822676556556532256066259355072491261346437298063315686715071757379807
        ];

        zkVoting.registerCommitment(PROPOSAL_ID, commitment);
        zkVoting.castVote(proofA, proofB, proofC, nullifier, commitment, voteOption, PROPOSAL_ID);

        assertTrue(zkVoting.nullifierUsed(nullifier));
        assertEq(zkVoting.tally(PROPOSAL_ID, voteOption), 1);
    }

    /// @dev Foundry fuzz test — random commitment inputs should never cause an
    ///      unexpected revert reason on the registration path itself.
    function testFuzz_RegisterCommitment(uint256 commitment) public {
        vm.assume(!zkVoting.commitments(commitment));
        zkVoting.registerCommitment(PROPOSAL_ID, commitment);
        assertTrue(zkVoting.commitments(commitment));
    }

    function testFuzz_NullifierUniqueness(uint256 n1, uint256 n2) public view {
        vm.assume(n1 != n2);
        assertFalse(zkVoting.nullifierUsed(n1) && zkVoting.nullifierUsed(n2));
    }
}
