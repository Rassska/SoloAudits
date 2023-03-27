
# Codebase Analysis
- ## Test Coverage and Code Quality
    The research over the audit scope provided by Asymmetry Finance confirms that the quality of the code is on pretty decent level.
  

# EIP-4895 Integration Research
  

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
