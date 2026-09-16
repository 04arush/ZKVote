// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IVerifier
/// @notice Describes the one function that ZKVoting needs from its companion "verifier"
///         contract: a way to check whether a submitted zero-knowledge proof is genuine.
/// @dev This is an "interface" — it declares the shape of a function without providing
///      its implementation. The actual implementation lives in a separate, auto-generated
///      contract that performs the real cryptographic verification math.
interface IVerifier {

    /// @notice Checks whether a zero-knowledge proof is valid for a given set of public
    ///         values, without needing to know anything private the proof was built from.
    /// @param _pA The first component of the Groth16 proof.
    /// @param _pB The second component of the Groth16 proof.
    /// @param _pC The third component of the Groth16 proof.
    /// @param _pubSignals The five public values the proof is being checked against, in
    ///        this fixed order: [commitment, nullifier, proposalId, voteOption, numOptions].
    /// @return True if the proof is valid for the given public values, false otherwise.
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[5] calldata _pubSignals
    ) external view returns (bool);
}
