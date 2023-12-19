## Bug
- Jailed Validator can claim fees during reward distribution process


## Target
- https://github.com/maticnetwork/pos-portal

## Bug Description
- `StakeManager.sol` allows for validators to withdraw fees from heimdall. Kind of reward distribution process. Now, imagine the case, when certain validator was banned for his malicious actions(e.g. `validators[validatorId].status == Status.Locked`), however he's still able to claim fees(probably his last fees), since the merkleProof hasn't been recomputed, hence he's still in a tree as a leaf-node.
  
## Impact
- Logic error(it's not actually, but since there is an opportunity for jailed validators to claim rewards, something is not clear)
  
## Recommendation
- Just add a safety check to prevent jailed validators from claiming fees:
  - ```Solidity
    validators[msg.sender].status != Status.Locked
    ```