// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {AirdropError} from "./Error.sol";

contract MerkleDrop is AirdropError {
    event claimedAirDrop(address indexed, uint256);
    event OwnerWithdraw();
    address public immutable owner;
    IERC20 public immutable tokenAddress;

    // the merkle tree root
    bytes32 public merkleRoot;

    // a bitmap to keep track of the claim state of a particular address
    BitMaps.BitMap internal airdropCheckList;
    bool public isActive = true;

    uint256 public endingTime;

    constructor(
        address _tokenAddress,
        bytes32 _merkleRoot,
        uint256 _numberofWeeks
    ) {
        require(_numberofWeeks > 0);
        tokenAddress = IERC20(_tokenAddress);

        owner = msg.sender;

        merkleRoot = _merkleRoot;

        endingTime = block.timestamp + _numberofWeeks * 1 weeks;
    }

    // function to claimed airdrop we don't consider  the amount decimal here we are assuming it been handle
    function claimAirDrop(
        bytes32[] calldata proof,
        uint256 index,
        uint256 amount
    ) external {
        //checks if claiming is active
        if (!_checkIfClaimingIsActive()) {
            revert ClaimingEnded();
        }
        // check if already claimed
        if (BitMaps.get(airdropCheckList, index)) {
            revert AlreadyClaimed();
        }

        // verifing   the proof
        _verifyProof(proof, index, amount, msg.sender);

        // set airdrop to  claimed
        BitMaps.setTo(airdropCheckList, index, true);

        // sending token to user
        tokenAddress.transfer(msg.sender, amount);

        emit claimedAirDrop(msg.sender, amount);
    }

    function updateMerkleRppt(bytes32 _newMerkleroot) external {
        _onlyOwner();
        merkleRoot = _newMerkleroot;
    }

    function withdrawToken() external {
        _onlyOwner();

        if (_checkIfClaimingIsActive()) {
            revert AirdropIsActive();
        }

        uint256 balance = tokenAddress.balanceOf(address(this));

        tokenAddress.transfer(msg.sender, balance);

        emit OwnerWithdraw();
    }

    function _checkIfClaimingIsActive() private view returns (bool) {
        if (block.timestamp < endingTime) {
            return true;
        }
        return false;
    }
    function _verifyProof(
        bytes32[] memory proof,
        uint256 index,
        uint256 amount,
        address addr
    ) private view {
        // the whole reason for double hashing to prevent something called preimage attack read more  here (https:/medium.com/rareskills/the-second-preimage-attack-for-merkle-trees-in-solidity-e9d74fe7fdcd)
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(addr, index, amount)))
        );

        // checks if the proof is valid
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) {
            revert InvalidProof();
        }
    }

    function _onlyOwner() private view {
        if (msg.sender != owner) {
            revert NotOwner();
        }
    }
}
