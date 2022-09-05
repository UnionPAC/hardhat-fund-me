const { network } = require("hardhat")
const { networkConfig, devChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // if chainId is x use address y
    // if the contract doesn't exist, we deploy a minimal version of it
    // for our local testing
    // const ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    let ethUsdPriceFeedAddress
    if (devChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    console.log(ethUsdPriceFeedAddress)

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        contract: "FundMe",
        from: deployer,
        args: args, // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // verify
        await verify(fundMe.address, args)
    }
    log("-----------------------------------------")
}

module.exports.tags = ["all", "fundme"]
