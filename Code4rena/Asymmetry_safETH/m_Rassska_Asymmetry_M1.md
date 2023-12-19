# Single derivative makes the whole system fragile 


## Vulnerability Details
* In [SafEth.sol](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/SafEth.sol) there is a function `unstake()` in order to provide an opportunity for users to burn their _safEth shares in exchange for ETH. Everything works flawlessly in most of the time, however, if any of the derivative is not available to perform withdrawal and the balance of that derivative > 0, the user is not able to `unstake()`. 
* X reasons of the failure
  * Curve pool stETH/ETH used for performing swaps could cause a bad slippage
  * Uniswap pool rETH/ETH used for performing swaps could cause a bad slippage
  * Curve pool frxETH/ETH used for performing swaps could cause a bad slippage
  * Paused stETH as an emergency, `.approve()` is not available to perform a swap

</br>

Basically, SafETH is heavily dependent on each derivative, if something goes down, the SafETH also in troubles. With increasing amount of underlying derivatives the probability of such case is getting higher and higher. Therefore, it might become a huge problem in the future. 

Here, the owner could set the slippage up to 10% and then Asymmetry_Staker could retry again. But it's not a decent solution. What if an stETH has been paused, should the whole Asymmetry with more than potentially 20 derivatives be in paused mode? I don't think so. 


## Impact
* SafETH DoS caused by a single derivative.

</br>

## Proof of Concept

* As a PoC, I'll include the sequence diagram: 
  * 
  ```mermaid
      sequenceDiagram
        participant Asymmetry_Staker
        participant SafEth
        participant wstETH_Derivative
        participant rETH_Derivative
        participant SfrxETH_Derivative
        participant SafEth_Owner

        Asymmetry_Staker->>SafEth: invokes unstake()
        SafEth->>wstETH_Derivative: invokes withdraw()
        wstETH_Derivative->>SafEth: transfers some swapped eth
        SafEth->>rETH_Derivative: invokes withdraw()
        rETH_Derivative->>SafEth: delivers some eth
        SafEth->>SfrxETH_Derivative: invokes withdraw()
        SfrxETH_Derivative->>SafEth: reverts because of the slippage or whatever reason
  ```
  * As you can see here, one derivative make the whole withdrawal revert.




</br>

## Tools Used
* Manual Review

</br>

## Recommended Mitigation Steps
- Short term: N/A
- Long term: 
  - In a case, where any derivative is unable to perform, it should be frozen temporarily, to make it happen, adjusting the weight to 0 for a particular derivative seems relevant if we include the following check in `unstake()` as well: 
    - ```Solidity
        function unstake(uint256 _safEthAmount) external {
            require(pauseUnstaking == false, "unstaking is paused");
            uint256 safEthTotalSupply = totalSupply();
            uint256 ethAmountBefore = address(this).balance;

            for (uint256 i = 0; i < derivativeCount; i++) {
      ++        if (weights[i] == 0) continue; <<------
                // withdraw a percentage of each asset based on the amount of safETH
                uint256 derivativeAmount = (derivatives[i].balance() *
                    _safEthAmount) / safEthTotalSupply;
                if (derivativeAmount == 0) continue; // if derivative empty ignore
                derivatives[i].withdraw(derivativeAmount);
            }
            _burn(msg.sender, _safEthAmount);
            uint256 ethAmountAfter = address(this).balance;
            uint256 ethAmountToWithdraw = ethAmountAfter - ethAmountBefore;
            // solhint-disable-next-line
            (bool sent, ) = address(msg.sender).call{value: ethAmountToWithdraw}(
                ""
            );
            require(sent, "Failed to send Ether");
            emit Unstaked(msg.sender, ethAmountToWithdraw, _safEthAmount);
        }
  