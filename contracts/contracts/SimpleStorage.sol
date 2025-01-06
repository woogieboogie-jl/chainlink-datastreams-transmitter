// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract SimpleStorage {
    struct ReportV3 {
        bytes32 feedId; // The stream ID the report has data for.
        uint192 validFromTimestamp; // Earliest timestamp for which price is applicable.
        uint192 observationsTimestamp; // Latest timestamp for which price is applicable.
        uint192 nativeFee; // Base cost to validate a transaction using the report, denominated in the chain’s native token (e.g., WETH/ETH).
        uint192 linkFee; // Base cost to validate a transaction using the report, denominated in LINK.
        uint192 expiresAt; // Latest timestamp where the report can be verified onchain.
        int192 price; // DON consensus median price (8 or 18 decimals).
        int192 bid; // Simulated price impact of a buy order up to the X% depth of liquidity utilisation (8 or 18 decimals).
        int192 ask; // Simulated price impact of a sell order up to the X% depth of liquidity utilisation (8 or 18 decimals).
    }

    ReportV3 storedData;

    function set(ReportV3 memory x) public {
        storedData = x;
    }

    function get() public view returns (ReportV3 memory) {
        return storedData;
    }
}
