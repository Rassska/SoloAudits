# Table of contents

- **[[M-01] `depositBufferedEther()` allows to pass malicious `depositCalldata`](#h-01-depositbufferedether-allows-to-pass-malicious-depositcalldata)**
- **[[M-02] `findLastFinalizableRequestIdByTimestamp()` unexpectedly underflows causing DoS](#m-02-findlastfinalizablerequestidbytimestamp-unexpectedly-underflows-causing-dos)**
- **[[M-03] `findLastFinalizableRequestIdByBudget()` unexpectedly underflows causing DoS](#m-03-findlastfinalizablerequestidbybudget-unexpectedly-underflows-causing-dos)**
- **[[M-04] `Math256.abs(int256)` unexpectedly overflows in case of an argument being equal to `type(int256).min`](#m-04-math256absint256-unexpectedly-overflows-in-case-of-an-argument-being-equal-to-typeint256min)**
- **[[M-05] Unchecked return value for `transfer()/transferFrom()` functions](#m-05-unchecked-return-value-for-transfertransferfrom-functions)**
- **[[M-06] `IERC721(token).safeTransferFrom()` provides an opportunity for users to grief each other](#m-06-ierc721tokensafetransferfrom-provides-an-opportunity-for-users-to-grief-each-other)**
- **[[L-01] Lack of arrays length check](#l-01-lack-of-arrays-length-check)**
- **[[L-02] Hardcoded `chainId` might become problematic upon network hard forks](#l-02-hardcoded-chainid-might-become-problematic-upon-network-hard-forks)**
- **[[L-03] Guardian might accidentally sign `stakingModule` pause proposal providing insecure arguments](#l-03-guardian-might-accidentally-sign-stakingmodule-pause-proposal-providing-insecure-arguments)**
- **[[L-04] Hardcoded staking module limit doesn't fit with `validStakingModuleId`](#l-04-hardcoded-staking-module-limit-doesnt-fit-with-validstakingmoduleid)**
- **[[L-05] Use overflow resistant formula for computing med in binary search](#l-05-use-overflow-resistant-formula-for-computing-med-in-binary-search)**
- **[[G-01] Unset the claimed request from the queue in order to get gas refund](#g-01-unset-the-claimed-request-from-the-queue-in-order-to-get-gas-refund)**

</br>

## **[M-01] `depositBufferedEther()` allows to pass malicious `depositCalldata`**<a name="M-01"></a>

### ***Description:***
- The function `depositBufferedEther()` provides an opportunity for committee members make a deposit to the specified StakingRouter which then makes a deposit to the Beacon chain via invoking `_makeBeaconChainDeposits32ETH()` with the following parameters: 
  - `_depositsCount`
  - `WCs`
  - `publicKeysBatch`
  - `signaturesBatch`

</br>

-  The process of retrieving last two parameters fully based on `depositCalldata` which was passed along with `depositsCount` to the function `obtainDepositData()` as we can see below: 
    ```Solidity
        (bytes memory publicKeysBatch, bytes memory signaturesBatch) =
        IStakingModule(stakingModule.stakingModuleAddress)
            .obtainDepositData(_depositsCount, _depositCalldata);
    ```

- It's still unclear how `_depositCalldata` does affect on obtaining these critical data, but the fact that anyone is capable of passing malicious `_depositCalldata` upon depositing buffered eth is disturbing. If it's, let's try to understand, how it's possible. Here is the function that we're interested in:  
  ```
      function depositBufferedEther(
        uint256 blockNumber,
        bytes32 blockHash,
        bytes32 depositRoot,
        uint256 stakingModuleId,
        uint256 nonce,
        bytes calldata depositCalldata,
        Signature[] calldata sortedGuardianSignatures
    ) external validStakingModuleId(stakingModuleId) {
        if (quorum == 0 || sortedGuardianSignatures.length < quorum) revert DepositNoQuorum();

        bytes32 onchainDepositRoot = IDepositContract(DEPOSIT_CONTRACT).get_deposit_root();
        if (depositRoot != onchainDepositRoot) revert DepositRootChanged();

        if (!STAKING_ROUTER.getStakingModuleIsActive(stakingModuleId)) revert DepositInactiveModule();

        uint256 lastDepositBlock = STAKING_ROUTER.getStakingModuleLastDepositBlock(stakingModuleId);
        if (block.number - lastDepositBlock < minDepositBlockDistance) revert DepositTooFrequent();
        if (blockHash == bytes32(0) || blockhash(blockNumber) != blockHash) revert DepositUnexpectedBlockHash();

        uint256 onchainNonce = STAKING_ROUTER.getStakingModuleNonce(stakingModuleId); 
        if (nonce != onchainNonce) revert DepositNonceChanged();

        _verifySignatures(depositRoot, blockNumber, blockHash, stakingModuleId, nonce, sortedGuardianSignatures); // fixme: `depositCalldata` is not a part of the msgHash

        LIDO.deposit(maxDepositsPerBlock, stakingModuleId, depositCalldata); 
    }
    ```

  -  It does bunch of checks and then `verifySignatures()` comes into the action. However, if you look closely, the payload doesn't contain `depositCalldata` which should be the part of an msgHash. Therefore, anyone is able to front-run the original tx by passing malicious `depositCalldata` and make the original tx to revert. 


### ***Impact***
- Submitting this as medium, since there is no any critical risk associated with maliciously added `depositCalldata`. But in the future, `depositCalldata` maight contain valuable information which could be forged.
  
### ***Tool used:***
- Manual review


### ***Recommendations***
- Short term: Consider including the hash of the `depositCalldata` into the `msgHash`, so that it's not possible to forge `depositCalldata`.
  
- Long term: N/A 

</br>

## **[M-02] `findLastFinalizableRequestIdByTimestamp()` unexpectedly underflows causing DoS**<a name="M-02"></a>

### ***Description:***
- `findLastFinalizableRequestIdByTimestamp()` allows to retrieve the latest request that has `request.timestamp` <= `_maxTimestamp` within a given range. Since the timestamps represent a non-decreasing sequence, it's possible to run the binary search over the requests sequence to obtain O(log(n)) time complexity which is pretty efficient. However, the lack of `_maxTimestamp`s validation results in having the function silently underflow instead of returning 0 as expected. That's possible in case if the `_maxTimestamp` < `_getQueue()[_startId].timestamp`.
Basically, before running the binary search, we have to prove that there is at least one request that could be filled within a given condition.
  

### ***Impact***
- The impact is not huge, however classifying this as medium because of the DoS. 
  
### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/WithdrawalQueueBase.sol#147-176
   ```
### ***Tool used:***
- Fuzzing: Echidna


### ***Recommendations***
- Short term: Consider validating specified invariant, so that it reverts in not only the case where `_maxTimestamp == 0`, but in the case above as well. Or just return `NOT_FOUND` i.e: 
    ```Solidity
        if (_startId > _endId || _maxTimestamp < getQueue()[startId].timestamp) return NOT_FOUND; // we have an empty range to search in or invalid _maxTimestamp
    ```

- Long term: N/A 

</br>

## **[M-03] `findLastFinalizableRequestIdByBudget()` unexpectedly underflows causing DoS**<a name="M-03"></a>

### ***Description:***
- `findLastFinalizableRequestIdByBudget()` allows to retrieve the latest request of the batch that could be filled with a provided `_ethBudget`. Since the range-sums utilized in Lido represent a non-decreasing sequence(the min request amount >= 100stETH), it's possible to run the binary search over the requests sequence to obtain O(log(n)) time complexity which is pretty efficient. However, the current function silently underflows if the `_ethBudget` < `finalizationBatch(_startId, _sharesRate)`. 
Basically, before running the binary search, we have to prove that there is at least one request that could be filled within a given condition.
  

### ***Impact***
- The impact is not huge, however classifying this as medium because of the DoS. 
  
### ***All occurances:***

- Contracts:

   ```bash
    contracts/0.8.9/WithdrawalQueueBase.sol#186-219
   ```
### ***Tool used:***
- Fuzzing: Echidna


### ***Recommendations***
- Short term: Consider validating specified invariant, so that it reverts in not only the case where `_ethBudget == 0`, but in the case above as well. Or just return `NOT_FOUND` i.e: 
    ```Solidity
        (uint256 minRequiredEth,) = finalizationBatch(_startId, _shareRate);
        if (_startId > _endId || _ethBudget < minRequiredEth) return NOT_FOUND; // we have an empty range to search in or provided _ethBudget is not sufficient enough to fina  lize the batch. 
    ```

- Long term: N/A 

</br>



## **[M-04] `Math256.abs(int256)` unexpectedly overflows in case of an argument being equal to `type(int256).min`**<a name="M-04"></a>

### ***Description:***
- The function `abs(int256)` unexpectedly reverts causing DoS, if the argument passed is `type(int256).min`, since the tolerance range for `int256` is the following: $-2^{255}$... $2^{255} - 1$. 
  

### ***Impact***
- The impact is not huge, however classifying this as medium because of the DoS. 
  
### ***All occurances:***

- Contracts:

   ```bash
    lido-dao/contracts/common/lib/Math256.sol#12-14
   ```
### ***Tool used:***
- Fuzzing: Echidna


### ***Recommendations***
- Short term: 
  - Apply the following diff:  
    ```Solidity
        function abs(int256 n) internal pure returns (uint256) {
    ++      require(n != type(int256).min);
            return uint256(n >= 0 ? n : -n);
        }
    ```
  
- Long term: N/A 

</br>


## **[M-05] Unchecked return value for `transfer()/transferFrom()` functions**<a name="M-05"></a>

### ***Description:***
- When transfering ERC20 tokens it's recommended to properly handle a return value. In case of `IERC20(token).transfer()` or `IERC20(token).transferFrom()` the [standard](https://ethereum.org/ru/developers/docs/standards/tokens/erc-20/) clearly says that the return value for those functions is boolean, hence should be handled upon any transfer. 

  - In a function below, it's properly handled: 
    ```Solidity
    function requestBurnMyStETHForCover(uint256 _stETHAmountToBurn) external onlyRole(REQUEST_BURN_MY_STETH_ROLE) {
        require(IStETH(STETH).transferFrom(msg.sender, address(this), _stETHAmountToBurn));
        uint256 sharesAmount = IStETH(STETH).getSharesByPooledEth(_stETHAmountToBurn);
        _requestBurn(sharesAmount, _stETHAmountToBurn, true /* _isCover */);
    } 
    ```
  - But there are no any checks that the staker actually sends stETH when requesting the withdrawal:
    ```Solidity
    function _requestWithdrawal(uint256 _amountOfStETH, address _owner) internal returns (uint256 requestId) {
        STETH.transferFrom(msg.sender, address(this), _amountOfStETH);

        uint256 amountOfShares = STETH.getSharesByPooledEth(_amountOfStETH);

        requestId = _enqueue(uint128(_amountOfStETH), uint128(amountOfShares), _owner);

        _emitTransfer(address(0), _owner, requestId);
    }
    ``` 

  
### ***All occurances:***

- Contracts:

   ```bash
   contracts/0.6.12/WstETH.sol#53-59
   contracts/0.8.9/Burner.sol#165-169
   contracts/0.8.9/Burner.sol#198-202
   contracts/0.8.9/WithdrawalQueue.sol#379-387
   contracts/0.8.9/WithdrawalQueue.sol#389-399
   ```
### ***Tool used:***
- Manual review + ChatGPT :D


### ***Recommendations***
- Short term: 
  - Make sure to review all occurances above
  - Apply the following diff on one of the occurance:  
    ```Solidity
        function _requestWithdrawal(uint256 _amountOfStETH, address _owner) internal returns (uint256 requestId) {
    --    STETH.transferFrom(msg.sender, address(this), _amountOfStETH);
    ++    require(STETH.transferFrom(msg.sender, address(this), _amountOfStETH), "...");

            uint256 amountOfShares = STETH.getSharesByPooledEth(_amountOfStETH);

            requestId = _enqueue(uint128(_amountOfStETH), uint128(amountOfShares), _owner);

            _emitTransfer(address(0), _owner, requestId);
        }
    ```
  
- Long term: N/A 

</br>


## **[M-06] `IERC721(token).safeTransferFrom()` provides an opportunity for users to grief each other**<a name="M-06"></a>

### ***Description:***
- `IERC721(token).safeTransferFrom()` is a little kludge on top of the `IERC721(token).transferFrom()` which simply checks whether the recepient is able to handle the token or not. However, it opens up a lot of doors towards gas griefing. 
  - Gas griefing:
    - Alice has a great to desire to grief someone just for fun. To make that happen, she deploys a smart-contract to request a withdrawal for a minumum amount of ETH which is 100 wei and transfers that to a one of the Lido's developers EOA. After that she asks the dev to transfer it back, saying that she accidentally dropped it. The developer Eugene understands that 100 wei withdrawal request is not worth for transfering back(the gas costs a lot more), but anyways he decides to make it happen via invoking `IERC721(token).safeTransferFrom()`. However, Eugene didn't simulate the tx before signing and it turns out that Alice putted a lot of dummy code into her `onReceived()` to simply burn the tx.origin's gas up to a hard limit per block. As a result of that, Eugene losts about 1-2 ETH.

### ***All occurances:***

- Contracts:

   ```bash
   contracts/0.8.9/WithdrawalQueueERC721.sol#197-202
   ```
### ***Tool used:***
- Manual review + ChatGPT :D


### ***Recommendations***
- Short term: I would consider keeping a light `IERC721(token).transferFrom()` which is very gas efficient compared to a `IERC721(token).safeTransferFrom()` and it also mitigates any risks associated with gas griefing or re-entrancy opportunities.
- Long term: N/A 

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