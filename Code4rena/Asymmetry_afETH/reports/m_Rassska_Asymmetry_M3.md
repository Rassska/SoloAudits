# Potential rewards stealing by manipulating CVX/ETH pool

## Vulnerability Details
* Upon claiming Votium rewards, `applyRewards()` is intended to be invoked in order to exchange the tokens for eth and put the eth received back into the strategies. Based on the current `ratio` it either stakes the amount into safETH or obtains some CVX by selling eth on Curve and then locks them to get vlCVX. 

* Since `afETH.depositRewards()` or `VotiumStrategy.depositRewards()` can be called by anyone, an adversary is able to manipulate the CVX/ETH pool in such a way that the CVX tokens will be bought at inflated rates creating an arbitrage opportunity for an adversary. 

## Impact
* It's possible to steal any eth hold by `afETH` or `VotiumStrategy`. 
  * But when exactly `afETH` or `VotiumStrategy` will hold some eth apart from accidental eth transfers? This has been discussed with the sponsors and we have the following context: 
  
    * Possibility to boost user rewards by dropping additional eth and re-investing them after the rewards being received. The time difference between additional eth being dropped and rewards from Votium being claimed is exactly what an adversary needs to steal that additional eth.
  
    * In a case, where the `ratio > safEthRatio` rewarder oracle will not be able to invoke `applyRewards()` after rewards being claimed due to the min deposit amount limits setted by safETH, which ultimately results in tx reversion. 

    * Upon further supporting more strategies. 
  
* Marking this as medium severity, since the impact is critical, but the likelihood is low/medium.
## Proof of Concept
  * Steps to execute such attack are simple:
    * Borrow an ETH on Balancer to make the slippage significant in CVX/ETH curve pool.
    * In the same tx, invoke `afETH.depositRewards()`/`VotiumStrategy.depositRewards()` while the rates are inflated.
    * Rebalance the pool back by taking out an ETH.
    * Repay flash loan fee and drop that additional dirty ETH into favorite mixer.

## Recommended Mitigation Steps
- Short term: 
    - Make `depositRewards()` being invoked internally only by underlying strategies.
  
- Long term:
  - Probably, it's possible to compare the amount received from the trade against chainlink price feed's answer. If the amount received deviates from oracle's answer more than `x%`, the whole tx will be reverted. Basically, setting the slippage control by utilizing price oracles.