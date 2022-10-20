import { deployments, ethers, network, upgrades } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { ChainedIn } from "../../typechain";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ChainedIn Unit Tests", () => {
          let chainedIn: ChainedIn;

          beforeEach(async () => {
              const factory = await ethers.getContractFactory("ChainedIn");
              chainedIn = (await upgrades.deployProxy(factory, [], {
                  initializer: "initialize",
              })) as ChainedIn;
          });
      });
