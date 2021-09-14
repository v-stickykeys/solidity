// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./SimpleAccessControl.sol";

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
contract SimpleAccessControlTest is SimpleAccessControl {
    uint256 public x;
    uint256 public y;

    constructor() {
        _setupAccessControl();
    }

    function setX(uint256 a) public onlyAdmin {
        x = a;
    }

    function setY(uint256 b) public onlyAuthorized {
        y = b;
    }
}
