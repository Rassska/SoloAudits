## Bug
- `permit()` may trigger `deposit()` though a `fallback()` for tokens that are not compliant with **ERC2612**

## Target
- https://github.com/yieldprotocol/vault-v2

## Bug Description
- In Ladle.sol there is a function `forwardPermit()`, which triggers `IERC2616(token).permit()` allowing an off-chain secure signature to be used to register an allowance. However, something interesting happens, for tokens that:

  - first: do not implement `permit()`
  - second: have a (non-reverting) `fallback()`
  
- Turns out that WETH9, which passes the `require(tokens[address(token)], "Unknown token");` is compliant with conditions above. And the user who tries to permit on such tokens will end up depositing some funds under a Ladle .sol contract instead of getting an approval to spend some beneficiaries tokens.

## Impact
- It's definitely an undesirable behavior and the SC will not provide a promised value. Anyways, I didn't see major threats to users/protocol from that.
  
## Recommendation
- Haven't really come up with robust solution yet, but we can discuss on it.

## References
- Check out similar case which happens with Multichain: https://media.dedaub.com/phantom-functions-and-the-billion-dollar-no-op-c56f062ae49f

## Proof of Concept
- PoC is pretty simple here:
    - Bob invokes forwardPermit() by passing an off-chainly generated EC point and other args. However, instead of getting an approval from beneficiary, he calls into WETH9 deposit().