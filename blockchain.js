const SHA256 = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  calculateHash() {
    return SHA256(
      this.fromAddress + this.toAddress + this.amount + this.timestamp
    ).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallet!");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("Block mined: " + this.hash);
  }

  hasValidTransaction() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block("2020-01-01", [], "0");
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransaction(miningRewardAddress) {
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    let block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLastBlock().hash
    );
    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    if (!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (transaction.amount <= 0) {
      throw new Error("Transaction amount should be higher than 0");
    }

    // Making sure that the amount sent is not greater than existing balance
    // if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
    //   throw new Error("Not enough balance");
    // }

    this.pendingTransactions.push(transaction);
    console.log('Transaction added: ', transaction.toString());
  }

  getBalanceOfAdress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tran of block.transactions) {
        if (tran.fromAddress === address) {
          balance -= tran.amount;
        }

        if (tran.toAddress === address) {
          balance += tran.amount;
        }
      }
    }
    return balance;
  }

  getAllTransactionsForWallet(address) {
      const txs = [];

      for (const block of this.chain) {
          for (const tx of block.transactions) {
              if(tx.fromAddress === address || tx.toAddress === address) {
                  txs.push(tx);
              }
          }
      }

      return txs;
  }

  isChainValid() {
     // Check if the Genesis block hasn't been tampered with by comparing
    // the output of createGenesisBlock with the first block on our chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransaction()) {
        console.log("transactions of block are wrong!");
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log("hash is wrong!");
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log("Previous hash is wrong");
        return false;
      }
    }
    return true;
  }
}

module.exports = {
  Blockchain,
  Transaction,
};
