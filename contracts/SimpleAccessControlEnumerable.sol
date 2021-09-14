// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./SimpleAccessControl.sol";

/**
 * @title SimpleAccessControlEnumerable
 * @author stickykeys.eth
 * @notice This contract module can be used to restrict access for functionality
 * in child contracts to specific account addresses.
 * @dev This is an extension of the {SimpleAccessControl} contract that allows
 * all controllers to be enumerated.
 *
 * There is be a single trusted admin, set to the message sender by default.
 * The admin has all privileges that controllers do and only the admin can
 * change who the admin is.
 *
 * @custom:warning
 * ===============
 * Extra precautions should be taken to secure the account set as `admin`.
 *
 */
abstract contract SimpleAccessControlEnumerable is SimpleAccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _controllers;

    function version() external pure virtual override returns (string memory) {
        return "1.0.0";
    }
    
    /**
     * @notice Returns true if an account address is a controller.
     * @param account Ethereum account address.
     * @return True or false.
     */
    function isController(address account) public view override returns (bool) {
        return _controllers.contains(account);
    }

    /**
     * @notice Get the account address of the controller currently at position
     * `index` of the set.
     * @dev Nondeterministic. The address returned may change as controllers are
     * added/removed.
     * @param index Position in the set of controllers.
     * @return Controller account address.
     */
    function getController(uint256 index) public view returns (address) {
        return _controllers.at(index);
    }

    /**
     * @notice Get the number of controllers in this contract.
     * @dev Returns length of `_controllers` set.
     * @return Number.
     */
    function getControllerCount() public view returns (uint256) {
        return _controllers.length();
    }

    /**
     * @notice Add a controller.
     * @custom:require Caller must be authorized.
     * @custom:require `account` can not be 0 address.
     * @param account Ethereum account address to make a controller.
     */
    function addController(address account) public virtual override onlyAuthorized {
        require(account != address(0), "SimpleAccessControl: ValueError");
        _controllers.add(account);
    }

    /**
     * @notice Remove a controller.
     * @custom:require Caller must be authorized.
     * @param account Ethereum account address to remove as a controller.
     */
    function removeController(address account) public virtual override onlyAuthorized {
        _controllers.remove(account);
    }
}
