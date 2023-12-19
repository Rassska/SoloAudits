# Users might lose their stETH rebased reward due to the weights change


## Vulnerability Details
* Let's consider the following scenario:
  * Bob deposits 10eth with the weights:
    * stETH: `weights[0] = 90e18,`
    * rETH: `weights[1] = 5e18.`
    * sfrxETH: `weights[2] = 5e18`

  * Now, since the Lido has 80% of liquid staking market, Asymmetry Finance decides to adjust the weights and set 0% for Lido. Over the time the balance of the wstETH derivative becomes close to 0.
  * After that, Bob decides to unstake his shares, but he doesn't receive any rewards occuered on his initial 90% of stETH. Instead, he receives some eth from RocketPool and Frax, which is not comparable with the amount that he could receive back, if the weights were unchanged over the time.

* Initially Bob receives the following amount of shares:
    * X amount of shares for 90% of eth (deposited into the Lido)
    * Y amount of shares for 5% of eth (deposited into the RocketPool)
    * Z amount of shares for 5% of eth (deposited into the Frax)

</br>

* After changing the weights and the balances are also adjusted, Bob doesn't receive:
  * X amount of shares worth of wstETH
  * Y amount of shares worth of rETH
  * Z amount of shares worth of sfrxETH

* Instead, he receives accordingly to the current adjusted weights, losing rewards occured on his 90% worth of wstETH shares.


## Impact
*  Loss of user's funds.

</br>

## Tools Used
* Manual Review

</br>

## Recommended Mitigation Steps
- Short term: N/A
- Long term: The protocol design itself allows the possible scenario for happening. The problem actually, is the same, the user should not be able to receive eth from the derivative which didn't mint some _safEth initially. 
  