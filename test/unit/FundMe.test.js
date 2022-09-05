const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { devChains } = require("../../helper-hardhat-config")

!devChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const deployValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              // deploy fundMe contract
              // using Hardhat-deploy

              // const accounts = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              // test for:
              // does the require work for s_funders having to send more than the min USD value
              it("Fails if you don't send at least the min USD value", async function () {
                  // call fund (passing it 0)
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Need to send more!"
                  )
              })
              it("updates the amount funded data structure", async function () {
                  // calling deploy with 1 ETH
                  await fundMe.fund({ value: deployValue })
                  const response = await fundMe.getAmountFunded(deployer)
                  assert.equal(response.toString(), deployValue.toString())
              })
              it("should add s_funders to s_funders array", async function () {
                  await fundMe.fund({ value: deployValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })
          describe("withdraw", async function () {
              // test for onlyOwner
              beforeEach(async function () {
                  await fundMe.fund({ value: deployValue })
              })
              it("withdraw from single funder", async function () {
                  // Arrange
                  // the fundMe contract has a provider, we could also use ethers.provider
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasPaid = gasUsed.mul(effectiveGasPrice)
                  // gas cost (how to get this?) - from tx Receipt

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasPaid).toString()
                  )
              })
              it("allows us to withdraw with multiple s_funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: deployValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  // how much gas does this take to withdraw?
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasPaid = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasPaid).toString()
                  )
                  // make sure s_funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // make sure mapping values go back to 0
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      )
                  }
              })
              it("should only allow owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const connectAttacker = await fundMe.connect(attacker)
                  await expect(
                      connectAttacker.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: deployValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  // how much gas does cheaperWithdraw take?
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasPaid = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasPaid).toString()
                  )
                  // make sure s_funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // make sure mapping values go back to 0
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      )
                  }
              })
          })
      })
