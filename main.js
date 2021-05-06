const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { Blockchain, Transaction } = require('./blockchain');

const myKey = ec.keyFromPrivate('25c203b310da8935baf5cd1c457e03c1681b545e5af55567e3f34ed2b30f7092');
const myWalletAddress = myKey.getPublic('hex');


const FakeCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'dung-bui', 10);
tx1.signTransaction(myKey);
FakeCoin.addTransaction(tx1);

console.log('\n Starting the miner ...');
FakeCoin.minePendingTransaction(myWalletAddress);

console.log('\n Balance of dung is:', FakeCoin.getBalanceOfAdress(myWalletAddress));
console.log(FakeCoin.isChainValid() && 'chain is valid');