# Possible arbitrage from Chainlink price discrepancy  

### Some theory needed:
* Currently KelpDAO relies on the following chainlink price feeds in order to calculate rsETH/ETH exchange rate:
  
|   | **Price Feed** | **Deviation** | **Heartbeat** |
|---|:----------:|:---------:|:---------:|
| **1** |  rETH/ETH  |     2%    |   86400s  |
| **2** |  cbETH/ETH |     1%    |   86400s  |
| **3** |  stETH/ETH |    0.5%   |   86400s  |

* As we can see, an acceptable deviation for rETH/ETH price feed is about `[-2% 2%]`, meaning that the nodes will not update an on-chain price, in case the boundaries are not reached within the 24h period. These deviations are significant enough to open an arbitrage opportunities which will impact an overall rsETH/ETH exchange rate badly. 
  
* For a further analysis we have to look at the current LSD market distribution, which is represented here: 

|       	|   **LSD**   	| **Staked ETH** 	| **Market Share** 	| **LRTDepositPool ratio** 	|
|-------	|:-----------:	|:--------------:	|:----------------:	|--------------------------	|
| **1** 	|     Lido    	|      8.95m     	|      ~77.35%     	|          ~88.17%         	|
| **2** 	| Rocket Pool 	|      1.01m     	|      ~8.76%      	|          ~9.95%          	|
| **3** 	|  Coinbase   	|     190.549    	|      ~1.65%      	|          ~1.88%          	|


* Where `LRTDepositPool ratio` is an approximate ratio of deposited lsts based on the overall LSD market. 

### An example of profitable arbitrage:
* In order to find an absolute extrema, we have to first understand how rsETH/ETH price is calculted. Let's examine the following:
    * $$ rsETHPrice = \frac{totalEthInPool}{rsEthSupply}, \; where \quad totalEthInPool = \frac{Q'(rETH) + Q''(stETH) + Q'''(cbETH)}{rsETHSupply}$$
    * `Q(amount)` - is eth backed by amount of provided LSTs.

* For a further calculation convenience, suppose `LRTDepositPool` has already some liquidity and it's distributed according to the LRTDepositPool ratio: 
  * $$ totalEthInPool = \frac{Q'(9.95) + Q''(88.17) + Q'''(1.88)}{(10.85 + 88.08 + 1.98)rsETH}$$

* Finally, let's consider all extremas of price feed deviations that are acceptable by chainlink nodes within a 24h period:
  
|       	| **rETH/ETH** 	| **stETH/ETH** 	| **cbETH/ETH** 	|
|-------	|:------------:	|:-------------:	|:-------------:	|
| **1** 	|     -~2%     	|     -~0.5%    	|      -~1%     	|
| **2** 	|     -~2%     	|     -~0.5%    	|      +~1%     	|
| **3** 	|     -~2%     	|     +~0.5%    	|      -~1%     	|
| **4** 	|     -~2%     	|     +~0.5%    	|      +~1%     	|
| **5** 	|     +~2%     	|     -~0.5%    	|      -~1%     	|
| **6** 	|     +~2%     	|     -~0.5%    	|      +~1%     	|
| **7** 	|     +~2%     	|     +~0.5%    	|      -~1%     	|
| **8** 	|     +~2%     	|     +~0.5%    	|      +~1%     	|

* In order to profit from such discrepancy, we have to maximize `rsethAmountToMint`:
  * $$ rsethAmountToMint = \frac{Q(amount)}{rsETHPrice}$$
* To make it happen, we further have to minimize `rsETHPrice` or maximize Q`(amount)`. 
  * Let's first consider minimization of `rsETHPrice`:
    *  $$ rsETHPrice = \frac{totalEthInPool}{rsEthSupply}$$
  * Which could be done, if we minimize `totalEthInPool`:
    * $$ totalEthInPool = Q'(9.95) + Q''(88.17) + Q'''(1.88) => (10.85 + 88.08 + 1.98)eth ==> ~100.91eth$$
  * And finally, the minimization of `totalEthInPool` comes from chainlink price feeds. Let's apply some of our acceptable price feed deviations to see, whether we can minimize `totalEthInPool` or not. 
    * `rETH/ETH` deviates by `+~2%`
    * `stETH/ETH` deviates by `-~0.5%`
    * `cbETH/ETH` deviates by `-~1%`
  * where `'totalEthInPool` could be calculated as:
    * $$ 'totalEthInPool = 1.02 * Q'(9.95) + 0.995 * Q''(88.17) + 0.99 * Q'''(1.88) => (11.06 + 87.64 + 1.96)eth ==> ~100.66eth$$
* As we can see, we were able to increase nominator by 2% and the same time - decrease denominator by 0.3% if we supply rETH at specified acceptable deviations config, it will result in increased amount of rsETH shares minted just because of the price discrepancy:
  * $$rsETHAmountToMint = \frac{1.02 * Q(amount)}{ 0.997 * rsETHPrice}$$


### Final words:
* Basically, price feeds don't have to reach those extreme boundaries in order to profit from it. In theory presented above we where able to get +2.3% profit, which is significant in case there is a huge liquidity supplied. The combination of deviations might be absolutely random, since it operates in set of rational numbers. But it will constantly open a small [+1%; +1.5%] arbitrage opportunities to be exploited.
  
## Proof on Concept
* To reproduce the case described above, slightly change: 
  * `LRTOracleMock`:
    * ```Solidity
      contract LRTOracleMock {
        uint256 public price;


        constructor(uint256 _price) {
            price = _price;
        }

        function getAssetPrice(address) external view returns (uint256) {
            return price;
        }

        function submitNewAssetPrice(uint256 _newPrice) external {
            price = _newPrice;
        }
      }
      ```
  * `setUp()`:
    * ```Solidity
      contract LRTDepositPoolTest is BaseTest, RSETHTest {
      LRTDepositPool public lrtDepositPool;

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


            lrtDepositPool.initialize(address(lrtConfig));
            // add minter role for rseth to lrtDepositPool
            rseth.grantRole(rseth.MINTER_ROLE(), address(lrtDepositPool));

        }
      }
      ```` 
  * `test_DepositAsset()`:
    * ```Solidity
          function test_DepositAsset() external {
            address rETHPriceOracle = address(new LRTOracleMock(1.09149e18));
            address stETHPriceOracle = address(new LRTOracleMock(0.99891e18));
            address cbETHPriceOracle = address(new LRTOracleMock(1.05407e18));
            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).updatePriceOracleFor(address(rETH), rETHPriceOracle);
            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).updatePriceOracleFor(address(stETH), stETHPriceOracle);
            LRTOracle(lrtConfig.getContract(LRTConstants.LRT_ORACLE)).updatePriceOracleFor(address(cbETH), cbETHPriceOracle);

            console.log("rETH/ETH exchange rate after", LRTOracleMock(rETHPriceOracle).getAssetPrice(address(0)));
            console.log("stETH/ETH exchange rate after", LRTOracleMock(stETHPriceOracle).getAssetPrice(address(0)));
            console.log("cbETH/ETH exchange rate after", LRTOracleMock(cbETHPriceOracle).getAssetPrice(address(0)));

            vm.startPrank(alice); // alice provides huge amount of liquidity to the pool

            rETH.approve(address(lrtDepositPool), 9950 ether);
            lrtDepositPool.depositAsset(rETHAddress, 9950 ether);

            stETH.approve(address(lrtDepositPool), 88170 ether);
            lrtDepositPool.depositAsset(address(stETH), 88170 ether);

            cbETH.approve(address(lrtDepositPool), 1880 ether);
            lrtDepositPool.depositAsset(address(cbETH), 1880 ether);

            vm.stopPrank();


            vm.startPrank(carol); // carol deposits, when the price feeds return answer pretty close to a spot price

            uint256 carolBalanceBefore = rseth.balanceOf(address(carol));

            rETH.approve(address(lrtDepositPool), 100 ether);
            lrtDepositPool.depositAsset(address(rETH), 100 ether);

            uint256 carolBalanceAfter = rseth.balanceOf(address(carol));

            vm.stopPrank();

            uint256 rETHNewPrice = uint256(LRTOracleMock(rETHPriceOracle).getAssetPrice(address(0))) * 102 / 100; // +2%
            uint256 stETHNewPrice = uint256(LRTOracleMock(stETHPriceOracle).getAssetPrice(address(0))) * 995 / 1000; // -0.5%
            uint256 cbETHNewPrice = uint256(LRTOracleMock(cbETHPriceOracle).getAssetPrice(address(0))) * 99 / 100; // -1%

            LRTOracleMock(rETHPriceOracle).submitNewAssetPrice(rETHNewPrice);
            LRTOracleMock(stETHPriceOracle).submitNewAssetPrice(stETHNewPrice);
            LRTOracleMock(cbETHPriceOracle).submitNewAssetPrice(cbETHNewPrice);

            console.log("rETH/ETH exchange rate after", LRTOracleMock(rETHPriceOracle).getAssetPrice(address(0)));
            console.log("stETH/ETH exchange rate after", LRTOracleMock(stETHPriceOracle).getAssetPrice(address(0)));
            console.log("cbETH/ETH exchange rate after", LRTOracleMock(cbETHPriceOracle).getAssetPrice(address(0)));

            vm.startPrank(bob);

            // bob balance of rsETH before deposit
            uint256 bobBalanceBefore = rseth.balanceOf(address(bob));

            rETH.approve(address(lrtDepositPool), 100 ether);
            lrtDepositPool.depositAsset(address(rETH), 100 ether);

            uint256 bobBalanceAfter = rseth.balanceOf(address(bob));
            vm.stopPrank();

            assertEq(bobBalanceBefore, carolBalanceBefore, "the balances are not the same");
            assertGt(bobBalanceAfter, carolBalanceAfter * 102 / 100, "some random shit happened");
            assertLt(bobBalanceAfter, carolBalanceAfter * 103 / 100, "some random shittttt happened");

          }
        ```
    
## Recommended Mitigation Steps
### Short term: 
- N/A

  
### Long term: 
  - I was thinking about utilizing multiple price oracles, which could potentially close any profitable opportunities, but the gas overhead and overall complexity grows rapidly. Unfortunately, I don't have anything robust to offer by now, but open to discuss about it.