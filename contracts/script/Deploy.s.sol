// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Script, console } from "forge-std/Script.sol";
import { ZKVoting } from "../src/ZKVoting.sol";
import { Groth16Verifier } from "../src/Verifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        Groth16Verifier verifier = new Groth16Verifier();
        ZKVoting zkVoting = new ZKVoting(address(verifier));

        console.log("Verifier deployed at: ", address(verifier));
        console.log("ZKVoting deployed at: ", address(zkVoting));

        vm.stopBroadcast();
    }
}
