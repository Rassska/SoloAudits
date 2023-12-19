## Bug
- `ecrecover()` returns `address(0)`, when sig doesn't belong to signatory


## Target
- https://github.com/wormhole-foundation/wormhole/tree/dev.v2/ethereum

## Bug Description
- I've spent a lot of time on finding the way to forge signatures due to the lack of `address(0)` check after `verifySignatures()::ecrecover()`, but didn't successed, since there is no a way to manipulate with guardians. If we had an opportunity to include `guardians.keys` along with signatures in calldata, we simply could pass zero addresses along with some random signatures and `ecrecover()` will return `address(0)` and the check performed here would be easily bypassed: `if(ecrecover(hash, sig.v, sig.r, sig.s) != guardianSet.keys[sig.guardianIndex])`
  
- Well, this report is about preventing such possibilities(in the future) by simply adding the check against signatory being `address(0)`.

## Impact
- Bugs that are likely to occur in future stages of development but do not manifest themselves yet
  
## Recommendation
- Recommend to add extra safety checks:
  - ```Solidity
        if (ecrecover(hash, sig.v, sig.r, sig.s) != guardianSet.keys[sig.guardianIndex] && ecrecover(hash, sig.v, sig.r, sig.s) == address(0) ){ 
            return (false, "VM signature invalid");
        }
    ```
## Status
- Fixed in the following PR:
  - Merged: https://github.com/wormhole-foundation/wormhole/pull/2021