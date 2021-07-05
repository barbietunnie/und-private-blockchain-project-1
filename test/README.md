# Private Blockchain Application - Test Results

## Running

1. Run the application from the command line/terminal:

```
node app.js
```

2. Connect to server at `http://localhost:8000/`. You should see in your terminal a message indicating that the server is listening in port 8000:

> Server Listening for port: 8000

## Test Results

1. Request Genesis Block:
    ![Request: http://localhost:8000/block/height/0 ](1_genesis_block.png)
2. Request ownership:
    ![Request: http://localhost:8000/requestValidation ](2_request_validation.png)
3. Sign message with Wallet:
    ![Use the Wallet to sign a message](3_sign_message.png)
4. Submit your Star
     ![Request: http://localhost:8000/submitstar](4_submit_star.png)
5. Retrieve Stars owned by me
    ![Request: http://localhost:8000/blocks/<WALLET_ADDRESS>](5_retrieve_stars.png)