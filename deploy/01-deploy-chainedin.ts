import { DeployFunction } from "hardhat-deploy/dist/types";
import { network } from "hardhat";

const deployFunc: DeployFunction = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId: number | undefined = network.config.chainId;
    if (!chainId) return;

    log("-------------------------------------");
    await deploy("ChainedIn", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });
    log("-------------------------------------");
};

deployFunc.tags = ["all", "chainedin"];
export default deployFunc;
