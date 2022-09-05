const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding Contract ...")
    const tx = await fundMe.fund({ value: ethers.utils.parseEther("0.1") })
    await tx.wait(1)
    console.log("Successfully funded")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
