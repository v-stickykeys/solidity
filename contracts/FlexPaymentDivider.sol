// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import "./hardhat/console.sol";
import "./@openzeppelin/contracts/access/Ownable.sol";
import "./@openzeppelin/contracts/utils/Address.sol";
import "./IVersion.sol";

/**
 * @title FlexPaymentDivider
 * @author stickykeys.eth
 * @notice Divides deposits amongst a trusted set of accounts.
 *
 * @custom:warning
 * ===============
 * Recipients MUST be trusted. If not, use {PullPaymentDivider} instead to
 * better avoid reentrancy and denial of service vulnerabilities.
 *
 * @dev This contract handles payments by restricting write access to the
 * contract that instatiates it. This way, it is guaranteed that all Ether will
 * be handled according to the {FlexPaymentDivider} rules, and there is no need
 * to check for payable functions or transfers in the inheritance tree. The
 * contract that uses the this to handle payments should be its owner, and
 * provide public methods redirecting to the deposit.
 * @dev This contract is named "Flex" because it can be used in a "Push" or
 * "Pull" method to send funds.
 */
contract FlexPaymentDivider is Ownable, IVersion {
    using Address for address payable;

    uint256 private _recipientCount;
    mapping(uint256 => address payable) private _recipientsById;
    mapping(address => uint256) private _percentagesByRecipient;
    mapping(address => uint256) private _balancesByRecipient;
    mapping(address => uint256) private _changeByRecipient;
    // 0 = false, 1 = true
    mapping(address => uint8) private _isWithdrawingByAccount;

    /**
     * @notice Sets recipients and the percentage of each deposit sent to them.
     * @dev {_setupRecipients} is only used once--here, upon deployment.
     * @param recipients_ Accounts to receive percentage of deposits.
     * @param percentages_ Percentage of deposit each account should receive.
     * Order matters.
     */
    constructor(
        address payable[] memory recipients_,
        uint256[] memory percentages_
    ) {
        _setupRecipients(recipients_, percentages_);
    }

    function version() external pure override returns (string memory) {
        return "1.0.0";
    }

    /**
     * @notice Returns the number of recipients each deposit is divided by.
     * @return Number of recipients.
     */
    function recipientCount() public view returns (uint256) {
        return _recipientCount;
    }

    /**
     * @notice Returns recipient with the given id.
     * @param id Integer.
     * @return Ethereum account address.
     */
    function recipientById(uint256 id) public view returns (address) {
        return _recipientsById[id];
    }

    /**
     * @notice Returns the percentage of each deposit the recipient receives.
     * @param recipient Ethereum account address.
     * @return Amount of 100.
     */
    function percentage(address recipient) public view returns (uint256) {
        return _percentagesByRecipient[recipient];
    }

    /**
     * @notice Returns the balance the recipient has accumulated.
     * @param recipient Ethereum account address.
     * @return Amount of wei.
     */
    function accumulatedBalance(address recipient) public view returns (uint256) {
        return _balancesByRecipient[recipient];
    }

    /**
     * @notice Returns the amount of change the recipient has accumulated.
     * @param recipient Ethereum account address.
     * @return Fraction of wei as an amount out of 100.
     */
    function accumulatedChange(address recipient) public view returns (uint256) {
        return _changeByRecipient[recipient];
    }

    /**
     * @notice Increases balance for each recipient by their designated
     * percenatage of the Ether sent with this call.
     * @custom:require Caller must be owner.
     * @custom:require Message value must be greater than 0.
     * @dev Solidity rounds towards zero so we accumulate change here that is
     * transferred once it exceeds a fractional amount of wei.
     *
     * @custom:warning
     * ===============
     * Forwarding all gas opens the door to reentrancy vulnerabilities. Make
     * sure you trust the recipient, or are either following the
     * checks-effects-interactions pattern or using {ReentrancyGuard}.
     */
    function deposit() public payable onlyOwner {
        require(
            msg.value > 0,
            "FlexPaymentDivider: Insufficient message value"
        );
        for (uint256 i = 0; i < _recipientCount; i++) {
            address payable recipient = _recipientsById[i];
            uint256 change = (msg.value * _percentagesByRecipient[recipient]) % 100;
            uint256 amount = (msg.value * _percentagesByRecipient[recipient]) / 100;
            uint256 totalChange = _changeByRecipient[recipient] + change;
            _changeByRecipient[recipient] = totalChange;
            if (totalChange >= 100) {
                _changeByRecipient[recipient] = totalChange % 100;
                amount += (totalChange / 100);
            }
            _balancesByRecipient[recipient] += amount;
        }
    }

    /**
     * @notice Transfers to each recipient their designated percenatage of the
     * Ether held by this contract.
     * @custom:require Caller must be owner.
     *
     * @custom:warning
     * ===============
     * A denial of service attack is possible if any of the recipients revert.
     * The {withdraw} method can be used in the event of this attack.
     *
     * @custom:warning
     * ===============
     * Forwarding all gas opens the door to reentrancy vulnerabilities. Make
     * sure you trust the recipient, or are either following the
     * checks-effects-interactions pattern or using {ReentrancyGuard}.
     */
    function disperse() public onlyOwner {
        for (uint256 i = 0; i < _recipientCount; i++) {
            address payable recipient = _recipientsById[i];
            withdraw(recipient);
        }
    }

    /**
     * @notice Transfers to recipient their designated percentage of the Ether
     * held in this contract.
     * @custom:require Caller must not already be withdrawing.
     * @custom:require Balance to withdraw must be above 0.
     *
     * @custom:warning
     * ===============
     * Forwarding all gas opens the door to reentrancy vulnerabilities. Make
     * sure you trust the recipient, or are either following the
     * checks-effects-interactions pattern or using {ReentrancyGuard}.
     */
    function withdraw(address payable recipient) public onlyOwner {
        require(
            !isWithdrawing(_msgSender()),
            "FlexPaymentDivider: Can not reenter"
        );
        _isWithdrawingByAccount[_msgSender()] = 1;

        uint256 amount = _balancesByRecipient[recipient];
        // IMPORTANT: Do not revert here so `disperse` can not have DoS when a
        // recipient does not yet have a balance to withdraw.
        if (amount > 0) {
            _balancesByRecipient[recipient] = 0;
            recipient.sendValue(amount);
        }

        _isWithdrawingByAccount[_msgSender()] = 0;
    }

    /* INTERNAL */

    /**
     * @dev Sets mappings for recipients and respective percentages.
     * This method is only used once in the constructor. Recipients and
     * percentages can not be modified after deployment.
     * @custom:require Input lengths must be equal. Order matters.
     * @custom:require Each percentage must be above 0 and below 100.
     * @custom:require The sum of all percentages must be 100.
     * @param recipients_ Account addresses receiving a percentage of deposited
     * funds.
     * @param percentages_ Amounts for accounts at the same index in the
     * {recipients} parameter to allocate from deposited funds.
     *
     * @custom:warning
     * ===============
     * Recipient accounts should be trusted.
     */
    function _setupRecipients(
        address payable[] memory recipients_,
        uint256[] memory percentages_
    ) internal {
        require(
            recipients_.length == percentages_.length,
            "FlexPaymentDivider: Unequal input lengths"
        );
        uint256 sum = 0;
        for (uint256 i = 0; i < recipients_.length; i++) {
            require(
                percentages_[i] > 0,
                "FlexPaymentDivider: Percentage must exceed 0"
            );
            require(
                percentages_[i] <= 100,
                "FlexPaymentDivider: Percentage must not exceed 100"
            );
            sum += percentages_[i];
            _recipientCount += 1;
            _recipientsById[i] = recipients_[i];
            _percentagesByRecipient[_recipientsById[i]] = percentages_[i];
        }
        require(sum == 100, "FlexPaymentDivider: Percentages must sum to 100");
    }

    function isWithdrawing(address account) internal view returns (bool) {
        return _isWithdrawingByAccount[account] == 1;
    }
}
 