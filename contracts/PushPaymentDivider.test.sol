// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./PushPaymentDivider.sol";

contract PushPaymentDividerTest {
    PushPaymentDivider private immutable _paymentHandler;

    constructor(address payable[] memory recipients, uint256[] memory percentages) {
        _paymentHandler = new PushPaymentDivider(recipients, percentages);
    }

    function percentage(address recipient) public view returns (uint256) {
        return _paymentHandler.percentage(recipient);
    }

    function accumulatedChange(address recipient) public view returns (uint256) {
        return _paymentHandler.accumulatedChange(recipient);
    }

    function deposit() external payable {
        _deposit(msg.value);
    }

    /**
     * @dev Called by the payer to send the amount to the payment handler contract.
     * Funds sent in this way are stored in an intermediate {PushPaymentDivider} contract, so
     * there is no danger of them being spent before withdrawal.
     *
     * @param amount The amount to transfer.
     */
    function _deposit(uint256 amount) internal virtual {
        _paymentHandler.deposit{value: amount}();
    }
}
