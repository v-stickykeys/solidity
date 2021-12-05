// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./INonTransferableTicket.sol";

/**
 * @title ERC- Non-Transferable Ticket Standard, optional metadata extension
 * @dev See https://eips.ethereum.org/EIPS/eip-
 */
interface INonTransferableTicketMetadata is INonTransferableTicket {
    /**
     * @dev Returns the ticket collection name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the ticket collection issuer.
     */
    function issuer() external view returns (address);

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `ticketId` ticket.
     */
    function ticketURI(uint256 ticketId) external view returns (string memory);
}
