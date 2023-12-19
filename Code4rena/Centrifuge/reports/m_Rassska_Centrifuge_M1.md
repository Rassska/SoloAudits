# Complete halt under certain circumstances


## Vulnerability Details
* The current version of assets in liquidity pools implements [ERC-2612](https://eips.ethereum.org/EIPS/eip-2612) on top of the ERC-20 standard in order to enable meta transactions. However, it opens a room for potential vulnerabilities under certain circumstances.  

</br>

* After seeing the rise of RWAs, Binance decides to step in and collaborate with Centrifuge's Governance in order to support some RWA pools for its customers. To make it happen, they create a proposal to add the LP with their own native currency(e.g. BNB) being as an underlying asset. Seeing the following proposal, Governance will approve it, since the BNB is backward compatible with the currencies being used in a system. After all adjusmets being made, users start to deposit into the pools and everything goes seamless as desined. 
  
</br>

* As you already know, some of the native gas tokens do not have the logic implemented for `.permit()` whatsoever, but they do have non-reverting `fallback()` in order to accept the native currency. 

* Having the context needed, we can finally look into the `requestDepositWithPermit()`: 

  * ```Solidity
      function requestDepositWithPermit(uint256 assets, address owner, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public 
        {
            ERC20PermitLike(asset).permit(owner, address(investmentManager), assets, deadline, v, r, s);
            investmentManager.requestDeposit(assets, owner);
            emit DepositRequested(owner, assets);
        }

  * In this case, the asset is BNB and upon invoking, it will simply redirect the flow with the dummy payload into the fallback() function which does nothing at all and does not revert, which is important. Since it does not revert, everything after `ERC20PermitLike(asset).permit(...)` will be processed further. 

</br>

* The question now is what kind of power do we have with such a trick. I would sayyyy: we can mess up almost everything on behalf of everyone. 
  * For instance: 
    * It's possible to cancel every single non-finalized order, thus the system is halt.
    * It's possible to deposit on behalf of the owner(if he approves type(uint256).max to the LP before his first deposit)
    * It's possible to request redeem for an arbitrary owner on his behalf.
    * And many more ...

## Impact
* I'm not aware the cases, where theft is possible, but the community will face complete halt of the LPs and unnecessary migrations that could affect the reputation. 

</br>

## Proof of Concept

* For the case with complete halt an attacker could simply: 
  * Back-run the tx of a potential investor with a cancel message, so it will be never executed at the end of an epoch. 

* For all other described cases, the PoC is intuitive.
  

</br>

## Recommended Mitigation Steps
- [The Debaub team has white-hated $1b for a Multichain users](https://media.dedaub.com/phantom-functions-and-the-billion-dollar-no-op-c56f062ae49f) by utilizing similar approach. In that case, Multichain has decided to completely remove those functions, which may not be ideal in the context of LPS. 