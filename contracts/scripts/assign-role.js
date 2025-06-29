const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xF284bAC77f1f13ea8109734C42e9eC5B32100958"; // Your deployed contract
  const userAddress = "0x35565c1e702D54318Fe701F98E07C4dbe4311451"; // Your wallet address
  
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