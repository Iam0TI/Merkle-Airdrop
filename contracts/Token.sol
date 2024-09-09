// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract Web3CXI is ERC20("Airdrop Token", "ADT") {
    // address public owner;

    constructor() {
        // owner = msg.sender;
        // minting a total supply of one million token
        _mint(msg.sender, 1000000e18);
    }
}
