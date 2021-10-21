// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FlexPaymentDivider.sol";

contract FlexPaymentDividerTest {
    FlexPaymentDivider private immutable _paymentHandler;

    constructor(address payable[] memory recipients, uint256[] memory percentages) {
        _paymentHandler = new FlexPaymentDivider(recipients, percentages);
    }

    function percentage(address recipient) public view returns (uint256) {
        return _paymentHandler.percentage(recipient);
    }

    function accumulatedChange(address recipient) public view returns (uint256) {
        return _paymentHandler.accumulatedChange(recipient);
    }

    function deposit(uint8 safeMode) external payable {
        if (safeMode == 0) { // 0 = false
            _deposit(msg.value);
        } else {
            _deposit(msg.value);
            _disperse();
        }
    }

    /**
     * @dev Called by the payer to send the amount to the payment handler
     * contract. Funds sent in this way are stored in an intermediate
     * {FlexPaymentDivider} contract, so there is no danger of them being spent
     * before withdrawal.
     *
     * @param amount The amount to transfer.
     */
    function _deposit(uint256 amount) internal virtual {
        _paymentHandler.deposit{value: amount}();
    }

    function _disperse() internal virtual {
        _paymentHandler.disperse();
    }
}
