# The current vlCVX balance is not freezed, when withdrawal has been requested

## Vulnerability Details
* After some deposits/withdrawals being made by users, the following edge case might occur: 
  * Let's say, 
    * `n = totalLockedBalancePlusUnlockable`, before iterating over the `lockedBalances`. 
    * `t1 = lockedBalance[0].unlockTime`
    * `t2 = lockedBalance[1].unlockTime = t1 + 1 epoch`
  
  * Now, the withdrawal request has been submitted such as the:
    * `cvxUnlockObligations <= n + lockedBalance[0]` (e.g. could be covered by balance + first lock)
    * `cvxUnlockObligations > lockedBalance[0]` (e.g. could not be covered only by first lock)

  * Another withdrawal request has been submitted right after that such as:
    * `cvxUnlockObligations <= n + lockedBalance[0] + lockedBalance[1]` (e.g. could be covered by the balance + second lock)
    * `cvxUnlockObligations > lockedBalance[0] + lockedBalance[1]`(e.g. could not be covered by the second lock only needs this little `n`)


* As you might noticed already, `n` is not freezed after the first withdrawal has been requested and because of that afther the second withdrawal being finalized, which will account for `n + lockedBalance[1]`, the first request could not be finalized, since it requires additional `n` with `lockedBalance[0]` to be finalized, but `n` is already has been used to finalize the second request. 

## Impact
* Insufficient withdrawal coverage upon finalization. 
* The intention behind this issue is to point out that it's wrong to account the balance held by VotiumStrategy multiple times. Once it's included to decide the requests withdrawal time along with locked positions, it has to be freezed and never be reused again to calculate the time for next withdrawals. Although, I do agree that the likelihood of this being occured is low.


## Recommended Mitigation Steps
- Short term: N/A
    
- Long term: Needs the solution to be added on architectural level to prevent accounting the same balance multiple times. 