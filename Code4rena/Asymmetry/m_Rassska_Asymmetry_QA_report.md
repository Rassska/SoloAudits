
# Overall Analysis
* ## About the Protocol
    > [Asymmetry Finance](https://www.asymmetry.finance/) provides an opportunity for stakers to diversify their staked eth across many liquid staking derivatives. It's not a doubt that the Lido has about 80% of the liquid staking market and Asymmetry Finance introduces a great solution to make the LSM more decentralized. 

</br>

* ## Test Coverage and Code Quality
    * The research made over the scope provided by Asymmetry Finance confirms that the quality of the code is on pretty decent level. However, lack of the documentation makes it a little harder to understand the overall architecture behind Asymmetry Finance. Fortunately, the team took some efforts towards documenting the NatSpec for almost all the functions within a scope. For further code readability improvements, consider utilizing: modifiers, named return values. Although, it slightly increases the bytecode size, but it provides an intrinsic gas consumption optimization along with a great readability.

    * The test coverage is well-defined, thus it covers the crucial logic in a very solid way. Also, it gives a huge help in order to follow the main components, like `stake()` and `unstake()` for auditors. The recommendations towards utilizing fuzzing tools or Certora Prover are relevant for protocol's safety against potential edge cases with a significant impact missed after the manual review. 
    

</br>

# EIP-4895 Integration Analysis
* ## About the EIP-4895
  * [EIP-4895](https://eips.ethereum.org/EIPS/eip-4895) is about providing an opportunity for validators:
    * to move their CL rewards to EL increasing the capital efficiency. This happens automatically upon an upcoming network fork. 
    * to exit from the beacon chain and fully recieve their staked eth.
  * Therefore, it's pretty important for liquid staking protocols to integrate this feature for a better compliance. 
  
</br>

* ## Withdrawals Architecture Proposed by Lido
  * We'll consider the withdrawal design proposed by Lido as an example so that the Asymmetry Finance could figure out about building a proper interface to interact with an underlying derivatives. 
  * According to a [feature/shapella-upgrade branch](https://github.com/lidofinance/lido-dao/tree/feature/shapella-upgrade), Lido is intending to process all withdrawals though their withdrawal queue. The higher perspective over the withdrawal feature is defined below:

    ```mermaid
    sequenceDiagram
        participant Lido_Staker
        participant Withdrawal_Queue
        participant Finalize_Role 
        participant LidoELRewards_Vault 
        participant Lido_DAO 
        participant ValidatorExitBus_Oracle
        participant RandomLidoValidator

        Lido_Staker->>Withdrawal_Queue: requests withdrawals by burning(stETH/wstETH)
        Lido_DAO->>ValidatorExitBus_Oracle: exit the validator according to the DAO policy
        ValidatorExitBus_Oracle->>Lido_DAO: sends unstaked eth
        Lido_DAO->>Finalize_Role: sends unstaked eth to process withdrawals
        RandomLidoValidator->>LidoELRewards_Vault: sends rewards after proposing a block on CL
        LidoELRewards_Vault->>Finalize_Role: sends EL and MEV rewards
        Finalize_Role->>Withdrawal_Queue: finalizes the batch of withdrawals
        Lido_Staker->>Withdrawal_Queue: claims withdrawals
        Withdrawal_Queue->>Lido_Staker: sends some fresh eth

    ```

# Asymmetry Improvement Proposals




## Table of contents

- **[[L-01] Lack of arrays length check]()**
- **[[L-02] Hardcoded `chainId` might become problematic upon network hard forks]()**
- **[[L-03] Guardian might accidentally sign `stakingModule` pause proposal providing insecure arguments]()**
- **[[L-04] Hardcoded staking module limit doesn't fit with `validStakingModuleId`]()**
- **[[L-05] Use overflow resistant formula for computing med in binary search]()**

</br>

## **[L-01] Lack of arrays length check**<a name="L-01"></a>

### ***Description:***
-  When passing several sequences in a case they supposed to match, it's better to clearly define an invariant which covers a length mismatch. It mitigates any risks associated with non-compliant payload.
  

  
### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/StakingRouter.sol#260-269
    contracts/0.8.9/StakingRouter.sol#271-303
   ```
### ***Tool used:***
- Manual review + ChatGPT :D


### ***Recommendations***
- Short term: 
  - Make sure to review all occurances above
  - Apply the following diff on one of the occurance:  
    ```Solidity
        function reportRewardsMinted(uint256[] calldata _stakingModuleIds, uint256[] calldata _totalShares)
            external
            onlyRole(REPORT_REWARDS_MINTED_ROLE)
        {
    ++      require(_stakingModuleIds.length == _totalShares.length, "...") // or revert with custom error
            for (uint256 i = 0; i < _stakingModuleIds.length; ) {
                address moduleAddr = _getStakingModuleById(_stakingModuleIds[i]).stakingModuleAddress;
                IStakingModule(moduleAddr).onRewardsMinted(_totalShares[i]);
                unchecked { ++i; }
            }
        }
    ```
  
- Long term: N/A 

</br>

## **[L-02] Hardcoded `chainId` might become problematic upon network hard forks**<a name="L-02"></a>

### ***Description:***
-  In `DepositSecurityModule.sol` there is a function `pauseDeposits()` which allows for anyone having the signature signed by guardian to pause the staking module. The message hash defined in the following way: 
   -  ```Solidity          
        bytes32 msgHash = keccak256(abi.encodePacked(PAUSE_MESSAGE_PREFIX, blockNumber, stakingModuleId));
        ```
    where the `PAUSE_MESSAGE_PREFIX` is an immutable defined in the following way: 
    - ```Solidity
        PAUSE_MESSAGE_PREFIX = keccak256(
            abi.encodePacked(
                // keccak256("lido.DepositSecurityModule.PAUSE_MESSAGE")
                bytes32(0x9c4c40205558f12027f21204d6218b8006985b7a6359bcab15404bcc3e3fa122),
                block.chainid,
                address(this)
            )
        );
        ```
        Everything seems okay, but there is a little risk behind hardcoding `PAUSE_MESSAGE_PREFIX` during network hard forks.
  
### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/DepositSecurityModule.sol#336-365
   ```
### ***Tool used:***
- Manual review + ChatGPT :D


### ***Recommendations***
Make sure to review all occurances above.

- Short term: Consider using the same approach for message hash building as in `EIP712StETH.sol`.
- Long term: N/A

</br>

## **[L-03] Guardian might accidentally sign `StakingModule` pause proposal providing insecure arguments**<a name="L-03"></a>

### ***Description:***
-  In `DepositSecurityModule.sol` there is a function `pauseDeposits()` which allows for anyone having the signature signed by guardian to pause the staking module. Let's say guardian accidentally signed the payload with the following params:
   -  blockNumber: 0
   -  stakingModuleId: anySufficientID
  
-   Now the permiter uses the signature to pause `StakingModule`, hence everyone can reuse the payload to pause `StakingModule`. It's possible, because `block.number - blockNumber >> pauseIntentValidityPeriodBlocks`. The `blockNumber` should not be equal to zero for making this happen. The guardian could simply miss an additional zero at the end of the value, which also could make a decent difference.
  
### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/DepositSecurityModule.sol#336-365
   ```
### ***Tool used:***
- Manual review + ChatGPT :D


### ***Recommendations***
Make sure to review all occurances above.

- Short term: Unfortunately, there is no straightforward solution here to mitigate the risks above. 
- Long term: N/A

</br>

## **[L-04] Hardcoded staking module limit doesn't fit with `validStakingModuleId`**<a name="L-04"></a>

### ***Description:***
- The function `addStakingModule()` allows to add up to 32 staking modules, however, the modifier `validStakingModuleId` defines [0, type(uint24).max] possible ids for staking modules. 
  


### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/StakingRouter.sol#183
   ```
### ***Tool used:***
- Fuzzing: Echidna


### ***Recommendations***
- Short term: Consider fixing that mismatch between allowed staking module ids. 
- Long term: N/A 

</br>

## **[L-05] Use overflow resistant formula for computing med in binary search**<a name="L-05"></a>

### ***Description:***
- The current `uint256 mid = (max + min) / 2` has no any problems computing mid, but in theory it could potentially overflow. To mitigate this, it's possible to compute the mid in the following way: 

    ```Solidity
        uint256 mid = min + (max - min) >> 1
    ```
It's a little bit optimized as well.


### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/WithdrawalQueueBase.sol#206
    contracts/0.8.9/WithdrawalQueueBase.sol#165
   ```
### ***Tool used:***
- Fuzzing: Echidna


### ***Recommendations***
- Short term: Consider applying diff above.
- Long term: N/A 

</br>

## **[G-01] Unset the claimed request from the queue in order to get gas refund**<a name="G-01"></a>

### ***Description:***
- After withdrawal batch gets finalized, owners are capable of claiming their requested withdrawals from the queue. It's better to reset withdrawal request which has been claimed providing to the user some gas refund. That would make intrinsic gas consumption cheaper up to the 50%. 

### ***All occurances:***

- Contracts:

   ```bash
    file: contracts/0.8.9/WithdrawalQueueBase.sol#408-426
   ```
### ***Tool used:***
- Manual review


### ***Recommendations***
- Short term: Consider unsetting withdrawal request's attributes which has been claimed.  
- Long term: N/A 

</br>
