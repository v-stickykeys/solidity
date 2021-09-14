// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/utils/Context.sol";
import "./@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SimpleAccessControl
 * @author stickykeys.eth
 * @notice This contract module can be used to restrict access for functionality
 * in child contracts to specific addresses.
 * @dev This is a simple implementation based on the OpenZeppelin
 * {AccessControlEnumberable} contract.
 *
 * To restrict access to a function call, use {isAuthorized}:
 *
 * ```
 * function foo() public {
 *     require(isAuthorized(msg.sender));
 *     ...
 * }
 * ```
 *
 * Controllers can be added and moved dynamically via the {addController} and
 * {removeController} functions.
 *
 * There is a single trusted admin, set to the message sender by default.
 * The admin has all privileges that controllers do and only the admin can
 * change who the admin is.
 *
 * WARNING: Extra precautions should be taken to secure the account that is the
 * admin.
 */
abstract contract SimpleAccessControl is Context {
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
     * @notice Check that an account address is authorized.
     * @dev Returns {true} if {account} is a controller or admin.
     * @param account Ethereum account address
     * @return True or false
     */
    function isAuthorized(address account) public view returns (bool) {
        return isController(account) || isAdmin(account);
    }

    /**
     * @notice Check that an account address is the admin.
     * @dev Returns {true} if {account} is the admin.
     * @param account Ethereum account address
     * @return True or false
     */
    function isAdmin(address account) public view returns (bool) {
        return account == _admin;
    }

    /**
     * @notice Check that an account address is a controller.
     * @dev Returns {true} if {account} is a controller.
     * @param account Ethereum account address
     * @return True or false
     */
    function isController(address account) public view returns (bool) {
        return _controllers[account] == true;
    }

    /**
     * @notice Set the contract admin.
     * @dev
     * Requirements:
     * - the caller must be {_admin}
     * @param account Ethereum account address to set as admin
     */
    function setAdmin(address account) public virtual onlyAdmin {
        _admin = account;
    }

    /**
     * @notice Add a controller.
     * @dev
     * Requirements:
     * - the caller must be {_admin} or a controller
     * @param account Ethereum account address to make a controller
     */
    function addController(address account) public virtual onlyAuthorized {
        require(account != address(0), "SimpleAccessControl: ValueError");
        _controllers[account] = true;
    }

    /**
     * @notice Remove a controller.
     * @dev
     * Requirements:
     * - the caller must be {_admin} or a controller
     * @param account Ethereum account address to remove as a controller
     */
    function removeController(address account) public virtual onlyAuthorized {
        delete _controllers[account];
    }

    /**
     * @dev Set the initial admin to the message sender (i.e. contract deployer).
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial admin for the system.
     *
     * Using this function in any other way is effectively circumventing the
     * admin functionality of the access control system.
     * ====
     */
    function _setupAccessControl() internal virtual {
        _admin = _msgSender();
    }
}
