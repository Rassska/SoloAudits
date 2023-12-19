## The following table contains various web3 contest results

|       | **Protocol Name** |                                      **Results**                                     | **Shares** |                                               **Report**                                              | **Contest Platform** |
|-------|:-----------------:|:------------------------------------------------------------------------------------:|------------|:-----------------------------------------------------------------------------------------------------:|:--------------------:|
| **1** |        Lido       |                          [1/7](https://t.me/c/1904495328/69)                         |   $13,071  | [click](https://github.com/Rassska/SoloAudits/blob/main/PrivateAudits/m_Rassska_Lido_audit_report.md) |      Stronghold      |
| **2** |  Asymmetry_safETH |            [5/246](https://code4rena.com/audits/2023-03-asymmetry-contest)           |   $1,057   |      [click](https://github.com/Rassska/SoloAudits/tree/main/Code4rena/Asymmetry_safETH/reports)      |       Code4rena      |
| **3** |      KelpDAO      |                  [1/194](https://code4rena.com/reports/2023-11-kelp)                 |   $1,250   |          [click](https://github.com/Rassska/SoloAudits/tree/main/Code4rena/Kelp_DAO/reports)          |       Code4rena      |
| **4** |  Asymmetry_afETH  | [4/5](https://code4rena.com/audits/2023-09-asymmetry-finance-afeth-invitational#top) |   $3,062   |       [click](https://github.com/Rassska/SoloAudits/tree/main/Code4rena/Asymmetry_afETH/reports)      |       Code4rena      |
| **5** |     Centrifuge    |               [78/84](https://code4rena.com/audits/2023-09-centrifuge)               |     $12    |         [click](https://github.com/Rassska/SoloAudits/tree/main/Code4rena/Centrifuge/reports)         |       Code4rena      |
| **6** |    The Wildcat    |                [NA/144](https://code4rena.com/reports/2023-10-wildcat)               |     N/A    |           [click](https://github.com/Rassska/SoloAudits/tree/main/Code4rena/Wildcat/reports)          |       Code4rena      |

</br>

## The following one contains bug report submissions on Immunefi

|       | **Protocol Name** |                                                             **Bug**                                                            | **Shares** |                                           **Report**                                          | **Severity** |
|-------|:-----------------:|:------------------------------------------------------------------------------------------------------------------------------:|------------|:---------------------------------------------------------------------------------------------:|:------------:|
| **1** |     Multichain    |                         White Holder allows to claim infinity amount of IDNFTs for a whitelisted user.                         |  N/A(dup)  | [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Multichain/Multichain_C2.md) |     High     |
| **2** |     Multichain    | Lack of chainID in `transferWithPermit()::hashStruct` leads to spending funds on other chains as well using the same signature |  N/A(dup)  | [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Multichain/Multichain_C1.md) |     Crit     |
| **3** |     Multichain    |                                         AnyCallProxyV7 contract user's balance drainage                                        |  N/A(dup)  | [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Multichain/Multichain_C3.md) |     Crit     |
| **4** |   Yield Protocol  |                permit()may trigger deposit() though a fallback() for tokens that are not compliant with ERC2612                |   $2,000   |  [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Yield_Protocol/Yield_M1.md) |    Medium    |
| **5** |   Yield Protocol  |       Malicious Bob is able to dramatically increase the gas usage, when NotionalJoin::exit() is invoked by auth account.      |   $2,000   |  [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Yield_Protocol/Yield_M2.md) |    Medium    |
| **6** |      Wormhole     |                              ecrecover() returns address(0), when sig doesn't belong to signatory                              |    $500    |   [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Wormhole/Wormhole_L1.md)   |      Low     |
| **7** |      Polygon      |                               Jailed Validator can claim fees during reward distribution process                               |    $500    |    [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Polygon/Polygon_L1.md)    |      Low     |
| **8** |    Mean Finance   |   Due to the gas usage limit for .transfer() and .send(), the .transfer() will be reverted, if the msg.sender is not an EOA.   |   $1,000   |  [click](https://github.com/Rassska/SoloAudits/blob/main/Immunefi/Mean%20Finance/Mean_L1.md)  |      Low     |
| **9** |                   |                                                                                                                                |            |                                                                                               |              |