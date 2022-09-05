const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xd4a33860578de61dbabdc8bfdb98fd742fa7028e",
    },
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8a753747a1fa494ec906ce90e9f37563a8af630e",
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
    // what about 31337 (hardhat) ?
}

const devChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = { networkConfig, devChains, DECIMALS, INITIAL_ANSWER }
