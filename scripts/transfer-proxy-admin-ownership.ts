import { upgrades } from "hardhat";

const main = async () => {
    const gnosisSafe = process.env.GNOSIS_SAFE!;

    console.log("Transferring ownership of ProxyAdmin...");
    await upgrades.admin.transferProxyAdminOwnership(gnosisSafe);
    console.log(`Transferred ownership of ProxyAdmin to: ${gnosisSafe}`);
};

main().catch((error) => {
    console.log(error);
    process.exit(1);
});
