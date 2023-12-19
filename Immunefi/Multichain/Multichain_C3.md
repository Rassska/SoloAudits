## Bug
- AnyCallProxyV7 contract user's balance drainage


## Target
- https://github.com/anyswap/anyswap-v1-core

## Bug Description
### General Breakdown
- Look at the functions below:
    - ```Solidity
        function deposit(address app) public payable {
            uint256 uniGasAmount = IUniGas(uniGas).ethToUniGas(msg.value);
            balanceOf[app] += int256(uniGasAmount);
            (bool success, ) = mpc.call{value: msg.value}("");
            require(success);
            emit Deposit(app, msg.value, uniGasAmount);
        }

        function withdraw(address app, uint256 amount)
            public
            returns (uint256 ethAmount)
        {
            require(msg.sender == app, "not allowed");
            balanceOf[app] -= int256(amount);
            ethAmount = IUniGas(uniGas).uniGasToEth(amount);
            (bool success, ) = app.call{value: ethAmount}("");
            require(success);
            emit Withdraw(app, ethAmount, amount);
            return ethAmount;
        }

- Everything seems good, right? What if we look at the mapping balanceOf? 
    - ```Solidity
        mapping(address => int256) public balanceOf; // receiver => UniGas balance

- Still no concerns? 
  - The balance in mapping actually could drop below 0.

### What is it all about?
- As I said in the report above, the function `AnyCallProxyV7::withdraw(address, uint)` allows to drain `AnyCallProxy`, since the mapping used for tracking balances allows the balance being less than zero. Therefore, if we perform the call to `withdraw()` with insufficient balance, the call will not be reverted due to balance underflow, but instead we'll get the converted amount of eth over and over again:
  - ```Solidity
        balanceOf[app] -= int256(amount);
        ethAmount = IUniGas(uniGas).uniGasToEth(amount);
        (bool success, ) = app.call{value: ethAmount}("");
## Impact
- Direct theft of any user funds, whether at-rest or in-motion, other than unclaimed yield.
  
## Recommendation
- Prevent the underflows. 

## References
- Good post about Merkle Tree pitfalls: https://mirror.xyz/haruxe.eth/Gg7UG4hctOHyteVeRX7w1Ac9m1gAoCs8uuiWx3WwVz4

## Proof of Concept
- I've deployed pretty basic contract to highlight only essential part: https://goerli.etherscan.io/tx/0x5f96f401b4f40548b13b755adb46002721851eface89f422192a6d93356e4541
- Then I added some liquidity to that contract to imitate the contract balance(which comes from other app's deposits): https://dashboard.tenderly.co/Rassska/project/simulator/061eb11b-02f2-4350-b3da-a933ca2894de/state-diff
  - We can see that the actual balance of smart-contract has increased
- Then I deposited 0.5 eth to the contract: https://dashboard.tenderly.co/Rassska/project/simulator/a27b7e0d-80a9-43c2-932a-818d17e79027/state-diff
  - We can see that the app's balance has increase by 0.5 eth
- Then I simply withdrew my deposit(eg. 0.5 eth): https://dashboard.tenderly.co/Rassska/project/simulator/f0917503-6e9d-495c-a982-30107e16ac0b/state-diff
  - We can see that the app's balance has decreased by 0.5eth
- And in the end, I withdrew the remaining liquidity as well: https://dashboard.tenderly.co/Rassska/project/simulator/8553e3e0-07de-44fa-8d8d-a480b277ccc6/state-diff
- Here, my balance became -1eth.

## PoC Hash
- 8b81e70b58235214ffdcfd85bdabcaa064ba82c4a6706c4aebfe172ab1f98863 (I've publicly shared keccak256 out of my PoC, notice I didn't hash it with my private key)