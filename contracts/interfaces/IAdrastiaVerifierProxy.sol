// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @notice A minimal, local interface for the VerifierProxy that includes
 * the s_feeManager() getter. This is used to resolve a discrepancy where the
 * official library interface is missing this function.
 */
interface IAdrastiaVerifierProxy {
    function verify(
        bytes calldata payload,
        bytes calldata parameterPayload
    ) external payable returns (bytes memory verifierResponse);

    function verifyBulk(
        bytes[] calldata payloads,
        bytes calldata parameterPayload
    ) external payable returns (bytes[] memory verifiedReports);

    function s_feeManager() external view returns (address);
}
