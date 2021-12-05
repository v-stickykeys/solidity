// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../@openzeppelin/contracts/access/Ownable.sol";
import "../@openzeppelin/contracts/utils/Address.sol";
import "../@openzeppelin/contracts/utils/Context.sol";
import "../@openzeppelin/contracts/utils/Strings.sol";

import "./INonTransferableTicket.sol";
import "./INonTransferableTicketMetadata.sol";

contract NonTransferableTicket is
    Ownable,
    INonTransferableTicket,
    INonTransferableTicketMetadata
{
    using Address for address;
    using Strings for uint256;

    string private _name;
    address private _issuer;

    uint256 private _ticketsAdded;
    uint256 private _ticketsDelivered;
    uint256 private _ticketsRedeemed;
    string private _baseTicketURI;
    mapping(address => uint256) private _quantityHeldBy;
    mapping(uint256 => address) private _holderOf;
    mapping(uint256 => bool) private _wasRedeemed;
    mapping(uint256 => bool) private _isRedeemable;

    // TODO: Should there be an event for each individual ticket added?
    event TicketsAdded(uint256 indexed amount);
    event Redeemable(address indexed redeemer, uint256 indexed ticketId);

    constructor(string memory name_, address issuer_) {
        _name = name_;
        _issuer = issuer_;
    }

    /**
     * @dev See {INonTransferableTicketMetadata-name}.
     */
    function name() external view override returns (string memory) {
        return _name;
    }

    /**
     * @dev See {INonTransferableTicketMetadata-issuer}.
     */
    function issuer() external view override returns (address) {
        return _issuer;
    }

    /**
     * @dev See {INonTransferableTicketMetadata-ticketURI}.
     */
    function ticketURI(uint256 ticketId) external view override returns (string memory) {
        require(_exists(ticketId), "NTT: Ticket does not exist");
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, ticketId.toString())) : "";
    }

    /**
     * @dev See {INonTransferableTicket-totalRemaining}.
     */
    function totalRemaining() external view override returns (uint256) {
        // TODO: Does the built-in safeMath revert if this is negative?
        return _ticketsAdded - _ticketsDelivered;
    }

    /**
     * @dev See {INonTransferableTicket-quantityHeldBy}.
     */
    function quantityHeldBy(address holder) external view override returns (uint256) {
        return _quantityHeldBy[holder];
    }

    /**
     * @dev See {INonTransferableTicket-holderOf}.
     */
    function holderOf(uint256 ticketId) external view override returns (address) {
        return _holderOf[ticketId];
    }

    function canRedeem(address account, uint256 ticketId) external view returns(bool) {
        return _canRedeem(account, ticketId);
    }

    function addTickets(uint256 amount) public onlyOwner returns (bool) {
        _ticketsAdded += amount;
        // TODO: Should we emit an event with each ticket id here?
        emit TicketsAdded(amount);
        return true;
    }

    function deliver(address holder, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < amount; i++) {
            uint256 ticketId = _ticketsDelivered + i + 1;
            assert(_exists(ticketId));
            _holderOf[ticketId] = holder;
        }
        _ticketsDelivered += amount;
        _quantityHeldBy[holder] += amount;
    }

    function setRedeemable(uint256 ticketId) public onlyOwner {
        _isRedeemable[ticketId] = true;
        emit Redeemable(_msgSender(), ticketId);
    }

    /**
     * @dev See {INonTransferableTicket-redeem}.
     */
    function redeem(uint256 ticketId) public override returns (bool) {
        require(!_wasRedeemed[ticketId], "NTT: Can not be redeemed");
        require(_isRedeemable[ticketId], "NTT: Can not be redeemed");
        require(_canRedeem(_msgSender(), ticketId), "NTT: Can not redeem");
        _wasRedeemed[ticketId] = true;
        _isRedeemable[ticketId] = false;
        emit Redemption(_msgSender(), ticketId);
        return true;
    }

    function _exists(uint256 ticketId) internal view returns (bool) {
        return ticketId <= _ticketsAdded;
    }

    /**
     * @dev Base URI for computing {ticketURI}. If set, the resulting URI for each
     * ticket will be the concatenation of the `baseURI` and the `ticketId`. Empty
     * by default, can be overriden in child contracts.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return _baseTicketURI;
    }

    // function _canRedeem(address account, uint256 ticketId) internal view returns (bool) {
    //     if (_wasRedeemed[ticketId]) {
    //         return false;
    //     } else if (_isRedeemable[ticketId]) {
    //         return false;
    //     } else {
    //         return (account == _holderOf[ticketId]) || (account == owner());
    //     }
    // }

    function _canRedeem(address account, uint256 ticketId) internal view returns (bool) {
        return (account == _holderOf[ticketId]) || (account == owner());
    }
}
