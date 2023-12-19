# Poisoning all the lenders within the market


* The current design behind an account being sanctioned is determined by two independent parties: 
  * `ChainalysisSanctionsList`
  * Borrower
```Solidity
function isSanctioned(address borrower, address account) public view override returns (bool) {
return
    !sanctionOverrides[borrower][account] &&
    IChainalysisSanctionsList(chainalysisSanctionsList).isSanctioned(account);
}
```

* If an account is marked as sanctioned by Chainalysis, it should no longer have an ability to transfer any market tokens whatsoever, however, the current design behind _transfer in `WildcatMarketToken` doesn't verify whether an account is sanctioned or not:
```Solidity
 function _transfer(address from, address to, uint256 amount) internal virtual {
    MarketState memory state = _getUpdatedState();
    uint104 scaledAmount = state.scaleAmount(amount).toUint104();

    if (scaledAmount == 0) {
      revert NullTransferAmount();
    }

    Account memory fromAccount = _getAccount(from);
    fromAccount.scaledBalance -= scaledAmount;
    _accounts[from] = fromAccount;

    Account memory toAccount = _getAccount(to);
    toAccount.scaledBalance += scaledAmount;
    _accounts[to] = toAccount;

    _writeState(state);
    emit Transfer(from, to, amount);
  }
  ```

## Impact 
* This leads to a massive impact, since now that sanctioned account is able to poison all the market by simply transfering little amounts of tokens to other lenders. 

## Proof of Concept
* In order to grief the whole market, an adversary might take the following steps: 
  * Obtain an ability to become a lender
  * Interact with the sanctioned entities(Tornado etc...)
  * Back-run the sanctioning tx and at the same time front-run `nukeFromOrbit()` calls(if any), by initiating bunch of poisoning transfers to the market members.
  
## Recommended Mitigation Steps
- Short term: close the timeframe between:
  -  an account being sanctioned
  -  an account being nuked from the market
  
  by placing `isSanctioned(address,address)` upon any transfers being made.
  
```diff
diff --git a/WildcatMarketToken.sol.orig b/WildcatMarketToken.sol
index f6a7f94..bdb1350 100644
--- a/WildcatMarketToken.sol.orig
+++ b/WildcatMarketToken.sol
@@ -62,6 +62,9 @@ contract WildcatMarketToken is WildcatMarketBase {}
 
   function _transfer(address from, address to, uint256 amount) internal virtual {
+    if (!IWildcatSanctionsSentinel(sentinel).isSanctioned(borrower, accountAddress)) {
+      revert BadLaunchCode();
+    }
     MarketState memory state = _getUpdatedState();
     uint104 scaledAmount = state.scaleAmount(amount).toUint104();
 
```
- Long term: N/A