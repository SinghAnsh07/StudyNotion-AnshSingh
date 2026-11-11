const axios = require("axios");

const getOAuthToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
            headers: {
                authorization: `Basic ${auth}`,
            },
        }
    );
    return response.data.access_token;
};

const initiateStkPush = async ({ phoneNumber, amount, accountReference, transactionDesc }) => {
    console.log("Initiating STK Push with the following details:", {
        phoneNumber,
        amount,
        accountReference,
        transactionDesc,
    });
    const token = await getOAuthToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const shortCode = process.env.MPESA_SHORTCODE; // e.g., 174379 for sandbox
    const passkey = process.env.MPESA_PASSKEY;

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const payload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber, // Format: 2547XXXXXXXX
        PartyB: shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
    };
    console.log("STK Push Payload:", payload);

    const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

module.exports = { initiateStkPush };