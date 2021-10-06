// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import "./hardhat/console.sol";
import "./@openzeppelin/contracts/access/Ownable.sol";
import "./@openzeppelin/contracts/utils/Address.sol";
import "./IVersion.sol";

/**
 * @title PushPaymentDivider
 * @author stickykeys.eth
 * @notice Divides deposits amongst a trusted set of accounts.
 *
 * @custom:warning
 * ===============
 * Recipients MUST be trusted. If not, use {PullPaymentDivider} instead to
 * better avoid reentrancy vulnerabilities.
 *
 * @dev This contract handles payments by restricting write access to the
 * contract that instatiates it. This way, it is guaranteed that all Ether will
 * be handled according to the {PushPaymentDivider} rules, and there is no need
 * to check for payable functions or transfers in the inheritance tree. The
 * contract that uses the this to handle payments should be its owner, and
 * provide public methods redirecting to the deposit.
 */
contract PushPaymentDivider is Ownable {
    using Address for address payable;

    uint256 private _recipients;
    mapping(uint256 => address payable) private _recipientsById;
    mapping(address => uint256) private _percentagesByRecipient;
    mapping(address => uint256) private _changeByRecipient;

    /**
     * @notice Sets recipients and the percentage of each deposit sent to them.
     * @dev {_setupRecipients} is only used once--here, upon deployment.
     * @param recipients Accounts to receive percentage of deposits.
     * @param percentages Percentage of deposit each account should receive.
     * Order matters.
     */
    constructor(
        address payable[] memory recipients,
        uint256[] memory percentages
    ) {
        _setupRecipients(recipients, percentages);
    }

    function version() external pure virtual returns (string memory) {
        return "1.0.0";
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
     * @notice Returns the amount of change the recipient has accumulated.
     * @param recipient Ethereum account address.
     * @return Fraction of wei as an amount out of 100.
     */
    function accumulatedChange(
        address recipient
    ) public view returns (uint256) {
        return _changeByRecipient[recipient];
    }

    /**
     * @notice Transfers to each recipient their designated percenatage of the
     * Ether sent with this call.
     * @custom:require Caller must be owner.
     * @custom:require Message value must be greater than 0.
     * @dev Solidity rounds towards zero so we accumulate change here to be
     * transferred once it exceeds a fractional amount of wei.
     *
     * @custom:warning
     * ===============
     * Forwarding all gas opens the door to reentrancy vulnerabilities. Make
     * sure you trust the recipient, or are either following the
     * checks-effects-interactions pattern or using {ReentrancyGuard}.
     */
    function deposit() public payable virtual onlyOwner {
        require(
            msg.value > 0,
            "PushPaymentDivider: Not enough Ether provided"
        );
        for (uint256 i = 0; i < _recipients; i++) {
            address payable recipient = _recipientsById[i];
            uint256 change = (msg.value * _percentagesByRecipient[recipient]) % 100;
            uint256 amount = (msg.value * _percentagesByRecipient[recipient]) / 100;
            uint256 totalChange = _changeByRecipient[recipient] + change;
            _changeByRecipient[recipient] = totalChange;
            if (totalChange >= 100) {
                _changeByRecipient[recipient] = totalChange % 100;
                amount += (totalChange / 100);
            }
            recipient.sendValue(amount);
        }
    }

    /**
     * @dev Sets mappings for recipients and respective percentages.
     * This method is only used once in the constructor. Recipients and
     * percentages can not be modified after deployment.
     * @custom:require Input lengths must be equal. Order matters.
     * @custom:require Each percentage must be above 0 and below 100.
     * @custom:require The sum of all percentages must be 100.
     * @param recipients Account addresses receiving a percentage of deposited
     * funds.
     * @param percentages Amounts for accounts at the same index in the
     * {recipients} parameter to allocate from deposited funds.
     *
     * @custom:warning
     * ===============
     * Recipient accounts should be trusted.
     */
    function _setupRecipients(
        address payable[] memory recipients,
        uint256[] memory percentages
    ) internal {
        require(
            recipients.length == percentages.length,
            "PushPaymentDivider: Input lengths must match"
        );
        uint256 sum = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                percentages[i] > 0,
                "PushPaymentDivider: Percentage must exceed 0"
            );
            require(
                percentages[i] <= 100,
                "PushPaymentDivider: Percentage must not exceed 100"
            );
            sum += percentages[i];
            _recipients += 1;
            _recipientsById[i] = recipients[i];
            _percentagesByRecipient[_recipientsById[i]] = percentages[i];
        }
        require(sum == 100, "PushPaymentDivider: Percentages must sum to 100");
    }
}
 