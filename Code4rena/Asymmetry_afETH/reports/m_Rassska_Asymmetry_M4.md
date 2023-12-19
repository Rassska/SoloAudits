# It might not be possible to `applyRewards()`, if an amount received is less than 0.05 eth

## Vulnerability Details
* Upon claiming Votium rewards, `applyRewards()` is intended to be invoked bi-weekly in order to exchange the tokens for eth and put the eth received back into the strategies. Based on the current `ratio` it either stakes the amount into safETH or obtains some CVX by selling eth on Curve and then locks them to get vlCVX. 
  * ```Solidity
    uint256 safEthRatio = (safEthTvl * 1e18) / totalTvl;
    if (safEthRatio < ratio) {
        ISafEth(SAF_ETH_ADDRESS).stake{value: amount}(0);
    } else {
        votiumStrategy.depositRewards{value: amount}(amount);
    }

* Let's say the `safEthRatio < ratio`, which triggers `ISafEth(SAF_ETH_ADDRESS).stake{value: amount}` being invoked. And if the `amount < ISafEth(SAF_ETH_ADDRESS).minAmount`. The whole re-investing strategy collapses. 

* As of Sep. 2023, the Votium rewards are 0,000016 eth for 1 vlCVX per round, it means, we need at least 3125 vlCVX being delegated to the Votium in order to pass the threshold. 


## Impact
* This could backfire in early stages or during certain market conditions, where the amount of vlCVX hold by afETH is not enough to generate 0.05 eth bi-weekly. Basically, that forces to flows that are inconsistent with the main re-investment flow proposed by Asymmetry, which ultimately could result in theft as demonstrated in the issue #15.



## Recommended Mitigation Steps
- Short term: 
  - Wrapp `IAfEth(manager).depositRewards` into the try/catch block. And if one of the following conditions arises:
    - The min safETH deposit amount is not reached
    - Chainlink price feed could not be validated
    - Low-level call which sends fees fails
  
    just simply invoke `VotiumStrategy.depositRewards()`.
    ```Solidity
      if (address(manager) == address(0)) {
          depositRewards(ethReceived);
      } else {
          try IAfEth(manager).depositRewards{value: ethReceived}(ethReceived) {}
          catch {depositRewards(ethReceived);}
      }
    ``` 
    
- Long term: N/A