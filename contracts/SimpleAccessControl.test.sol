// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./SimpleAccessControl.sol";

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
