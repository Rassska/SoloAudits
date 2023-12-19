## Bug
- Lack of chainID in `transferWithPermit()::hashStruct` leads to spending funds on other chains as well using the same signature


## Target
- https://github.com/anyswap/anyswap-v1-core

## Bug Description
- In a `contracts/AnyswapV5ERC20.sol` (which is used to provide an opportunity for developers to deploy their tokens compatible with the bridge) there is a function `transferWithPermit()` in order transfer funds by providing off-chain signature.

- Let's look at the members in hashStruct:
    - ```Solidity
        bytes32 hashStruct = keccak256(
            abi.encode(
                TRANSFER_TYPEHASH,
                target,
                to,
                value,
                nonces[target]++,
                deadline));
- It actually doesn't contain the `chainID` where the transfer is expected to be executed. It gives an opportunity for a receiver to initiate `transferWithPermit()` on other chains as well under a certain circumstances:
  - The target balance should be >= amount on non-primary chain
  - Primary chain nonce of the target should be equal to the nonce of the target on non-primary chain.

## Impact
- Loss of user's funds.
  
## Recommendation
- it's mandatory to include chainID in hashStruct in order to make the signature unique across all chains.

## References
- See the https://eips.ethereum.org/EIPS/eip-712

## Proof of Concept
- PoC is pretty simple here:

  - Bob prepares an off-chain signature for Alice to spend his tokens on chain A.
  - Alice uses that signature to receive some tokens on chain A.
    - After that, Alice spotted that Bob has the same tokens on chain B. And the balance of Bob is more than amount included in signature. Since it was Bob's first transferWithPermit() his nonce is 0 on every chain. Therefore, Alice performs another transfer on chain B.

  - Alice also could initiate those transfers on other chains as well if the conditions are met.