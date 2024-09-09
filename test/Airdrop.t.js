const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { generateProof } = require("../script/createMerkleProof");

const ONE_WEEK = 7 * 24 * 3600;
// Define the expected total supply (1 million tokens with 18 decimals)
const tokenTotalSupply = ethers.parseUnits("1000000", 18);
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
    const merkleDropAddress = await merkleDrop.deploy(token, merkleRoot, 3);

    // Return the deployed contracts and other relevant data
    return { token, owner, other, merkleDropAddress, merkleRoot, acct1 };
  }

  // Tests for the ADT token deployment
  describe("ADT Deployment", function () {
    it("Should mint the right 1 Million tokens", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Assert that the total supply is correct
      await expect(await token.totalSupply()).to.equal(tokenTotalSupply);
    });
    it("Should have the right name", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Define the expected total supply (1 million tokens with 18 decimals)
      const tokenName = "Airdrop Token";

      // Assert that the total supply is correct
      await expect(await token.name()).to.equal(tokenName);
    });
    it("Should have the right symbol", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Define the expected total supply (1 million tokens with 18 decimals)
      const tokenSymbol = "ADT";

      // Assert that the total supply is correct
      await expect(await token.symbol()).to.equal(tokenSymbol);
    });
  });

  // Tests for the MerkleDrop contract deployment
  describe("MerkleDrop Deployment", function () {
    it("Should set the correct Merkle root", async function () {
      // Load the MerkleDrop fixture
      const { merkleDropAddress, merkleRoot } = await loadFixture(
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

    it("Should have the correct ending time", async function () {
      // Load the MerkleDrop fixture
      const { merkleDropAddress } = await loadFixture(delpoymerkleDropFixture);

      // Assert that the owner address is correctly set in the MerkleDrop contract
      const newBlock = await ethers.provider.getBlock("latest");
      await expect(newBlock.timestamp + 3 * ONE_WEEK).to.equal(
        await merkleDropAddress.endingTime()
      );
    });
  });

  // Tests for the airdrop function in the MerkleDrop contract
  describe(" Claim Airdrop ", function () {
    describe("Validation", function () {
      it("Should revert if claim is not active", async function () {
        const { token, owner, merkleDropAddress, merkleRoot, acct1 } =
          await loadFixture(delpoymerkleDropFixture);

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);

        // generating Merkle proof for  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
        const address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
        const { value, proof } = generateProof(address);
        const amount = ethers.parseUnits("20", 18);

        await time.increaseTo((await time.latest()) + 4 * ONE_WEEK);
        await expect(
          merkleDropAddress.connect(acct1).claimAirDrop(proof, 1n, amount)
        ).to.be.revertedWithCustomError(merkleDropAddress, "ClaimingEnded");
      });

      it("Should revert if user has claimed already", async function () {
        const { token, other, merkleDropAddress, merkleRoot } =
          await loadFixture(delpoymerkleDropFixture);

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);

        // generating Merkle proof for  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const { value, proof } = generateProof(address);
        const amount = ethers.parseUnits("10", 18);

        await merkleDropAddress.connect(other).claimAirDrop(proof, 0n, amount);
        await expect(
          merkleDropAddress.connect(other).claimAirDrop(proof, 0n, amount)
        ).to.be.revertedWithCustomError(merkleDropAddress, "AlreadyClaimed");
      });

      it("Should revert if caller is not in the claim list", async function () {
        const { token, other, merkleDropAddress, merkleRoot, owner } =
          await loadFixture(delpoymerkleDropFixture);

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);

        // generating Merkle proof for  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const { value, proof } = generateProof(address);
        const amount = ethers.parseUnits("10", 18);

        // we are using the owner to call the function since the  owner is not in the claim it should revert  hopefully
        await expect(
          merkleDropAddress.claimAirDrop(proof, 0n, amount)
        ).to.be.revertedWithCustomError(merkleDropAddress, "InvalidProof");
      });
    });
    describe("Transfer", function () {
      it("Should transfer token to user", async function () {
        const { token, merkleDropAddress, acct1 } = await loadFixture(
          delpoymerkleDropFixture
        );

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);

        // generating Merkle proof for  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
        const address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
        const { value, proof } = generateProof(address);
        const amount = ethers.parseUnits("20", 18);
        // Claim the airdrop using the proof and amount
        await merkleDropAddress.connect(acct1).claimAirDrop(proof, 1n, amount);

        // Assert that the account has received the correct amount of tokens
        await expect(await token.balanceOf(acct1.address)).to.equal(amount);
      });
    });
    describe("Events", function () {
      it("Should emit an event on claimed AirDrop", async function () {
        const { token, other, merkleDropAddress, merkleRoot, owner } =
          await loadFixture(delpoymerkleDropFixture);

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);

        // generating Merkle proof for  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const { value, proof } = generateProof(address);
        const amount = ethers.parseUnits("10", 18);

        await expect(
          await merkleDropAddress.connect(other).claimAirDrop(proof, 0n, amount)
        )
          .to.emit(merkleDropAddress, "claimedAirDrop")
          .withArgs(address, amount); // We accept any value as `when` arg
      });
    });
  });

  describe("Withdraw Token", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { token, merkleDropAddress } = await loadFixture(
          delpoymerkleDropFixture
        );

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);
        await expect(
          merkleDropAddress.withdrawToken()
        ).to.be.revertedWithCustomError(merkleDropAddress, "AirdropIsActive");
      });

      it("Should revert with the right error if called from another account", async function () {
        const { token, merkleDropAddress, other } = await loadFixture(
          delpoymerkleDropFixture
        );

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);
        // We can increase the time in Hardhat Network

        await time.increaseTo((await time.latest()) + 4 * ONE_WEEK);

        // We use lock.connect() to send a transaction from another account
        await expect(
          merkleDropAddress.connect(other).withdrawToken()
        ).to.be.revertedWithCustomError(merkleDropAddress, "NotOwner");
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { token, merkleDropAddress } = await loadFixture(
          delpoymerkleDropFixture
        );

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);
        // We can increase the time in Hardhat Network

        await time.increaseTo((await time.latest()) + 4 * ONE_WEEK);
        await expect(merkleDropAddress.withdrawToken()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { token, merkleDropAddress } = await loadFixture(
          delpoymerkleDropFixture
        );

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);
        // We can increase the time in Hardhat Network

        await time.increaseTo((await time.latest()) + 4 * ONE_WEEK);
        await expect(merkleDropAddress.withdrawToken()).to.emit(
          merkleDropAddress,
          "OwnerWithdraw"
        ); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { token, merkleDropAddress, owner } = await loadFixture(
          delpoymerkleDropFixture
        );

        // Transfer the tokens to the MerkleDrop contract to fund the airdrop
        await token.transfer(merkleDropAddress, tokenTotalSupply);
        // We can increase the time in Hardhat Network

        // We can increase the time in Hardhat Network

        await time.increaseTo((await time.latest()) + 4 * ONE_WEEK);
        await merkleDropAddress.withdrawToken();
        await expect(await token.balanceOf(owner.address)).to.equal(
          tokenTotalSupply
        );
      });
    });
  });
});
