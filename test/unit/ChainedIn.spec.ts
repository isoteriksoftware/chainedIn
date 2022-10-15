import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { ChainedIn } from "../../typechain";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ChainedIn Unit Tests", () => {
          let chainedIn: ChainedIn;

          beforeEach(async () => {
              await deployments.fixture(["chainedin"]);
              chainedIn = await ethers.getContract("ChainedIn");
          });
      });
