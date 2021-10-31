// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/access/Ownable.sol";
import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./@openzeppelin/contracts/utils/Address.sol";
import "./@openzeppelin/contracts/utils/Context.sol";
import "./@openzeppelin/contracts/utils/Strings.sol";
import "./TokenGate.sol";

contract TestERC20Token is ERC20 {
    constructor() ERC20("TestToken", "TEST") {
        return;
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TestERC721Token is ERC721 {
    uint256 private _totalSupply = 0;
    constructor() ERC721("TestToken", "TEST") {
        return;
    }
    function mint(address to, uint256 amount) external {
        for (uint256 index = 0; index < amount; index++) {
            uint256 tokenId = _totalSupply;
            _safeMint(to, tokenId);
            _totalSupply += 1;
        }
    }
}

contract TokenGateTest is Context, Ownable, TokenGate {
    using Address for address;
    using Strings for uint256;

    address private _manager;

    event Result(bool);

    modifier onlyAuthorized() {
        require(
            checkAuthorized(_msgSender()),
            "TokenGateTest: Unauthorized"
        );
        _;
    }

    modifier holdsToken(address token, uint256 minimumBalance) {
        require(
            checkTokenHolder(_msgSender(), token, minimumBalance),
            "TokenGateTest: Caller does not hold enough of the token"
        );
        _;
    }

    constructor(address[] memory gatingTokens, uint256[] memory gatingERCs) {
        for (uint256 index = 0; index < gatingTokens.length; index++) {
            _registerToken(gatingTokens[index], gatingERCs[index]);
        }
    }

    // Example implementations

    function tokenHoldersCanCall(
        address token
    ) external holdsToken(token, 1) {
        emit Result(true);
    }

    function tokenHoldersWithMinimumBalanceCanCall(
        address token
    ) external holdsToken(token, 100_000_000_000) {
        emit Result(true);
    }

    // Examples of privileged methods

    function registerToken(
        address token,
        uint256 erc
    ) external onlyAuthorized {
        _registerToken(token, erc);
    }

    function unregisterToken(address token) external onlyAuthorized {
        _unregisterToken(token);
    }

    // Helpers

    function checkAuthorized(address account) public view returns (bool) {
        return owner() == account || _manager == account;
    }
}
