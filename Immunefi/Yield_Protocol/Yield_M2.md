## Bug
- Malicious Bob is able to dramatically increase the gas usage, when `NotionalJoin::exit()` is invoked by auth account.


## Target
- https://github.com/yieldprotocol/yieldspace-tv

## Bug Description
- In `[NotionalJoin.sol]`, there is a function `exit(address, uint128)` which might be used for transferring ERC1155 compatible assets from `address(this)` to user. If the transfer happens before the maturity, it invokes internal `_exit(address, uint128)` in order to handle the logic.
- Let's explore that a little bit:
    - ```Solidity
        function _exit(address user, uint128 amount) internal returns (uint128) {
            storedBalance -= amount;
            ERC1155(asset).safeTransferFrom(address(this), user, fCashId, amount, "");
            return amount;
        }
        ```
- The line which we're interested in is the following one:
  - `ERC1155(asset).safeTransferFrom(address(this), user, fCashId, amount, "");`
- The implementation of `safeTransferFrom(address, address, uint, uint, bytes)` from solmate lib that's being used is the following: https://github.com/yieldprotocol/vault-v2/blob/master/packages/foundry/contracts/other/notional/ERC1155.sol#L55-L76
- As you can see on the line https://github.com/yieldprotocol/vault-v2/blob/master/packages/foundry/contracts/other/notional/ERC1155.sol#L72, we're trying to invoke `ERC1155TokenReceiver(to).onERC1155Received()` if to is not EOA. It turns out that the user who is about to receive some tokens can deliberately put some random logic into his`onERC1155Received()` hook to drain gas for the `tx.origin` which is auth account. The user actually can drain the gas up to the hard limit per block or a little bit less to prevent any reverts.

## Impact
- Griefing (e.g. no profit motive for an attacker, but damage to the users or the protocol)
- Theft of gas
- Unbounded gas consumption
  
## Recommendation
- Use good old-fashioned `transferFrom()`, when such griefs might happen. But I totally understand the motivation behind explicitly checking whether the receiver is able to handle tokens or not.

## Proof of Concept
- PoC is pretty simple here:
  - Someone who is responsible for invoking `Notional.sol::exit(address, uint128)` calls exit after maturity by specifying non EOA recipient. And that recipient might put redundant logic in his `onERC1155Received()` with an intention to drain the gas seeing "Unbounded gas consumption".