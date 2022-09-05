const { network } = require("hardhat")
const {
    devChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (chainId == 31337) {
        // deploy mocks
        log("Local network detected ... deploying mocks")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
            // gasLimit
        })
        log("Mocks successfully deployed!")
        log("--------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
