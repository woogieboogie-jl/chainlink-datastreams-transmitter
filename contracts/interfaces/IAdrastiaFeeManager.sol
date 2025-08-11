// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {DataStreamsStructs} from "src/structs/DataStreamsStructs.sol";

/**
 * @notice A minimal, local interface for the IFeeManager that includes
 * only the functions required by DataStreamsFeed.sol.
 */
interface IAdrastiaFeeManager {
    /**
     * @notice Calculates the fee and reward associated with verifying a report, including discounts for subscribers.
     * This function assesses the fee and reward for report verification, applying a discount for recognized subscriber addresses.
     * @param subscriber The address attempting to verify the report. A discount is applied if this address
     * is recognized as a subscriber.
     * @param unverifiedReport The report data awaiting verification. The content of this report is used to
     * determine the base fee and reward, before considering subscriber discounts.
     * @param quoteAddress The payment token address used for quoting fees and rewards.
     * @return fee The fee assessed for verifying the report, with subscriber discounts applied where applicable.
     * @return reward The reward allocated to the caller for successfully verifying the report.
     * @return totalDiscount The total discount amount deducted from the fee for subscribers
     */
    function getFeeAndReward(
        address subscriber,
        bytes memory unverifiedReport,
        address quoteAddress
    ) external returns (DataStreamsStructs.Asset memory, DataStreamsStructs.Asset memory, uint256);

    function i_linkAddress() external view returns (address);

    function i_nativeAddress() external view returns (address);

    function i_rewardManager() external view returns (address);
}
