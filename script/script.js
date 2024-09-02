const { ethers } = require("hardhat");
async function main() {
  const accounts = await hre.ethers.getSigners();
  let count = 0;
  for (const account of accounts) {
    count = count + 1;
    console.log(`${count}. ${account.address}`);
  }
}

main();
