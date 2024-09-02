// SPDX-License-Identifier: MIT
pragma solidity  0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {AirdropError} from "./Error.sol";



contract MerkleDrop  is AirdropError {

    
    address immutable owner;
    IERC20 public immutable tokenAddress;

    // the merkle tree root 
    bytes32 public immutable merkleRoot;

    // a bitmap to keep track of the claim state of a particular address 
    BitMaps.BitMap  internal airdropCheckList;
    bool public isActive = true;

    constructor (address _tokenAddress, bytes32 _merkleRoot){
        tokenAddress = IERC20(_tokenAddress);
        owner = msg.sender;
        merkleRoot = _merkleRoot;

    }

    function toggleActive () external {
        _onlyOwner();
        isActive = !isActive;
    }
   function claimAirDrop(bytes32[] calldata proof, uint256 index, uint256 amount) external {
        //checks if claiming is active 
        if (!isActive){
            revert ClaimingEnded();
        }
        // check if already claimed
        if (BitMaps.get(airdropCheckList, index)){
            revert AlreadyClaimed(); 
        }
        

        // verifing   the proof
        _verifyProof(proof, index, amount, msg.sender);

        // set airdrop to  claimed
        BitMaps.setTo(airdropCheckList, index, true);

        // sending token to user
        tokenAddress.transfer(msg.sender, amount);
    }

    function _verifyProof(bytes32[] memory proof, uint256 index, uint256 amount, address addr) private view {

        // the whole reason for double hashing to prevent something called preimage attack read more  here (https:/medium.com/rareskills/the-second-preimage-attack-for-merkle-trees-in-solidity-e9d74fe7fdcd)
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(addr, index, amount))));

        if (!MerkleProof.verify(proof, merkleRoot, leaf)){
            revert InvalidProof();
        }
    }

    

    function _onlyOwner() private view{
        if (msg.sender != owner){
            revert NotOwner();
        }
    }


}