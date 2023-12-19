## Bug
- White Holder allows to claim infinity amount of IDNFTs for a whitelisted user.


## Target
- https://github.com/MultichainDAO/SBT-contracts

## Bug Description
### General Breakdown
- The main idea here is to use an opportunity which gives us `WhiteHolder.sol::connect()`. Basically, when we invoke `IDNFTController.sol::claim()`, we can pass MultiDAO whitelisted address as an `accountType`.
  - Then the function above will simply try to pass some data into our `WhiteHolder.sol::connect()`:
    - ```Solidity
        res = IDIDAdaptor(dIDAdaptor[accountType]).connect(
            tokenId,
            msg.sender,
            accountType,
            sign_info
        );

  - In `WhiteHolder.sol::connect()` we ensure that the `idcardOf[claimer] == 0` or `IDCard(idcard).exists(idcardOf[claimer])`
     - ```Solidity
        if (
            idcardOf[claimer] != 0 &&
            IDCard(idcard).exists(idcardOf[claimer])
        ) {
            return false;
        }
  - Then we try to verify the claimer being as a leaf node in our Merkle tree. If everything here is great, the `idcardOf[claimer] = tokenId`.

### What is the problem then?
- Seems that everything is flawless so far. However, the malicious white holder claimer can simply:
  - claim that nft
  - disconnect it and transfer to third-party
  - claim new nft for whiteholders.
  
- Why the third step is valid?
  - Since after verifying inclusion proof we didn't somehow marked the proof as being used and the proof itself does not contain any information that makes the proof reusable(eg. nonce), it's possible to pass it again and mint a new nft.
  - Also, these checks are passed `idcardOf[claimer] != 0 && IDCard(idcard).exists(idcardOf[claimer])` since we disconnected and transfered to third-party our first nft.

- It actually doesn't contain the `chainID` where the transfer is expected to be executed. It gives an opportunity for a receiver to initiate `transferWithPermit()` on other chains as well under a certain circumstances:
  - The target balance should be >= amount on non-primary chain
  - Primary chain nonce of the target should be equal to the nonce of the target on non-primary chain.

## Impact
- The Impact is definitely on a high level.
  
## Recommendation
- Design a mechanism that will prevent the sign_info from reusing. The good solution is including nonces.

## References
- Good post about Merkle Tree pitfalls: https://mirror.xyz/haruxe.eth/Gg7UG4hctOHyteVeRX7w1Ac9m1gAoCs8uuiWx3WwVz4

## Proof of Concept
- PoC is pretty simple here:
    - The whitelisted user can claim his nft for whiteholders.
    - Then he transfers it to thrid-party address
    - The whitelisted user claims nft again using the same sign_info.