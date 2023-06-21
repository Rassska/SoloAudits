# Adversory could spam the lane by submiting txs with insufficient `gasLimit` in order to prevent the batch from finilazing


## Vulnerability Details

- After the root has been blessed by ARM, Executing DON collect all messages and submits a batch to the offramp in order to finilize it. In order to submit a report, Executing DON nodes could use the following entry point: `_report(bytes calldata)`. After a neccessary storage changes, each message should be executed separately, thus `_trialExecute()` is called on each msg. If we look closely, after receiving an error from an external call to receiver, the `Internal.MessageExecutionState.FAILURE` status is returned, however, if there is an issue in `_callWithExactGas(uint16, uint256, address, bytes memory)`, i.e here: 
  - ```Solidity
      if lt(g, gasForCallExactCheck) {
        revert(0, 0)
      }
      g := sub(g, gasForCallExactCheck)
      // if g - g//64 <= gasAmount, revert
      // (we subtract g//64 because of EIP-150)
      if iszero(gt(sub(g, div(g, 64)), gasAmount)) {
        revert(0, 0)
      }
      // solidity calls check that a contract actually exists at the destination, so we do the same
      if iszero(extcodesize(target)) {
        revert(0, 0)
      }
      ```
  the whole batch will be reverted. Exactly in this case, an adversary intentionally can spam txs with insuffient `gasLimit` which leads to a total DoS, especially in a case with L2<->L2 lanes. 


## Impact
* DoS

</br>

## Tools Used
* Manual Review

</br>

## Recommended Mitigation Steps
- Short term: The motivation behind reverting is understandable: Chainlink wants to differ an issue on a customer side and the CCIP issue. However, it's not a good idea to revert the whole batch because of a single tx. I would recommend to simply mark that msg as `Internal.MessageExecutionState.FAILURE` without reverting. 