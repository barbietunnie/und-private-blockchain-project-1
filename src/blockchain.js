/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require("crypto-js/sha256");
const BlockClass = require("./block.js");
const bitcoinMessage = require("bitcoinjs-message");

class Blockchain {
  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = [];
    this.height = -1;
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new BlockClass.Block({ data: "Genesis Block" });
      await this._addBlock(block);
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  getChainHeight() {
    return new Promise((resolve, reject) => {
      resolve(this.height);
    });
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  _addBlock(block) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        // validate the blockchain before any block addition
        const errors = await self.validateChain();
        if (errors.length > 0) {
          console.error(errors);
          throw new Error("Unable to add block to defective chain!");
        }
        
        // Set the previous block hash if height > -1
        if (self.height > -1) {
          block.previousBlockHash = self.chain[self.chain.length - 1].hash;
        }

        // Set the timestamp
        block.time = new Date().getTime().toString().slice(0, -3);

        // Set the height
        block.height = self.chain.length;

        // Create the block hash (note that block.hash == null during SHA256 computation)
        block.hash = SHA256(JSON.stringify(block)).toString();

        const status = await block.validate();
        if (!status) {
          reject(new Error("Unable to add block because it is invalid"));
          return;
        }

        // add the block to the blockchain
        self.chain.push(block);

        // Update the blockchain height
        self.height += 1;

        resolve(block);
      } catch (err) {
        reject(
          new Error(
            `An error occurred while adding the block. Details: ${err.message}`
          )
        );
      }
    });
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  requestMessageOwnershipVerification(address) {
    return new Promise((resolve) => {
      const currentTime = new Date().getTime().toString().slice(0, -3);
      const message = `${address}:${currentTime}:starRegistry`;
      resolve(message);
    });
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   *
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   *
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  submitStar(address, message, signature, star) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        const tokens = message.split(":");
        let time = tokens[1]; // might throw an exception, however this will be caught by the error handler
        time = parseInt(time);

        // Get the current time
        let currentTime = new Date().getTime().toString().slice(0, -3);
        const timeLimit = 5 * 60; // 5 minutes

        if (currentTime - time > timeLimit) {
          console.error(`Time limit exceeded: ${currentTime - time}s`);
          reject("Cannot verify message as the time limit is exceeded");
          return;
        }

        const status = bitcoinMessage.verify(message, address, signature);
        if (!status) {
          // verification is not valid
          reject("Message verification failed");
          return;
        }

        const block = new BlockClass.Block({ star, owner: address });
        await self._addBlock(block);
        resolve(block);
      } catch (err) {
        reject(
          new Error(
            `Unable to register block with star object. Details: ${err.message}`
          )
        );
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  getBlockByHash(hash) {
    let self = this;
    return new Promise((resolve, reject) => {
      const result = self.chain.filter((block) => block.hash === hash);
      if (result.length > 0) {
        resolve(result[0]);
        return;
      }

      reject(new Error("No hash was found with the specified hash"));
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    let self = this;
    return new Promise((resolve, reject) => {
      let block = self.chain.find(p => p.height === height);
      if (block) {
        resolve(block);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  getStarsByWalletAddress(address) {
    let self = this;
    let stars = [];
    return new Promise((resolve, reject) => {
      self.chain.filter(async (block) => {
        try {
          const data = await block.getBData();
          const blockAddr = data.owner;
          if (blockAddr && blockAddr === address) {
            stars.push(data);
          }
        } catch (err) {
          console.error(err);
        }
      });

      // return the list of stars found
      resolve(stars);
    });
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  validateChain() {
    let self = this;
    let errorLog = [];
    return new Promise(async (resolve, reject) => {
      const validationPromises = [];
      for (let i = 0; i < self.chain.length; i++) {
        const block = self.chain[i];
        validationPromises.push(block.validate()); // aggregate the promises
      }

      const results = await Promise.all(validationPromises);
      results.forEach(outcome => {
        if (!outcome) {
          errorLog.push(`Block '${block.hash}' failed validation`);
        }
      });

      for (let i = 0; i < self.chain.length; i++) {
        if (i > 0) {
          const previousBlock = self.chain[i - 1];
          if (block.previousBlockHash !== previousBlock.hash) {
            errorLog.push(
              `Broken chain - "${block.hash}" previous block hash is invalid`
            );
          }
        }
      }
      resolve(errorLog);
    })  ;
  }
}

module.exports.Blockchain = Blockchain;
