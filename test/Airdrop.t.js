const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Airdrop", function () {
  // Fixture for deploying the Web3CXI token contract
  async function deployTokenFixture() {
    // Get the first signer (account) as the owner
    const [owner] = await hre.ethers.getSigners();

    // Deploy the ERC20 token contract (Web3CXI)
    const erc20Token = await hre.ethers.getContractFactory("Web3CXI");
    const token = await erc20Token.deploy();

    // Return the deployed token contract and owner
    return { token, owner };
  }

  // Fixture for deploying the MerkleDrop contract
  async function delpoymerkleDropFixture() {
    // Load the token fixture to get the deployed token contract
    const { token } = await loadFixture(deployTokenFixture);

    // Get three signers: owner, other, and acct1
    const [owner, other, acct1] = await hre.ethers.getSigners();

    // Predefined Merkle root to use in the MerkleDrop contract generated using the createMerkleproof.js
    const merkleRoot =
      "0xdad72816f97715084a191a6a826bd9f1fad5ea7bf96dc7a9111319c6302a635b";

    // Deploy the MerkleDrop contract with the token address and Merkle root
    const merkleDrop = await hre.ethers.getContractFactory("MerkleDrop");
    const merkleDropAddress = await merkleDrop.deploy(token, merkleRoot);

    // Return the deployed contracts and other relevant data
    return { token, owner, other, merkleDropAddress, merkleRoot, acct1 };
  }

  // Tests for the Web3CXI token deployment
  describe("Web3CXI Deployment", function () {
    it("Should mint the right 1 Million tokens", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Define the expected total supply (1 million tokens with 18 decimals)
      const tokents = ethers.parseUnits("1000000", 18);

      // Assert that the total supply is correct
      await expect(await token.totalSupply()).to.equal(tokents);
    });
  });

  // Tests for the MerkleDrop contract deployment
  describe("MerkleDrop Deployment", function () {
    it("Should set the correct Merkle root", async function () {
      // Load the MerkleDrop fixture
      const { token, owner, merkleDropAddress, merkleRoot } = await loadFixture(
        delpoymerkleDropFixture
      );

      // Assert that the Merkle root is set correctly in the contract
      await expect(await merkleDropAddress.merkleRoot()).to.equal(merkleRoot);
    });

    it("Should set the correct token address", async function () {
      // Load the MerkleDrop fixture
      const { token, merkleDropAddress } = await loadFixture(
        delpoymerkleDropFixture
      );

      // Assert that the token address is correctly set in the MerkleDrop contract
      await expect(token).to.equal(await merkleDropAddress.tokenAddress());
    });

    it("Should have the correct owner", async function () {
      // Load the MerkleDrop fixture
      const { owner, merkleDropAddress } = await loadFixture(
        delpoymerkleDropFixture
      );

      // Assert that the owner address is correctly set in the MerkleDrop contract
      await expect(owner.address).to.equal(await merkleDropAddress.owner());
    });
  });

  // Tests for the airdrop function in the MerkleDrop contract
  describe("Airdrop function", function () {
    it("Should claim airdrop", async function () {
      // Load the MerkleDrop fixture
      const { token, owner, merkleDropAddress, merkleRoot, acct1 } =
        await loadFixture(delpoymerkleDropFixture);

      // Define the total amount of tokens (1 million tokens with 18 decimals)
      const tokents = ethers.parseUnits("1000000", 18);

      // Transfer the tokens to the MerkleDrop contract to fund the airdrop
      await token.transfer(merkleDropAddress, tokents);

      // Define the proof and the amount to claim (20 tokens) generated using the createMerkleproof.js
      const proof = [
        "0x5d76a71bd6d384317c384db87cc35e7b1b49606ffaca4572af7f37d037120a72",
        "0x5f8f6140f4928eb94c6d333b9942fe8199178ea0f1337b43970a92677153a18b",
        "0xc4b85746a83f0dd6a03a4b18b22c8ecb5fc810be93e7123b2e11fdabc5de05fc",
      ];
      const amount = ethers.parseUnits("20", 18);

      // Claim the airdrop using the proof and amount
      await merkleDropAddress.connect(acct1).claimAirDrop(proof, 1n, amount);

      // Assert that the account has received the correct amount of tokens
      await expect(await token.balanceOf(acct1.address)).to.equal(amount);
    });
  });
});
