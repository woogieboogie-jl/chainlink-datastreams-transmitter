// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/IAccessControlEnumerable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Test} from "forge-std/Test.sol";
import {FeedConstants} from "../../FeedConstants.sol";
import {DataStreamsFeed} from "../../../feed/DataStreamsFeed.sol";
import {IAdrastiaVerifierProxy} from "src/interfaces/IAdrastiaVerifierProxy.sol";
import {VerifierStub} from "../../VerifierStub.sol";
import {UpdateHookStub} from "../../UpdateHookStub.sol";
import {PreUpdateHookStub} from "../../PreUpdateHookStub.sol";
import {PostUpdateHookStub} from "../../PostUpdateHookStub.sol";
import {FakeErc20} from "../../FakeErc20.sol";
import {IDataStreamsPostUpdateHook} from "src/interfaces/IDataStreamsPostUpdateHook.sol";
import {IDataStreamsPreUpdateHook} from "src/interfaces/IDataStreamsPreUpdateHook.sol";
import {FeedDataFixture} from "../../FeedDataFixture.sol";
import {AggregatorInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorInterface.sol";
import {AggregatorV2V3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV2V3Interface.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IDataStreamsFeed} from "src/interfaces/IDataStreamsFeed.sol";
import {AdrastiaDataStreamsCommon} from "../../../common/AdrastiaDataStreamsCommon.sol";
import {FeeManagerStub} from "../../FeeManagerStub.sol";
import {RewardManagerStub} from "../../RewardManagerStub.sol";
import {console2} from "forge-std/console2.sol";

contract DataStreamsFeedForkTest is Test, FeedConstants, FeedDataFixture {
    event AnswerUpdated(
        int256 indexed current,
        uint256 indexed roundId,
        uint256 updatedAt
    );

    /**
     * @notice An event emitted when the latest report is updated.
     *
     * @param feedId The ID of the feed. This is the same as the feedId in the report.
     * @param updater The address of the account updating the report.
     * @param roundId The round ID of the report. Starts at 1 and increments with each report update.
     * @param price The price of the report. This is a signed integer, as prices can be negative.
     * @param validFromTimestamp The timestamp at which the report becomes valid, in seconds since the Unix epoch.
     * @param observationsTimestamp The timestamp of the report, in seconds since the Unix epoch.
     * @param expiresAt The timestamp at which the report expires, in seconds since the Unix epoch.
     * @param timestamp The block timestamp at which the report was updated, in seconds since the Unix epoch.
     */
    event ReportUpdated(
        bytes32 indexed feedId,
        address indexed updater,
        uint32 roundId,
        int192 price,
        uint32 validFromTimestamp,
        uint32 observationsTimestamp,
        uint32 expiresAt,
        uint32 timestamp
    );

    /**
     * @notice An event emitted when the update pause status is changed.
     *
     * @param caller The address of the account that changed the pause status.
     * @param paused True if updates are paused, false otherwise.
     * @param timestamp The block timestamp at which the pause status was changed, in seconds since the Unix epoch.
     */
    event PauseStatusChanged(
        address indexed caller,
        bool paused,
        uint256 timestamp
    );

    /**
     * @notice An event emitted when a hook reverts, but the failure is allowed.
     *
     * @param hookType The type of the hook that failed.
     * @param hook The address of the hook that failed.
     * @param reason The reason for the failure, encoded as bytes.
     * @param timestamp The block timestamp at which the hook failed, in seconds since the Unix epoch.
     */
    event HookFailed(
        uint256 indexed hookType,
        address indexed hook,
        bytes reason,
        uint256 timestamp
    );

    /**
     * @notice An event emitted when a hook is changed.
     *
     * @param caller The address of the account that changed the hook.
     * @param hookType The type of the hook that was changed.
     * @param oldHook The old hook config.
     * @param newHook The new hook config.
     * @param timestamp The block timestamp at which the hook was changed, in seconds since the Unix epoch.
     */
    event HookConfigUpdated(
        address indexed caller,
        uint256 indexed hookType,
        DataStreamsFeed.Hook oldHook,
        DataStreamsFeed.Hook newHook,
        uint256 timestamp
    );

    struct ReportData {
        bytes32 feedId;
        int192 price;
        uint32 validFromTimestamp;
        uint32 observationsTimestamp;
        uint32 expiresAt;
        bytes rawReport;
    }

    string internal ETH_MAINNET_RPC_URL =
        vm.envString("RPC_URL_ETHEREUM_MAINNET");
    uint256 internal ETH_MAINNET_BLOCK_NUMBER = 22949499;
    address internal ETH_MAINNET_VERIFIER_PROXY_ADDRESS =
        0x5A1634A86e9b7BfEf33F0f3f3EA3b1aBBc4CC85F;

    ReportData internal ETH_USD_ReportData =
        ReportData({
            feedId: 0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9,
            price: 3541546843929323200000,
            validFromTimestamp: 1752882370,
            observationsTimestamp: 1752882370,
            expiresAt: 1755474370,
            rawReport: hex"00094baebfda9b87680d8e59aa20a3e565126640ee7caeab3cd965e5568b17ee00000000000000000000000000000000000000000000000000000000007c8191000000000000000000000000000000000000000000000000000000040000000100000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000030001010100010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae900000000000000000000000000000000000000000000000000000000687adcc200000000000000000000000000000000000000000000000000000000687adcc20000000000000000000000000000000000000000000000000000522da558340e000000000000000000000000000000000000000000000000003fec89a74d013c0000000000000000000000000000000000000000000000000000000068a269c20000000000000000000000000000000000000000000000bffcd5eaa265175e000000000000000000000000000000000000000000000000bffc910d5497f7b1500000000000000000000000000000000000000000000000c0003be7d9f83f339000000000000000000000000000000000000000000000000000000000000000066db21d04a6e703b9d938cd376d4d409473b998ad544864869ba3323739a39093a28c003121ea69cfd59195686b98da1d61691bb952057d7014ccebf5cbabc0ba364a74c9bc6017c98cf60ca2fb5f8edc2334f0fffabae5247c963b53ddc05238e6a0a555dbc825ec3efaec08c35128a5f1a60fa6f4f4976e6bf68bc23e2731342533e2c22fb1dd58af005a234397e02a091cd7fb18365ad421a9d885c19b8719106a4beac4f075b86c716ed87b910a20c7c4e6d99dcae1f8988f935370dca42b00000000000000000000000000000000000000000000000000000000000000065092ca48b38a38a2f230d2ebd86a85cacf08eecdcb7189ad67e531b174c9d508389e1015ee976dd848263999768aed206a68964df838abcdb70c44274cc715b0498797d5bfa68ad7d15fb20cb61eb9269b82070f3dad63ddb00a8f048b69ea3b1330e9078410db5126e687b18a2b0cdbf8e073eeb299e6f399f013c974de439165dbb44f3ef2cbfe2d01ea4d09e39a02937cd03a77a9249bc9db6ebb5ee9196012f092b200c846357adefce098c829fe7176cd713895f6734917c22844fb6b54"
        });

    uint256 ethMainnetFork;

    function setUp() public {
        ethMainnetFork = vm.createFork(
            ETH_MAINNET_RPC_URL,
            ETH_MAINNET_BLOCK_NUMBER
        );
    }

    function test_verifiesRealReport() public {
        vm.selectFork(ethMainnetFork);

        ReportData memory reportData = ETH_USD_ReportData;

        DataStreamsFeed feed = new DataStreamsFeed(
            ETH_MAINNET_VERIFIER_PROXY_ADDRESS,
            reportData.feedId,
            ETH_USD_V3.decimals,
            MAX_REPORT_EXPIRATION_SECONDS,
            ETH_USD_V3.description
        );

        // Check that the report was stored correctly
        uint32 expectedRoundId = ROUND_ID_FIRST;

        bytes memory parameterPayload = abi.encode(address(0));

        vm.expectEmit(true, true, true, true);

        emit AnswerUpdated(
            reportData.price,
            reportData.observationsTimestamp,
            block.timestamp
        );

        vm.expectEmit(true, true, true, true);

        emit ReportUpdated(
            ETH_USD_V3.feedId,
            address(this),
            expectedRoundId,
            reportData.price,
            reportData.validFromTimestamp,
            reportData.observationsTimestamp,
            reportData.expiresAt,
            uint32(block.timestamp)
        );

        // Verify and store the report
        feed.verifyAndUpdateReport(reportData.rawReport, parameterPayload);

        assertEq(
            feed.latestAnswer(),
            reportData.price,
            "Latest answer should match the report price"
        );
        assertEq(
            feed.latestTimestamp(),
            reportData.observationsTimestamp,
            "Latest timestamp should match the report observationsTimestamp"
        );
        assertEq(
            feed.latestRound(),
            expectedRoundId,
            "Latest round should equal 1"
        );

        assertEq(
            feed.getAnswer(expectedRoundId),
            reportData.price,
            "Answer for the first round should match the report price"
        );
        assertEq(
            feed.getTimestamp(expectedRoundId),
            reportData.observationsTimestamp,
            "Timestamp for the first round should match the report observationsTimestamp"
        );
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.getRoundData(expectedRoundId);

        assertEq(
            roundId,
            expectedRoundId,
            "Round ID should match the expected round ID"
        );
        assertEq(
            answer,
            reportData.price,
            "Answer for the first round should match the report price"
        );
        assertEq(
            startedAt,
            reportData.observationsTimestamp,
            "Started at should match the report observationsTimestamp"
        );
        assertEq(
            updatedAt,
            block.timestamp,
            "Updated at should match the current timestamp"
        );
        assertEq(
            answeredInRound,
            expectedRoundId,
            "Answered in round should match the expected round ID"
        );

        // Check latestRoundData
        (roundId, answer, startedAt, updatedAt, answeredInRound) = feed
            .latestRoundData();

        assertEq(
            roundId,
            expectedRoundId,
            "Latest round ID should match the expected round ID"
        );
        assertEq(
            answer,
            reportData.price,
            "Latest answer should match the report price"
        );
        assertEq(
            startedAt,
            reportData.observationsTimestamp,
            "Latest started at should match the report observationsTimestamp"
        );
        assertEq(
            updatedAt,
            block.timestamp,
            "Latest updated at should match the current timestamp"
        );
        assertEq(
            answeredInRound,
            expectedRoundId,
            "Latest answered in round should match the expected round ID"
        );
    }
}
