# First staker is able to break the contract  


## Vulnerability Details
* Let's consider the following scenario. After getting an audit from code4rena, Asymmetry Finance decides to deploy everything on mainnet. For some simplicity, let's assume that the time picked for the deployment is 11:59 UTC. And also, just for a little context, the Lido's AccountingOracle submits report at 12:00 UTC. 

*  After initiating full deployment, Asymmetry Finance decides to adjust the weights. Let's say the weights for derivatives are:
   * stETH: `weights[0] = 33e18,`
   * rETH: `weight[1] =  33e18,`
   * sfrxETH: `weight[2] =  33e18.`

* Basically, it happens nearly before AccountingOracle reports some rebase on Lido. 
* Now, malicious Bob's tx comes into the play. What he can do at this point of time to break the whole SafEth?
  * He stakes 10 ETH by invoking `stake()`
  * Receives corresponding amount of shares based on the following portions:
    * `33% of stETH`
    * `33% of rETH`
    * `33% of sfrxETH`
  * Of course, this amounts are not perfect due to the slippage which is close to 0% in stable conditions. But the main idea here is that the protocol mints very close number of shares to those deposited 10eth.

  * After staking, AccountingOracle on Lido reports a positive rebase and the balance of the Lido stakers increases. At this moment SafEth has only the single stake from Bob. 
  * Now, Bob unstakes everything except the single share that he left in a contract deliberately and receives the whole underlying eth that initially has been deposited. He receives the whole underlying eth, because the positive rebase simply increase his stETH balance, and that's enough to leave some amount of shares in a contract.
  * Afterwards, the derivatives doesn't contain any underlying eth, but the system has some shares left by Bob. This cause a giant problem, since [`preDepositPrice` for other stakers is zero](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/SafEth.sol#L81) and [when computing amounts to mint](https://github.com/code-423n4/2023-03-asymmetry/blob/main/contracts/SafEth/SafEth.sol#L98), it simply reverts because of the division by zero.



## Impact
*  Breaking the whole system.

</br>

## Proof of Concept

* As a PoC, I'll provide a sequence diagram:
</br>
  
  ```mermaid
        sequenceDiagram
        participant Attacker
        participant SafEth
        participant wstEth
        participant sfrxEth 
        participant rEth 
        participant Lido 
        participant AccountingOracle

        Attacker->>SafEth: stakes 10eth
        SafEth->>wstEth: deposits 33% 
        SafEth->>sfrxEth: deposits 33%
        SafEth->>rEth: deposits 33%
        SafEth->>Attacker: mints some (10eth - 1e12wei) worth of shares
        AccountingOracle->>Lido: submits report with positive rebase
        Lido->>SafEth: after the report, the balance has increased a little
        Attacker->>SafEth: unstakes all shares except the single one.
        SafEth->>Attacker: sends all underlying eth
    ```

</br>

* The root cause of such behavior is that the submitted wstETH amount now is worth more after AccountingOracle reports.

</br>

## Tools Used
* Manual Review

</br>

## Recommended Mitigation Steps
- Short term: Straightforward idea here is might be to stop any unstakes temporarily at the first time. But it's an accurate solution here. 
- Long term: N/A
  