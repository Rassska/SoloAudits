# The user might receive unfair amount of ETH upon unstaking 


## Vulnerability Details
* Let's assume for simplicity, that Asymmetry currently has 2 underlying derivatives: Lido and RocketPool. And the weights are:
  * stETH: `weights[0] = 50e18,`
  * rETH: `weights[1] = 50e18.`
  
* As of now, the exchange rate is the following:
  * `1stETH = 	0.988232 ETH`
  * `1wstETH = 1.12 ETH`
  * `1 rETH = 1.069457 ETH`
  
</br>

* Consider the following scenario: 
  * Bob stakes 10eth by invoking the `stake()` in [SafEth.sol](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/SafEth.sol)
    * $$ethAmount[0] = 5ETH => depositAmount[0] = 4.48wstETH => derivativeReceivedEthValue[0] = \frac{1116781458397758464 stETH * 4.48 wstETH}{1e18}$$
    * $$ethAmount[1] = 5ETH => depositAmount[1] = 4.67526978644rETH => derivativeReceivedEthValue[1] = \frac{1064454100689835271ETH * 4.67526978644rETH}{1e18}$$
    * $$totalStakedValueEth = \frac{1116781458397758464 stETH * 4.48 wstETH}{1e18} + \frac{1064454100689835271ETH * 4.67526978644rETH}{1e18}$$

  * As you can see above, those amounts are not the same, they deviate from deposited 5eth, therefore the shares are not perfectly equal: 
    * $$mintedSharesFor(\frac{1116781458397758464 stETH * 4.48 wstETH}{1e18}) \: != \: mintedSharesFor(\frac{1064454100689835271ETH * 4.67526978644rETH}{1e18})$$
    * $$mintAmount[0] = \frac{5.0031809e+18}{1e18}$$
    * $$mintAmount[1] = \frac{4.9766101e+18}{1e18}$$
    


  * Everything seems to be okay, until the weights change. 
    * Let's say now, Asymmetry add another derivative and adjust the weights:
      * stETH: `weights[0] = 1e18,`
      * rETH: `weights[1] = 90e18.`
      * sfrxETH: `weights[2] = 9e18`
  * The balances slightly start to change(i.e. more eth comes into RocketPool and after some time it rebalances)
  * Now, the user who gains unfair amount of shares, decides to unstake his mintAmount[0] + mintAmount[1] and according to the weights. But the RocketPool upon burning rETH provides more eth on X amount of _safEth. As a result the user gains more eth, simply because he received _safEth shares on stETH, but now 90% of his shares will be burnt by the RocketPool provided more eth then it should.



## Impact
*  Users might lose their underlying eth.

</br>


## Tools Used
* Manual Review

</br>

## Recommended Mitigation Steps
- Short term: N/A
- Long term: It should not be possible to receive eth on _safETH shares received from the not the current derivative that tries to withdraw. 
  - (i.e burning/exchanging _safETH shares received from other derivative could cause some loses or extra funds in a user's pocket) 
  