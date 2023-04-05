# The spot price for the Uniswap pair can be manipulated drastically using flash loans


## Vulnerability Details
* In [Reth.sol](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/derivatives/Reth.sol) there is a [deposit()](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/derivatives/Reth.sol#L156-L204) which could be invoked from [SafEth.sol](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/SafEth.sol) in order to deposit: $$ethAmount = \frac{msg.value * weights[i]}{totalWeight}$$ 

</br>

After getting invoked, it simply checks whether the [RocketDepositPool](https://etherscan.io/address/0x2cac916b2A963Bf162f076C0a8a4a8200BCFBfb4#code) is able to process deposit. If any of the following checks are not passed, the RocketDepositPool is unable to receive a deposit: 
  *  *The deposit pool size after depositing exceeds the maximum size*
  *  *The deposited amount is less than the minimum deposit size*
  *  *Deposits into Rocket Pool are currently disabled*
  
</br>

Currently, as of April 2023, the node operators in RocketPool provide some ETH to recieve freshly minted rETH by creating minipools and pushing those bundles via flashbots. However, it's possible to buy rETH in exchange for ETH on various DEXs. An exchange rate is slightly differs and currently the difference is about 0.432%, e.g
  *  1 rETH = 1.064265 ETH upon depositing directly.
  *  1 rETH = 1.06887 ETH secondary market (0.432% premium) 

</br>
So, if the RocketPool is not able at some point, Asymmetry Finance utilizes WETH/rETH pool on Uniswap to quickly exchange deposited ETH in order to receive some rETH, however in order to compute the exchange rate it uses the price feed directly from the pool which could be manipulated drastically within the tx. 

</br>

## Impact
* The SafETH drainage. Theft of underlying ETH value.

</br>

## Proof of Concept

* An attacker could make the following steps:
  *  Getting a huge amount of rETH via flash loan and dumping them in exchange for WETH
  *  Invoking the `stake()` in SafETH.sol and providing some ETH to stake
     *  Let's say the pre-setted weight for rETH is 33% and the contract sends 1/3 of the deposited ETH into a Uniswap pool where the price has been manipulated. As a result, depositAmount becomes hugly inflated. And then the protocol passes this inflated amount into the `ethPerDerivative()` which simply returns the rETH/ETH exchange rate on RocketPool, which is drastically more than expected. After that the protocol mints more shares than it should. 
  * Invoking `unstake()` which successfully drains the SafETH.
  * Paying the flash loan fee. 

* These steps could be reproduced multiple times leaving the Asymmetry finance with nothing. 

</br>

## Tools Used
* Manual Review

</br>

## Recommended Mitigation Steps
- Short term: It's possible to mitigate this attack by placing nonReentrant modifier on `stake()`/`unstake()`.
- Long term: Consider using TWAP price oracle to receive the price feed.     