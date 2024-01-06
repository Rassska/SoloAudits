const ethers = require('ethers');
const fetch = require("node-fetch");
const retry = require("async-retry");
const fs = require("fs");

const { Network, Alchemy, Utils} = require('alchemy-sdk');
const { Web3 } = require('web3');
const jsonMerger = require("json-merger");

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



async function mergeFiles() {
    let mergeResult = jsonMerger.mergeFiles(["../data/1inchSpotPrices.json", "../data/1inchSpotPricesTemp.json"]);
    fs.writeFileSync('../data/merged1inchSpotPrices.json', JSON.stringify(mergeResult, null, 2))
    console.log(mergeResult);
}

mergeFiles()