import { ethers, upgrades } from "hardhat";
import { ChainedIn } from "../typechain";
import { ChainedIn__factory } from "../typechain/factories/contracts";

const main = async () => {
    console.log("Deploying ChainedIn Proxy...........");
    const factory: ChainedIn__factory = await ethers.getContractFactory("ChainedIn");
    const chainedIn = (await upgrades.deployProxy(factory, [], {
        initializer: "initialize",
    })) as ChainedIn;
    console.log(`ChainedIn Proxy deployed at: ${chainedIn.address}`);
};

main().catch((error) => {
    console.log(error);
    process.exit(1);
});
