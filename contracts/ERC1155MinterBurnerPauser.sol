// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "./@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "./@openzeppelin/contracts/utils/Context.sol";
import "./SimpleAccessControl.sol";

/**
 * @title ERC1155MinterBurnerPauser
 * @author stickykeys.eth
 * @custom:version 1.0.0
 * @notice Implementation of a standard multi-token with minting, burning, and pausing.
 * @dev This contract is a derivative of OpenZeppelin's {ERC1155PresetMinterPauser}.
 * It uses simplified access control to keep gas low.
 */
contract ERC1155MinterBurnerPauser is Context, SimpleAccessControl, ERC1155Burnable, ERC1155Pausable {

    /**
     * @notice Deploys an fungible and non-fungible token contract with metadata
     * stored at `uri`.
     * @dev Uses {SimpleAccessControl} and assigns deployer account to `admin`.
     * @dev See {IERC1155MetadataURI-uri}.
     * @param uri URI format for token metadata.
     */
    constructor(string memory uri) ERC1155(uri) {
        _setupAccessControl();
    }

    /**
     * @notice Mints new tokens of same id.
     * @dev Creates `amount` new tokens for `to`, of token type `id`.
     * @dev See {ERC1155-_mint}.
     * @custom:require Caller must be authorized.
     * @param to Account to give minted tokens to.
     * @param id Id of tokens to mint.
     * @param amount Amount of tokens to mint.
     * @param data Extra data to attribute to the mint transaction.
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual onlyAuthorized {
        _mint(to, id, amount, data);
    }

    /**
     * @notice Mints many new tokens of different ids.
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] variant of {mint}.
     * @custom:require Caller must be authorized.
     * @param to Account to give minted tokens to.
     * @param ids Ids of tokens to mint.
     * @param amounts Amount of each token id to mint. Order matters.
     * @param data Extra data to attribute to the mint transaction.
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual onlyAuthorized {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @notice Pauses all token transfers.
     * @dev See {ERC1155Pausable} and {Pausable-_pause}.
     * @custom:require Caller must be authorized.
     */
    function pause() public virtual onlyAuthorized {
        _pause();
    }

    /**
     * @notice Unpauses all token transfers.
     * @dev See {ERC1155Pausable} and {Pausable-_unpause}.
     * @custom:require Caller must be authorized.
     */
    function unpause() public virtual onlyAuthorized {
        _unpause();
    }

    /**
     * @notice Returns true if `interfaceId` is supported by this contract.
     * @dev See {IERC165-supportsInterface}.
     * ```
     * type(InterfaceContract).interfaceId
     * ```
     * @param interfaceId 4 bytes representing the interface id.
     * @return True or false
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Pausable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
