// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/security/PullPayment.sol";
import "./IVersion.sol";

/**
 * @title PullPaymentSplitter
 * @author stickykeys.eth
 * @notice Implementation of a "pull payment" that splits deposits amongst a
 * trusted list of accounts.
 * @dev This contract is a derivative of OpenZeppelin's {PullPayment}. It
 * deploys an {Escrow} contract where funds get stored.
 *
 * @custom:warning Avoid reentrancy vulnerabilities.
 *
 */
contract PullPaymentSplitter is Context, PullPayment {
    uint256 private _recipients;

    mapping(uint256 => address) private _recipientsById;
    mapping(uint256 => uint256) private _percentagesById;
    mapping(address => uint256) public changeByRecipient;

    /**
     * @notice Deploys an {Escrow} contract and sets recipients and the
     * percentage of each deposit allocated to them.
     * @dev {_setupPayments} is only used once--here upon deployment.
     * @param recipients Accounts to receive percentage of deposits.
     * @param percentages Percentage of deposit each account should receive.
     * Order matters.
     */
    constructor(address[] memory recipients, uint256[] memory percentages) {
        _setupRecipients(recipients, percentages);
    }

    function version() external pure virtual returns (string memory) {
        return "1.0.0";
    }

    /**
     * @notice Allocates Ether sent with this call to the contract recipients.
     * @dev Solidity rounds towards zero so we accumulate change here to be
     * transferred later.
     * @custom:require Message value must be greater than 0.
     */
    function deposit() external payable {
        require(
            msg.value > 0,
            "PullPaymentSplitter: Not enough Ether provided"
        );
        for (uint256 i = 0; i < _recipients; i++) {
            uint256 amount = (msg.value * _percentagesById[i]) / 100;
            uint256 change = (msg.value * _percentagesById[i]) % 100;
            _asyncTransfer(_recipientsById[i], amount);
            changeByRecipient[_recipientsById[i]] += change;
        }
    }

    /**
     * @notice Enables change accumulated for the recipient to be withdrawn.
     * @dev Once at least 100 change has been accumulated, this method
     * calculates and assigns change again, then transfers the remaining amount
     * to the underlying Escrow contract from which it can be withdrawn.
     *
     * @custom:warning Avoid reentrancy vulnerabilities.
     * @param recipient Account address of recipient to transfer change for.
     */
    function transferChange(address recipient) external {
        uint256 change = changeByRecipient[recipient];
        require(
            change >= 100,
            "PullPaymentSplitter: Not enough change to transfer"
        );
        changeByRecipient[recipient] = change % 100;
        _asyncTransfer(recipient, change / 100);
    }

    /**
     * @dev Sets mappings for recipients and respective percentages.
     * This method is only used once in the constructor. Recipients and
     * percentages can not be modified after deployment.
     * @custom:require Input lengths must be equal. Order matters.
     * @custom:require Each percentage must be above 0 and below 100.
     * @custom:require The sum of all percentages must be 100.
     *
     * @custom:warning Recipient accounts should be trusted.
     *
     * @param recipients Account addresses receiving a split of deposited funds.
     * @param percentages Amounts for accounts at the same index in the
     * {recipients} parameter to allocate from deposited funds.
     */
    function _setupRecipients(
        address[] memory recipients,
        uint256[] memory percentages
    ) internal {
        require(
            recipients.length == percentages.length,
            "PullPaymentSplitter: Input lengths must match"
        );
        uint256 sum = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                percentages[i] > 0,
                "PullPaymentSplitter: Percentage must exceed 0"
            );
            require(
                percentages[i] <= 100,
                "PullPaymentSplitter: Percentage must not exceed 100"
            );
            sum += percentages[i];
            _recipients += 1;
            _recipientsById[i] = recipients[i];
            _percentagesById[i] = percentages[i];
        }
        require(sum == 100, "PullPaymentSplitter: Percentages must sum to 100");
    }
}
 