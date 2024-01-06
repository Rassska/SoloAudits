const ethers = require('ethers');
const fetch = require("node-fetch");
const retry = require("async-retry");
const fs = require("fs");

const { Network, Alchemy, Utils} = require('alchemy-sdk');
const { Web3 } = require('web3');

require('dotenv').config();

const settings = {
    apiKey: process.env.apiKey,
    apiURL: process.env.apiURL,
    network: Network.ETH_MAINNET,
};


const alchemy = new Alchemy(settings);
const web3 = new Web3(settings.apiURL);
const provider = new ethers.providers.JsonRpcProvider(settings.apiURL);

const OffChainOracleAbi = [{ inputs: [{ internalType: 'contract MultiWrapper', name: '_multiWrapper', type: 'address' }, { internalType: 'contract IOracle[]', name: 'existingOracles', type: 'address[]' }, { internalType: 'enum OffchainOracle.OracleType[]', name: 'oracleTypes', type: 'uint8[]' }, { internalType: 'contract IERC20[]', name: 'existingConnectors', type: 'address[]' }, { internalType: 'contract IERC20', name: 'wBase', type: 'address' }, { internalType: 'address', name: 'owner', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { inputs: [], name: 'ArraysLengthMismatch', type: 'error' }, { inputs: [], name: 'ConnectorAlreadyAdded', type: 'error' }, { inputs: [], name: 'InvalidOracleTokenKind', type: 'error' }, { inputs: [], name: 'OracleAlreadyAdded', type: 'error' }, { inputs: [], name: 'SameTokens', type: 'error' }, { inputs: [], name: 'TooBigThreshold', type: 'error' }, { inputs: [], name: 'UnknownConnector', type: 'error' }, { inputs: [], name: 'UnknownOracle', type: 'error' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'contract IERC20', name: 'connector', type: 'address' }], name: 'ConnectorAdded', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'contract IERC20', name: 'connector', type: 'address' }], name: 'ConnectorRemoved', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'contract MultiWrapper', name: 'multiWrapper', type: 'address' }], name: 'MultiWrapperUpdated', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'contract IOracle', name: 'oracle', type: 'address' }, { indexed: false, internalType: 'enum OffchainOracle.OracleType', name: 'oracleType', type: 'uint8' }], name: 'OracleAdded', type: 'event' }, { anonymous: false, inputs: [{ indexed: false, internalType: 'contract IOracle', name: 'oracle', type: 'address' }, { indexed: false, internalType: 'enum OffchainOracle.OracleType', name: 'oracleType', type: 'uint8' }], name: 'OracleRemoved', type: 'event' }, { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' }, { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }], name: 'OwnershipTransferred', type: 'event' }, { inputs: [{ internalType: 'contract IERC20', name: 'connector', type: 'address' }], name: 'addConnector', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'contract IOracle', name: 'oracle', type: 'address' }, { internalType: 'enum OffchainOracle.OracleType', name: 'oracleKind', type: 'uint8' }], name: 'addOracle', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'connectors', outputs: [{ internalType: 'contract IERC20[]', name: 'allConnectors', type: 'address[]' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'srcToken', type: 'address' }, { internalType: 'contract IERC20', name: 'dstToken', type: 'address' }, { internalType: 'bool', name: 'useWrappers', type: 'bool' }], name: 'getRate', outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'srcToken', type: 'address' }, { internalType: 'bool', name: 'useSrcWrappers', type: 'bool' }], name: 'getRateToEth', outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'srcToken', type: 'address' }, { internalType: 'bool', name: 'useSrcWrappers', type: 'bool' }, { internalType: 'contract IERC20[]', name: 'customConnectors', type: 'address[]' }, { internalType: 'uint256', name: 'thresholdFilter', type: 'uint256' }], name: 'getRateToEthWithCustomConnectors', outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'srcToken', type: 'address' }, { internalType: 'bool', name: 'useSrcWrappers', type: 'bool' }, { internalType: 'uint256', name: 'thresholdFilter', type: 'uint256' }], name: 'getRateToEthWithThreshold', outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'srcToken', type: 'address' }, { internalType: 'contract IERC20', name: 'dstToken', type: 'address' }, { internalType: 'bool', name: 'useWrappers', type: 'bool' }, { internalType: 'contract IERC20[]', name: 'customConnectors', type: 'address[]' }, { internalType: 'uint256', name: 'thresholdFilter', type: 'uint256' }], name: 'getRateWithCustomConnectors', outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'srcToken', type: 'address' }, { internalType: 'contract IERC20', name: 'dstToken', type: 'address' }, { internalType: 'bool', name: 'useWrappers', type: 'bool' }, { internalType: 'uint256', name: 'thresholdFilter', type: 'uint256' }], name: 'getRateWithThreshold', outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'multiWrapper', outputs: [{ internalType: 'contract MultiWrapper', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'oracles', outputs: [{ internalType: 'contract IOracle[]', name: 'allOracles', type: 'address[]' }, { internalType: 'enum OffchainOracle.OracleType[]', name: 'oracleTypes', type: 'uint8[]' }], stateMutability: 'view', type: 'function' }, { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'contract IERC20', name: 'connector', type: 'address' }], name: 'removeConnector', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'contract IOracle', name: 'oracle', type: 'address' }, { internalType: 'enum OffchainOracle.OracleType', name: 'oracleKind', type: 'uint8' }], name: 'removeOracle', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'contract MultiWrapper', name: '_multiWrapper', type: 'address' }], name: 'setMultiWrapper', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' }];
const offChainOracleAddress = '0x3E1Fe1Bd5a5560972bFa2D393b9aC18aF279fF56';
const offchainOracle = new ethers.Contract(offChainOracleAddress, OffChainOracleAbi, provider);



async function getExtractedBlocks() {
    let result = await fs.readFileSync('../data/chainlinkPrices.json', 'utf-8');
    let extractedBlocks = [];
    let dailyBlocksObj = JSON.parse(result);

    for (let i = 0; i < dailyBlocksObj.length; i++) {
        extractedBlocks.push(dailyBlocksObj[i]["block"]);
    }
    return extractedBlocks;
}

const get1InchSpotPriceToEthWithRetriesForBlock = async (tokenData, extractedBlock) => {
    const result = await retry(
        async () => {
            let rate = await offchainOracle.getRateToEth(tokenData.token, false, { blockTag: extractedBlock });
            rate = rate / 1e18;
            let response = (rate * 1e18).toString();  
            return response;

        },
        {
            retries: 100,
            factor: 1.2,
            minTimeout: 100,
            maxTimeout: 60000,
            randomize: true,
        }
    );
    return result;
};

getExtractedBlocks()
    .then(function(extractedBlocks) {
        let spotPrices = fs.readFileSync('../data/dailyBlocks.json', 'utf-8');
        let spotPricesObj = JSON.parse(spotPrices);

        let stETHData = {
            token: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
            decimals: "18",
        }

        let rETHData = {
            token: "0xae78736Cd615f374D3085123A210448E74Fc6393",
            decimals: "18",
        }

        let cbETHData = {
            token: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
            decimals: "18",
        }

        let firstBatchEnd = Math.floor(extractedBlocks.length / 2);

        for (let i = firstBatchEnd; i < extractedBlocks.length; i++) {
            
            get1InchSpotPriceToEthWithRetriesForBlock(stETHData, extractedBlocks[i])
                .then(function(currentBlockPrice) {
                    spotPricesObj[i]["stETHSpotPrice"] = currentBlockPrice;
                })
                .then(function() {
                    fs.writeFileSync('../data/1inchSpotPricesTemp.json', JSON.stringify(spotPricesObj, null, 2));
                })
            get1InchSpotPriceToEthWithRetriesForBlock(rETHData, extractedBlocks[i])
                .then(function(currentBlockPrice) {
                    spotPricesObj[i]["rETHSpotPrice"] = currentBlockPrice;
                })
                .then(function() {
                    fs.writeFileSync('../data/1inchSpotPricesTemp.json', JSON.stringify(spotPricesObj, null, 2));

                })
            get1InchSpotPriceToEthWithRetriesForBlock(cbETHData, extractedBlocks[i])
                .then(function(currentBlockPrice) {
                    spotPricesObj[i]["cbETHSpotPrice"] = currentBlockPrice;
                })
                .then(function() {
                    fs.writeFileSync('../data/1inchSpotPricesTemp.json', JSON.stringify(spotPricesObj, null, 2));

                })
            
        }
    })

