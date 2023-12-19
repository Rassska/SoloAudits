## Bug
- Due to the gas usage limit for `.transfer()` and `.send()` , the `.transfer()` will be reverted, if the `msg.sender` is not an EOA.


## Target
- https://optimistic.etherscan.io/address/0xa3DB2c0D23720e8CDA0f4d80A53B94d20d02b061

## Bug Description
- In `DCAHubCompanionWTokenPositionHandler.sol` there is a function, where `_recipient.transfer(_amount)` is invoked. However `.transfer()` `.send()` calls are limited in terms of the gas usage. The limit is ~2300 units.
- So, what does it mean for us? It means that if the `_recipient` is not an EOA(Externally owned account) this `.transfer()` will end up with failure, because the gas provided is not enough to enter `fallback()` function in `_recipient's` contract. Therefore, the user is not able to somehow withdraw his funds.
  
    - ```Solidity
        function _unwrapAndSend(uint256 _amount, address payable _recipient) internal {
            if (_amount > 0) {
                // Unwrap wToken
                wToken.withdraw(_amount);

                // Send protocol token to recipient
                _recipient.transfer(_amount);
            }
        }
- This internal function could be invoked from:
  - ```Solidity
        function withdrawSwappedManyUsingProtocolToken(uint256[] calldata _positionIds, address payable _recipient)
            external
            payable
            returns (uint256 _swapped)
        {
            for (uint256 i; i < _positionIds.length; i++) {
                _checkPermissionOrFail(_positionIds[i], IDCAPermissionManager.Permission.WITHDRAW);
            }
            IDCAHub.PositionSet[] memory _positionSets = new IDCAHub.PositionSet[](1);
            _positionSets[0].token = address(wToken);
            _positionSets[0].positionIds = _positionIds;
            uint256[] memory _withdrawn = hub.withdrawSwappedMany(_positionSets, address(this));
            _swapped = _withdrawn[0];
            _unwrapAndSend(_swapped, _recipient);
        }
    ```

    - ```Solidity
        function increasePositionUsingProtocolToken(
            uint256 _positionId,
            uint256 _amount,
            uint32 _newSwaps
        ) external payable checkPermission(_positionId, IDCAPermissionManager.Permission.INCREASE) {
            _wrap(_amount);
            hub.increasePosition(_positionId, _amount, _newSwaps);
        }

            /// @inheritdoc IDCAHubCompanionWTokenPositionHandler
        function reducePositionUsingProtocolToken(
            uint256 _positionId,
            uint256 _amount,
            uint32 _newSwaps,
            address payable _recipient
        ) external payable checkPermission(_positionId, IDCAPermissionManager.Permission.REDUCE) {
            hub.reducePosition(_positionId, _amount, _newSwaps, address(this));
            _unwrapAndSend(_amount, _recipient);
        }


## Impact
- Smart-contract freezes the user's funds. 
  
## Recommendation
- Personal recommendation is to use `.call()` or the library Address.sol from OZ to send funds, which uses the `.call()` under the hood.

## References
- Check out [this, where new EIP was proposed in order to increase the gas limit for .transfer() .send()](https://github.com/ethereum/solidity/issues/4630#event-1764469844).
- And [this to read more about it](https://ethereum.stackexchange.com/questions/28759/transfer-to-contract-fails)