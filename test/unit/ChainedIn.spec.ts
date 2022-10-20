import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network, upgrades } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { ChainedIn } from "../../typechain";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ChainedIn Unit Tests", () => {
          let chainedIn: ChainedIn;
          const userAccountType = 0;
          const companyAccountType = 1;

          beforeEach(async () => {
              const factory = await ethers.getContractFactory("ChainedIn");
              chainedIn = (await upgrades.deployProxy(factory, [], {
                  initializer: "initialize",
              })) as ChainedIn;
          });

          describe("Initialization", () => {
              it("initializes employees", async () => {
                  await expect(chainedIn.employees(0)).not.to.be.reverted;
              });
              it("initializes companies", async () => {
                  await expect(chainedIn.companies(0)).not.to.be.reverted;
              });
              it("initializes experiences", async () => {
                  await expect(chainedIn.experiences(0)).not.to.be.reverted;
              });
              it("initializes certifications", async () => {
                  await expect(chainedIn.certifications(0)).not.to.be.reverted;
              });
              it("initializes endorsements", async () => {
                  await expect(chainedIn.endorsements(0)).not.to.be.reverted;
              });
              it("initializes skills", async () => {
                  await expect(chainedIn.skills(0)).not.to.be.reverted;
              });
          });

          describe("Account creation and authentications", () => {
              it("creates employee account", async () => {
                  await expect(
                      chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                  ).not.to.be.reverted;

                  const employee = await chainedIn.employees(1);
                  assert.equal(employee.id.toString(), "1");
                  assert.equal(employee.name, "Employee");
              });
          });
      });
