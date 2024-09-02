# Merkle-Airdrop


---



This repository contains a smart contract implementation of a Merkle Airdrop and the accompanying JavaScript scripts to generate and verify Merkle proofs. The airdrop allows users to claim tokens using Merkle proofs, which ensures that only eligible addresses can claim the tokens. 

>> Note : every address here is from the hardhat testsuite you can check script to create it in your hardhat enivornment .

## Table of Contents
- [Setup and Installation](#setup-and-installation)
- [Deploying the MerkleAirdrop Contract](#deploying-the-merkleairdrop-contract)
- [Generating Merkle Trees and Proofs](#generating-merkle-trees-and-proofs)
- [Claiming the Airdrop](#claiming-the-airdrop)
- [Assumptions and Limitations](#assumptions-and-limitations)

## Setup and Installation

### Prerequisites

Ensure you have the following installed:
- Node.js
- Hardhat

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Iam0TI/Merkle-Airdrop.git
    cd Merkle-Airdrop
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

## Deploying the MerkleAirdrop Contract

1. **Compile the contracts:**
    ```bash
    npx hardhat compile
    ```

2. **Deploy the contracts:**

    You can deploy the `MerkleDrop` contract by running the deployment script (make sure to set up your Hardhat network configuration):
    ```bash
    npx hardhat run scripts/deploy.js --network <network-name>
    ```

3. **Contract Details:**
    - **MerkleDrop Contract:** This contract handles the airdrop logic, including proof verification and token distribution.

## Generating Merkle Trees and Proofs

### Generating the Merkle Tree

1. **Create the Merkle Tree:**
    The `createmerkletrees.js` script generates a Merkle tree from a predefined list of addresses and token amounts.
    Do well to edit the file for your own use

    ```bash
    node createmerkletrees.js
    ```

    This will create a `tree.json` file in the root directory containing the Merkle tree data.

### Generating Merkle Proofs

1. **Create Merkle Proofs:**
    The `createmerkleproof.js` script is used to generate Merkle proofs for specific addresses in our case "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC". You can modify the script to generate proofs for other addresses.

    ```bash
    node createmerkleproof.js
    ```

    The proof for the specified address will be output to the console.

## Claiming the Airdrop

1. **Fund the Contract:**
   Before users can claim their airdrop, you need to transfer the tokens to the `MerkleDrop` contract.

2. **Claim Tokens:**
    Users can claim their tokens by calling the `claimAirDrop` function on the `MerkleDrop` contract with their Merkle proof, index, and amount. 

    Example of claiming tokens in your test file:
    ```js
    const proof = [
        "0x5d76a71bd6d384317c384db87cc35e7b1b49606ffaca4572af7f37d037120a72",
        "0x5f8f6140f4928eb94c6d333b9942fe8199178ea0f1337b43970a92677153a18b",
        "0xc4b85746a83f0dd6a03a4b18b22c8ecb5fc810be93e7123b2e11fdabc5de05fc",
    ];
    await merkleDrop.claimAirDrop(proof, 1, ethers.parseUnits("20", 18));
    ```

## Assumptions and Limitations

- **Decimal Handling:** The implementation assumes that the decimals for token amounts are handled externally and that the `amount` parameter passed to the `claimAirDrop` function is already formatted correctly.
  
- **Tree and Proof Generation:** The scripts provided (`createmerkletrees.js` and `createmerkleproof.js`) generate trees and proofs based on predefined values. You should modify the values to suit your airdrop requirements.

- **Preimage Attack Protection:** The `_verifyProof` function in the `MerkleDrop` contract double-hashes the data to prevent second preimage attacks.

- **Active Airdrop Toggle:** The contract includes a `toggleActive` function that allows the owner to enable or disable the airdrop claiming process.

## Running Tests

To run the tests, use:
```bash
npx hardhat test
```

The tests include scenarios for token minting, MerkleDrop contract deployment, and claiming the airdrop. Should add more test soon :) thank you for reading 

---

