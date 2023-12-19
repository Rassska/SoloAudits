# `VotiumStrategy.requestWithdraw()` doesn't check whether `totalLockedBalancePlusUnlockable` is already enough to cover withdrawal being requested

## Vulnerability Details
* The `totalLockedBalancePlusUnlockable` is being used to calculate an amount that's ready to be withdrawn. In case, if `totalLockedBalancePlusUnlockable >= cvxUnlockObligations` already before iterating over the `lockedBalances`, the withdrawal request is intended to be finalized right away, since the main criteria by design is whether the system has enough unlocked liquidity to finalize the request or not. If not, then it has to iterate and search for a locked position in order to cover uncovered portion of a withdrawal being requested.

## Impact 
* Possible balance lock in the future, but very unlikely, since it requires locker being shutdown or some additional migrations(while adding more strategies), which forces Asymmetry to set the `ratio = 1e18`

## Additional notes
* Hey Toshi! Have you ever considered having live audits? The reason, why I'm asking is because after reviewing the logic behind afETH,

## Recommended Mitigation Steps
- Short term: 
  - I'm not 100% sure about this, since it looks like a crutch:
    ```Solidity
    function requestWithdraw(
        uint256 _amount
    ) public override returns (uint256 withdrawId) {
        ...
        cvxUnlockObligations += cvxAmount;

        uint256 totalLockedBalancePlusUnlockable = unlockable +
            IERC20(CVX_ADDRESS).balanceOf(address(this));

      ++  if (totalLockedBalancePlusUnlockable>=cvxUnlockObligations) {
      ++    uint256 withdrawEpoch = currentEpoch;
      ++    withdrawIdToWithdrawRequestInfo[
      ++        latestWithdrawId
      ++    ] = WithdrawRequestInfo({
      ++        cvxOwed: cvxAmount,
      ++        withdrawn: false,
      ++        epoch: withdrawEpoch,
      ++        owner: msg.sender
      ++    });
      ++
      ++    emit WithdrawRequest(msg.sender, cvxAmount, latestWithdrawId);
      ++    return latestWithdrawId;
      ++  }

        for (uint256 i = 0; i < lockedBalances.length; i++) {
            totalLockedBalancePlusUnlockable += lockedBalances[i].amount;
            // we found the epoch at which there is enough to unlock this position
            if (totalLockedBalancePlusUnlockable >= cvxUnlockObligations) {
                (, uint32 currentEpochStartingTime) = ILockedCvx(VLCVX_ADDRESS)
                    .epochs(currentEpoch);
                uint256 timeDifference = lockedBalances[i].unlockTime -
                    currentEpochStartingTime;
                uint256 epochOffset = timeDifference /
                    ILockedCvx(VLCVX_ADDRESS).rewardsDuration();
                uint256 withdrawEpoch = currentEpoch + epochOffset;
                withdrawIdToWithdrawRequestInfo[
                    latestWithdrawId
                ] = WithdrawRequestInfo({
                    cvxOwed: cvxAmount,
                    withdrawn: false,
                    epoch: withdrawEpoch,
                    owner: msg.sender
                });

                emit WithdrawRequest(msg.sender, cvxAmount, latestWithdrawId);
                return latestWithdrawId;
            }
        }
        // should never get here
        revert InvalidLockedAmount();
    }
    
- Long term: Support on architectural level is required: 
  * The current assumes are being made towards invoking `relock()` manually, but what if that hasn't been invoked and the withdrawal request has been submitted which could be covered with the current balance without any unlocks needed? 