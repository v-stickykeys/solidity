// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title IVersion
 * @author stickykeys.eth
 * @dev Interface for versioned contracts.
 * Rather than using a constant state variable which can not be overwritten when
 * inherited, this interface provides the signature for a gas efficient getter
 * that returns the version of the contract.
 */
interface IVersion {
    /**
     * @dev Returns version based on semantic versioning format.
     */
    function version() external pure returns (string memory);
}
