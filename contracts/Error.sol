// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract AirdropError {
    error NotOwner();
    error AlreadyClaimed();
    error ClaimingEnded();
    error InvalidProof();
    error AirdropIsActive();
}