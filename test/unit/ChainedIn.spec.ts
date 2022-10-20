import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network, upgrades } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { ChainedIn } from "../../typechain";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ChainedIn Unit Tests", () => {
          let chainedIn: ChainedIn;
          let accounts: SignerWithAddress[];
          const userAccountType = "0";
          const companyAccountType = "1";

          beforeEach(async () => {
              const factory = await ethers.getContractFactory("ChainedIn");
              chainedIn = (await upgrades.deployProxy(factory, [], {
                  initializer: "initialize",
              })) as ChainedIn;

              accounts = await ethers.getSigners();
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
              describe("Account creation", () => {
                  it("creates employee account", async () => {
                      await expect(
                          chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                      ).not.to.be.reverted;

                      const employee = await chainedIn.employees(1);
                      assert.equal(employee.id.toString(), "1");
                      assert.equal(employee.name, "Employee");
                      assert.equal(employee.walletAddress, accounts[0].address);
                  });

                  it("creates company account", async () => {
                      await expect(
                          chainedIn.signUp("admin@company.com", "Company", companyAccountType)
                      ).not.to.be.reverted;

                      const company = await chainedIn.companies(1);
                      assert.equal(company.id.toString(), "1");
                      assert.equal(company.name, "Company");
                      assert.equal(company.walletAddress, accounts[0].address);
                  });

                  it("rejects duplicate emails", async () => {
                      await expect(
                          chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                      ).not.to.be.reverted;
                      await expect(
                          chainedIn.signUp("employee@company.com", "Employee2", userAccountType)
                      ).to.be.reverted;
                      await expect(
                          chainedIn.signUp("admin@company.com", "Company", companyAccountType)
                      ).to.be.reverted;
                  });
              });

              describe("Account authentication", () => {
                  it("authenticates employee", async () => {
                      await expect(
                          chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                      ).not.to.be.reverted;

                      const authenticationResponse = await chainedIn.login("employee@company.com");
                      assert.equal(authenticationResponse.accountType.toString(), userAccountType);
                      assert.equal(authenticationResponse.userId.toString(), "1");
                  });

                  it("authenticates company", async () => {
                      await expect(
                          chainedIn.signUp("admin@company.com", "Company", companyAccountType)
                      ).not.to.be.reverted;

                      const authenticationResponse = await chainedIn.login("admin@company.com");
                      assert.equal(
                          authenticationResponse.accountType.toString(),
                          companyAccountType
                      );
                      assert.equal(authenticationResponse.userId.toString(), "1");
                  });

                  it("fails employee authentication", async () => {
                      await expect(
                          chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                      ).not.to.be.reverted;
                      await expect(
                          chainedIn.login("employe@company.com")
                      ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__AuthenticationFailed");
                  });

                  it("fails company authentication", async () => {
                      await expect(
                          chainedIn.signUp("admin@company.com", "Company", companyAccountType)
                      ).not.to.be.reverted;
                      await expect(chainedIn.login("ad@company.com")).to.be.revertedWithCustomError(
                          chainedIn,
                          "ChainedIn__AuthenticationFailed"
                      );
                  });
              });
          });

          describe("Account management", () => {
              describe("Employee", () => {
                  beforeEach(async () => {
                      await expect(
                          chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                      ).not.to.be.reverted;
                  });

                  it("updates wallet address", async () => {
                      await expect(
                          chainedIn.updateWalletAddress(
                              userAccountType,
                              "employee@company.com",
                              accounts[1].address
                          )
                      ).not.to.be.reverted;
                      expect((await chainedIn.employees(1)).walletAddress).to.be.equal(
                          accounts[1].address
                      );

                      await expect(
                          chainedIn.login("employee@company.com")
                      ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__AuthenticationFailed");
                      await expect(chainedIn.connect(accounts[1]).login("employee@company.com")).not
                          .to.be.reverted;
                  });

                  it("prevents unauthorized wallet address update", async () => {
                      await expect(
                          chainedIn
                              .connect(accounts[1])
                              .signUp("employee2@company.com", "Employee2", userAccountType)
                      ).not.to.be.reverted;

                      await expect(
                          chainedIn
                              .connect(accounts[1])
                              .updateWalletAddress(
                                  userAccountType,
                                  "employee@company.com",
                                  accounts[1].address
                              )
                      ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__AuthenticationFailed");
                  });

                  it("updates employee company", async () => {
                      await expect(
                          chainedIn
                              .connect(accounts[1])
                              .signUp("admin@company.com", "Company", companyAccountType)
                      ).not.to.be.reverted;
                      await chainedIn.setCompany(1, 1);
                      expect((await chainedIn.employees(1)).companyId).to.equal(1);
                  });
              });

              describe("Company", () => {
                  beforeEach(async () => {
                      await expect(
                          chainedIn.signUp("admin@company.com", "Company", companyAccountType)
                      ).not.to.be.reverted;
                  });

                  it("updates company wallet address", async () => {
                      await expect(
                          chainedIn.updateWalletAddress(
                              companyAccountType,
                              "admin@company.com",
                              accounts[1].address
                          )
                      ).not.to.be.reverted;
                      expect((await chainedIn.companies(1)).walletAddress).to.be.equal(
                          accounts[1].address
                      );

                      await expect(
                          chainedIn.login("admin@company.com")
                      ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__AuthenticationFailed");
                      await expect(chainedIn.connect(accounts[1]).login("admin@company.com")).not.to
                          .be.reverted;
                  });

                  it("approves company manager", async () => {
                      const chainedIn2 = chainedIn.connect(accounts[1]);
                      await expect(
                          chainedIn2.signUp("employee@company.com", "Employee", userAccountType)
                      ).not.to.be.reverted;

                      let employee = await chainedIn.employees(1);
                      assert.equal(employee.isManager, false);
                      assert.equal(employee.companyId.toString(), "0");

                      await expect(chainedIn2.approveManager(1)).to.be.revertedWithCustomError(
                          chainedIn2,
                          "ChainedIn__MustBeCompany"
                      );
                      await expect(chainedIn.approveManager(1)).to.be.revertedWithCustomError(
                          chainedIn2,
                          "ChainedIn__EmployeeNotInCompany"
                      );

                      await expect(chainedIn2.setCompany(1, 1)).not.to.be.reverted;
                      await expect(chainedIn.approveManager(1)).not.to.be.reverted;

                      employee = await chainedIn.employees(1);
                      assert.equal(employee.isManager, true);
                      assert.equal(employee.companyId.toString(), "1");
                  });
              });
          });
      });
