// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/utils/Context.sol";
import "./@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SimpleAccessControl
 * @author stickykeys.eth
 * @notice This contract module can be used to restrict access for functionality
 * in child contracts to specific addresses.
 * @dev This is a simple implementation inspired by the OpenZeppelin
 * {AccessControl} contract.
 *
 * To restrict access to a function call, use `isAuthorized`:
 *
 * ```
 * function foo() public {
 *     require(isAuthorized(msg.sender));
 *     ...
 * }
 * ```
 *
 * There is a single trusted admin, set to the message sender by default.
 * The admin has all privileges that controllers do and only the admin can
 * change who the admin is.
 *
 * @custom:warning
 * ===============
 * Extra precautions should be taken to secure the account set as `admin`.
 */
abstract contract SimpleAccessControl is Context {
    string public constant VERSION = "1.0.0";

    address private _admin;
    mapping(address => bool) private _controllers;

    modifier onlyAdmin() {
        require(isAdmin(_msgSender()), "SimpleAccessControl: 403");
        _;
    }

    modifier onlyAuthorized() {
        require(isAuthorized(_msgSender()), "SimpleAccessControl: 403");
        _;
    }

    /**
     * @notice Returns true if an account address is authorized.
     * @param account Ethereum account address.
     * @return True or false.
     */
    function isAuthorized(address account) public view virtual returns (bool) {
        return isController(account) || isAdmin(account);
    }

    /**
     * @notice Returns true if an account address is the admin.
     * @param account Ethereum account address.
     * @return True or false.
     */
    function isAdmin(address account) public view virtual returns (bool) {
        return account == _admin;
    }

    /**
     * @notice Returns true if an account address is a controller.
     * @param account Ethereum account address.
     * @return True or false.
     */
    function isController(address account) public view virtual returns (bool) {
        return _controllers[account] == true;
    }

    /**
     * @notice Set the contract admin.
     * @custom:require Caller must be authorized.
     * @param account Ethereum account address to set as admin.
     */
    function setAdmin(address account) public virtual onlyAdmin {
        _admin = account;
    }

    /**
     * @notice Add a controller.
     * @custom:require Caller must be authorized.
     * @custom:require `account` can not be 0 address.
     * @param account Ethereum account address to make a controller
     */
    function addController(address account) public virtual onlyAuthorized {
        require(account != address(0), "SimpleAccessControl: ValueError");
        _controllers[account] = true;
    }

    /**
     * @notice Remove a controller.
     * @custom:require Caller must be authorized.
     * @param account Ethereum account address to remove as a controller.
     */
    function removeController(address account) public virtual onlyAuthorized {
        delete _controllers[account];
    }

    /**
     * @dev Set the initial admin to the message sender (i.e. contract deployer).
     *
     * @custom:warning
     * ===============
     * This function should only be called from the constructor when setting
     * up the initial admin for the system.
     *
     * Using this function in any other way is effectively circumventing the
     * admin functionality of the access control system.
     */
    function _setupAccessControl() internal virtual {
        _admin = _msgSender();
    }
}
