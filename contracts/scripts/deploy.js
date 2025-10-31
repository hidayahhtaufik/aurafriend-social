const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  const balance = await deployer.provider.getBalance(deployer.address);

  const AuraSocialMedia = await hre.ethers.getContractFactory("AuraSocialMedia");
  const contract = await AuraSocialMedia.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
