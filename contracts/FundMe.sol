// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

// A NOTE ON GAS!
// Some of the Op Codes w/ the highest gas fees are SLOAD (reading) and SSTORE (writing)

// error best practice to say ContractName__ErrorName
error FundMe__NotOwner();

/// Documentation is inserted above each contract, interface, library, function, and event using the Doxygen notation format. A public state variable is equivalent to a function for the purposes of NatSpec.

// NatSpec Tags: https://docs.soliditylang.org/en/v0.8.16/natspec-format.html#tags

/// @title A contract for crowdfunding
/// @author union_pac
/// @notice A contract to demo a sample funding contract
/// @dev This implements price feeds as our library
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State Variables
    // https://docs.soliditylang.org/en/v0.8.13/internals/layout_in_storage.html
    uint256 public constant MIN_FUND_AMOUNT_USD = 50 * 1e18;

    address private immutable i_owner;
    address[] private s_funders;

    // syntax for storage variables s_variableName
    mapping(address => uint256) private s_addressToAmountFunded;

    AggregatorV3Interface private s_priceFeed;

    // Events
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // Functions
    // Function Order:
    // constructor
    // receive
    // fallback
    // external
    // public
    // internal
    // private
    // view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /// @notice This function funds this contract
    /// @dev This implements price feeds as our library
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MIN_FUND_AMOUNT_USD,
            "Need to send more!"
        );

        s_funders.push(msg.sender);
        // console.log("Added %s to funders array", msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // create a cheaper withdraw function
        // make this for loop more gas efficient
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        payable(msg.sender).transfer(address(this).balance);
        // send (returns a bool)
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send Failed");
        // call (returns 2 vars -> a boolean, a bytes)
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call Failed");
    }

    function cheaperWithdraw() public onlyOwner {
        // reset array to 0
        // make a copy of the storage funders array to memory var
        // mappings can't be in memory :(
        address[] memory funders = s_funders;
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAmountFunded(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
