import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment to Ethereum Sepolia...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy ShellfishTraceability contract
  console.log("\n1. Deploying ShellfishTraceability contract...");
  const ShellfishTraceability = await ethers.getContractFactory("ShellfishTraceability");
  const traceability = await ShellfishTraceability.deploy();
  await traceability.waitForDeployment();
  
  const traceabilityAddress = await traceability.getAddress();
  console.log("✅ ShellfishTraceability deployed to:", traceabilityAddress);

  // Deploy BatchNFT contract
  console.log("\n2. Deploying BatchNFT contract...");
  const BatchNFT = await ethers.getContractFactory("BatchNFT");
  const batchNFT = await BatchNFT.deploy(
    traceabilityAddress,
    "TraceHarvest Batch",
    "THB",
    "https://traceharvest.vercel.app/metadata/"
  );
  await batchNFT.waitForDeployment();
  
  const batchNFTAddress = await batchNFT.getAddress();
  console.log("✅ BatchNFT deployed to:", batchNFTAddress);

  // Grant MINTER_ROLE to traceability contract
  console.log("\n3. Setting up permissions...");
  const MINTER_ROLE = await batchNFT.MINTER_ROLE();
  await batchNFT.grantRole(MINTER_ROLE, traceabilityAddress);
  console.log("✅ Granted MINTER_ROLE to ShellfishTraceability contract");

  // Summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("=====================================");
  console.log("ShellfishTraceability:", traceabilityAddress);
  console.log("BatchNFT:", batchNFTAddress);
  console.log("Network: Ethereum Sepolia");
  console.log("Etherscan URLs:");
  console.log("- Traceability:", `https://sepolia.etherscan.io/address/${traceabilityAddress}`);
  console.log("- BatchNFT:", `https://sepolia.etherscan.io/address/${batchNFTAddress}`);
  console.log("=====================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });