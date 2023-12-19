# Oracle data feeds are insufficiently validated

## Vulnerability Details
* In order to verify the Chainlink oracle data feeds response, Asymmetry utilizes the following logic, which could be improved to ensure the data feeds freshness: 
  *   ```Solidity
        // verify chainlink response
        if (
            (!_validate ||
                (cl.success == true &&
                    cl.roundId != 0 &&
                    cl.answer >= 0 && 
                    cl.updatedAt != 0 &&
                    cl.updatedAt <= block.timestamp &&
                    block.timestamp - cl.updatedAt <= 25 hours))
        ) {
            return uint256(cl.answer);
        } else {
            revert ChainlinkFailed();
        }  
        ```


## Recommended Mitigation Steps
- Short term: 
  - Replace `cl.answer >= 0` with `cl.answer > 0`
  - In addition to `block.timestamp - cl.updatedAt <= 25 hours` ensure that the answer was computed in the last round by adding `answeredInRound >= roundId`
  
- Long term: N/A