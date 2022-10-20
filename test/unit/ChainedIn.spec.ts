import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
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

          describe("Experience management", () => {
              beforeEach(async () => {
                  await expect(
                      chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                  ).not.to.be.reverted;
                  await expect(
                      chainedIn
                          .connect(accounts[1])
                          .signUp("admin@company.com", "Company", companyAccountType)
                  ).not.to.be.reverted;
              });

              it("adds employee experience", async () => {
                  await expect(
                      chainedIn.addExperience(1, "2020", "2022", "Unit Tester", 2)
                  ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__UnknownCompany");
                  await expect(chainedIn.addExperience(1, "2020", "2022", "Unit Tester", 1)).not.to
                      .be.reverted;

                  const unverifiedEmployees = await chainedIn.getCompanyUnverifiedEmployees(1);
                  assert.include(
                      unverifiedEmployees.map((e) => e.toString()),
                      "1"
                  );

                  const experiences = await chainedIn.getEmployeeExperiences(1);
                  assert.equal(experiences.length, 1);

                  const experience = await chainedIn.experiences(experiences[0]);
                  assert.equal(experience.startingDate, "2020");
                  assert.equal(experience.endingDate, "2022");
                  assert.equal(experience.role, "Unit Tester");
                  assert.equal(experience.companyId.toString(), "1");
                  assert.equal(experience.isActive, false);
                  assert.equal(experience.isApproved, false);
              });

              it("approves active employee experience", async () => {
                  await expect(chainedIn.addExperience(1, "2020", "2022", "Unit Tester", 1)).not.to
                      .be.reverted;

                  const chainedIn2 = chainedIn.connect(accounts[1]);
                  await expect(
                      chainedIn.approveExperience(1, 1, true)
                  ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__UnauthorizedApprover");
                  await expect(chainedIn2.approveExperience(1, 1, true)).not.to.be.reverted;

                  const experience = await chainedIn.experiences(1);
                  assert.equal(experience.startingDate, "2020");
                  assert.equal(experience.endingDate, "2022");
                  assert.equal(experience.role, "Unit Tester");
                  assert.equal(experience.companyId.toString(), "1");
                  assert.equal(experience.isActive, true);
                  assert.equal(experience.isApproved, true);

                  const unverifiedEmployees = await chainedIn.getCompanyUnverifiedEmployees(1);
                  const currentEmployees = await chainedIn.getCompanyCurrentEmployees(1);
                  const previousEmployees = await chainedIn.getCompanyPreviousEmployees(1);
                  assert.notInclude(
                      unverifiedEmployees.map((e) => e.toString()),
                      "1"
                  );
                  assert.include(
                      currentEmployees.map((e) => e.toString()),
                      "1"
                  );
                  assert.notInclude(
                      previousEmployees.map((e) => e.toString()),
                      "1"
                  );
              });

              it("approves inactive employee experience", async () => {
                  await expect(chainedIn.addExperience(1, "2020", "2022", "Unit Tester", 1)).not.to
                      .be.reverted;

                  const chainedIn2 = chainedIn.connect(accounts[1]);
                  await expect(
                      chainedIn.approveExperience(1, 1, false)
                  ).to.be.revertedWithCustomError(chainedIn, "ChainedIn__UnauthorizedApprover");
                  await expect(chainedIn2.approveExperience(1, 1, false)).not.to.be.reverted;

                  const experience = await chainedIn.experiences(1);
                  assert.equal(experience.startingDate, "2020");
                  assert.equal(experience.endingDate, "2022");
                  assert.equal(experience.role, "Unit Tester");
                  assert.equal(experience.companyId.toString(), "1");
                  assert.equal(experience.isActive, false);
                  assert.equal(experience.isApproved, true);

                  const unverifiedEmployees = await chainedIn.getCompanyUnverifiedEmployees(1);
                  const currentEmployees = await chainedIn.getCompanyCurrentEmployees(1);
                  const previousEmployees = await chainedIn.getCompanyPreviousEmployees(1);
                  assert.notInclude(
                      unverifiedEmployees.map((e) => e.toString()),
                      "1"
                  );
                  assert.notInclude(
                      currentEmployees.map((e) => e.toString()),
                      "1"
                  );
                  assert.include(
                      previousEmployees.map((e) => e.toString()),
                      "1"
                  );
              });

              it("updates employee active experience", async () => {
                  await expect(chainedIn.addExperience(1, "2020", "2022", "Unit Tester", 1)).not.to
                      .be.reverted;
                  await expect(chainedIn.setCurrentActiveExperience(1, 1)).not.to.be.reverted;
                  expect((await chainedIn.employees(1)).currentActiveExperience).to.equal(1);
              });
          });

          describe("Skill management", () => {
              beforeEach(async () => {
                  await expect(
                      chainedIn.signUp("employee@company.com", "Employee", userAccountType)
                  ).not.to.be.reverted;
              });

              it("adds employee skill", async () => {
                  await expect(chainedIn.addSkill(1, "Unit Testing")).not.to.be.reverted;

                  const skills = await chainedIn.getEmployeeSkills(1);
                  assert.include(
                      skills.map((e) => e.toString()),
                      "1"
                  );

                  const skill = await chainedIn.skills(skills[0]);
                  assert.equal(skill.name, "Unit Testing");
                  assert.equal(skill.isVerified, false);
              });

              it("adds employee skill certification", async () => {
                  await expect(chainedIn.addSkill(1, "Unit Testing")).not.to.be.reverted;
                  await expect(
                      chainedIn.addCertification(
                          1,
                          "http://certification.com",
                          "2021",
                          "2023",
                          "Certificate of Mocha Unit Testing",
                          "Mocha",
                          1
                      )
                  ).not.to.be.reverted;

                  const certifications = await chainedIn.getSkillCertifications(1);
                  assert.include(
                      certifications.map((e) => e.toString()),
                      "1"
                  );

                  const certification = await chainedIn.certifications(1);
                  assert.equal(certification.url, "http://certification.com");
                  assert.equal(certification.issuedOn, "2021");
                  assert.equal(certification.validTill, "2023");
                  assert.equal(certification.name, "Certificate of Mocha Unit Testing");
                  assert.equal(certification.issuer, "Mocha");
              });
          });
      });
