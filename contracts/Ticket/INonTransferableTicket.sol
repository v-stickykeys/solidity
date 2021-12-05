// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title IERC
 * @author stickykeys.eth
 * @dev Required interface of an ERC compliant contract.
 */
interface INonTransferableTicket {
    /**
     * @dev Emitted when `holder` redeems `ticketId`.
     */
    event Redemption(address indexed redeemer, uint256 indexed ticketId);

    /**
     * @dev Returns the amount of tickets without holders.
     */
    function totalRemaining() external view returns (uint256);

    /**
     * @dev Returns the amount of tickets held by `holder`.
     */
    function quantityHeldBy(address holder) external view returns (uint256);

    /**
     * @dev Returns the holder of `ticketId`.
     *
     */
    function holderOf(uint256 ticketId) external view returns (address);

    /**
     * @dev Redeems `ticketId`, removing the ability to redeem it.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Redemption} event.
     */
    function redeem(uint256 ticketId) external returns (bool);
}
