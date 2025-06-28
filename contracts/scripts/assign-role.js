const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x50e837c86c4e9C7Ad0dC23DcdCb45B0E9Ce500fE"; // Your deployed contract
  const userAddress = "0x636E93b33AC5bBb526B993c3dAF01194Cd4C0800"; // Your wallet address
  
  console.log("Assigning HARVESTER role...");
  
  const ShellfishTraceability = await ethers.getContractAt("ShellfishTraceability", contractAddress);
  
  // Get the HARVESTER_ROLE constant
  const HARVESTER_ROLE = await ShellfishTraceability.HARVESTER_ROLE();
  
  // Assign the role
  const tx = await ShellfishTraceability.registerUser(
    userAddress,
    HARVESTER_ROLE,
    "Test Harvester Profile"
  );
  
  await tx.wait();
  
  console.log("✅ HARVESTER role assigned to:", userAddress);
  console.log("Transaction hash:", tx.hash);
  
  // Verify the role
  const role = await ShellfishTraceability.getUserRole(userAddress);
  console.log("User role:", role);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });