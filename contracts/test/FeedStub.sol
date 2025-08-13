// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import {DataStreamsFeed} from "src/feed/DataStreamsFeed.sol";

contract FeedStub is DataStreamsFeed {
    constructor(
        address verifierProxy,
        bytes32 feedId,
        uint8 decimals,
        uint32 maxReportExpirationSeconds,
        string memory description
    ) DataStreamsFeed(verifierProxy, feedId, decimals, maxReportExpirationSeconds, description) {}

    function stubPush(int192 price, uint32 timestamp, uint32 expiresAt) public {
        TruncatedReport memory lastReport = latestReport;

        uint32 newRoundId = lastReport.roundId + 1;

        historicalReports[newRoundId] = latestReport = TruncatedReport({
            price: price,
            observationTimestamp: timestamp,
            expiresAt: expiresAt,
            storageTimestamp: uint32(block.timestamp),
            roundId: newRoundId
        });
    }
}
