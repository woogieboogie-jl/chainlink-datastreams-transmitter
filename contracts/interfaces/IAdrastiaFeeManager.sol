// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @notice A minimal, local interface for the IFeeManager that includes
 * only the functions required by DataStreamsFeed.sol.
 */
interface IAdrastiaFeeManager {
    function i_linkAddress() external view returns (address);
    function i_rewardManager() external view returns (address);
}
