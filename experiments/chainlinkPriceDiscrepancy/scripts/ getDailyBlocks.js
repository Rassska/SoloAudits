const retry = require('async-retry');
const fetch = require('node-fetch');
const fs = require("fs");

const { Network, Alchemy } = require('alchemy-sdk');
const EthDater = require('ethereum-block-by-date');
const { Web3 } = require('web3');



const settings = {
    apiKey: 'w4iGdDwlbhkAWygEmNbqElo0hTZWCa-s',
    apiURL: 'https://eth-mainnet.g.alchemy.com/v2/w4iGdDwlbhkAWygEmNbqElo0hTZWCa-s',
    network: Network.ETH_MAINNET,

};

const alchemy = new Alchemy(settings);
const web3 = new Web3(settings.apiURL);
const dater = new EthDater(web3);

const fetchWithRetries = async () => {
    const result = await retry(
        async () => {
            
            let blocks = await dater.getEvery(
                'hours',
                '2023-04-12T00:00:00Z', 
                '2023-12-01T00:00:00Z',
                1,
                true,
                false
            );
            
            return blocks;
        },
        {
            retries: 100,
            factor: 1.2,
            minTimeout: 10,
            maxTimeout: 60000,
            randomize: true,
        }
    );
    return result;
};

fetchWithRetries()
    .then(function(result) {
        fs.writeFileSync('../data/dailyBlocks.json', JSON.stringify(result, null, 2));
        console.log(result);
    });