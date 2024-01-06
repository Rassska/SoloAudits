const fetch = require("node-fetch");
const retry = require("async-retry");
const fs = require("fs");

const { Network, Alchemy, Utils } = require('alchemy-sdk');
const { Web3 } = require('web3');

require('dotenv').config();

const settings = {
    apiKey: process.env.apiKey, 
    apiURL: process.env.apiURL, 
    network: Network.ETH_MAINNET,

};


const alchemy = new Alchemy(settings);
const web3 = new Web3(settings.apiURL);

async function getExtractedBlocks() {
    let result = await fs.readFileSync('../data/dailyBlocks.json', 'utf-8');
    let extractedBlocks = [];
    let dailyBlocksObj = JSON.parse(result);

    for (let i = 0; i < dailyBlocksObj.length; i++) {
        extractedBlocks.push(dailyBlocksObj[i]["block"]);
    }
    return extractedBlocks;
}

const getChainlinkPriceWithRetriesForBlock = async (extractedBlock, tx) => {
    const result = await retry(
        async () => {
            let response = Utils.formatUnits(await alchemy.core.call(tx, extractedBlock), "wei");
            return response;
        },
        {
            retries: 50,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 60000,
            randomize: true,
        }
    );
    return result;
};

getExtractedBlocks()
    .then(function(extractedBlocks) {
        let chainlinkPrices = fs.readFileSync('../data/dailyBlocks.json', 'utf-8');
        let chainlinkPricesObj = JSON.parse(chainlinkPrices);

        let stETHChainlinkOraclePayload = {
            to: "0x86392dC19c0b719886221c78AB11eb8Cf5c52812",
            data: "0x50d25bcd",
        }

        let rETHChainlinkOraclePayload = {
            to: "0x536218f9E9Eb48863970252233c8F271f554C2d0",
            data: "0x50d25bcd",
        }

        let cbETHTChainlinkOraclePayload = {
            to: "0xF017fcB346A1885194689bA23Eff2fE6fA5C483b",
            data: "0x50d25bcd",
        }
        
        let firstBatchEnd = Math.floor(extractedBlocks.length / 2);
        console.log(firstBatchEnd);

        for (let i = 0; i < firstBatchEnd; i++) {
            getChainlinkPriceWithRetriesForBlock(extractedBlocks[i], stETHChainlinkOraclePayload)
                .then(function(currentBlockPrice) {
                    chainlinkPricesObj[i]["stETHprice"] = currentBlockPrice;
                })
                .then(function() {
                    fs.writeFileSync('../data/chainlinkPricesTemp1.json', JSON.stringify(chainlinkPricesObj, null, 2));
                })
            getChainlinkPriceWithRetriesForBlock(extractedBlocks[i], rETHChainlinkOraclePayload)
                .then(function(currentBlockPrice) {
                    chainlinkPricesObj[i]["rETHprice"] = currentBlockPrice;
                })
                .then(function() {
                    fs.writeFileSync('../data/chainlinkPricesTemp1.json', JSON.stringify(chainlinkPricesObj, null, 2));
                })
            getChainlinkPriceWithRetriesForBlock(extractedBlocks[i], cbETHTChainlinkOraclePayload)
                .then(function(currentBlockPrice) {
                    chainlinkPricesObj[i]["cbETHprice"] = currentBlockPrice;
                })
                .then(function() {
                    fs.writeFileSync('../data/chainlinkPricesTemp1.json', JSON.stringify(chainlinkPricesObj, null, 2));
                })
                
            
        }
    })




/*
const fetchWithRetries = async () => {
    const result = await retry(
        async () => {
            let tx = {
                to: "0xF017fcB346A1885194689bA23Eff2fE6fA5C483b",
                data: "0x50d25bcd",
            }
            // let response = Utils.formatUnits(await alchemy.core.call(tx, 18677750), "wei");
            
            let blocks = await dater.getEvery(
                'days', 
                '2022-12-01T00:00:00Z', 
                '2023-12-01T00:00:00Z',
                1,
                true,
                false 
            );
            
            return blocks;
        },
        {
            retries: 50,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 60000,
            randomize: true,
        }
    );
    return result;
};

fetchWithRetries()
    .then(data => fs.promises.writeFile('../data/dailyBlocks.json', JSON.stringify(data, null, 2)));

*/