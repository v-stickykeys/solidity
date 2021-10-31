// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./@openzeppelin/contracts/utils/Address.sol";
import "./@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./@openzeppelin/contracts/utils/Strings.sol";

abstract contract TokenGate {
    using Address for address;
    using EnumerableSet for EnumerableSet.AddressSet;
    using Strings for uint256;

    EnumerableSet.AddressSet private _tokens;
    mapping(address => uint256) private _ercByToken;

    function getTokenCount() public view returns (uint256) {
        return _tokens.length();
    }

    function getTokenAtIndex(
        uint256 index
    ) public view returns (address) {
        return _tokens.at(index);
    }

    function checkTokenRegistered(address token) public view returns (bool) {
        return _tokens.contains(token);
    }

    function checkTokenHolder(
        address account,
        address token,
        uint256 minimumBalance
    ) public virtual returns (bool) {
        require(checkTokenRegistered(token), "TokenGate: Token not registered");
        uint256 erc = getERCOfToken(token);
        if (erc == 20) {
            return ERC20(token).balanceOf(account) > minimumBalance;
        } else if (erc == 721) {
            return ERC721(token).balanceOf(account) > minimumBalance;
        } else {
            return false;
        }
    }

    function getERCOfToken(address token) public view returns (uint256) {
        return _ercByToken[token];
    }

    function _registerToken(
        address token,
        uint256 erc
    ) internal virtual {
        _tokens.add(token);
        _ercByToken[token] = erc;
    }

    function _unregisterToken(address token) internal virtual {
        _tokens.remove(token);
        delete _ercByToken[token];
    }
}
