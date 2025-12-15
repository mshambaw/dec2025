// netlify/functions/stkpush.js
const fetch = require('node-fetch');

// Helper functions as outlined in guides
const getTimestamp = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const getPassword = (businessShortCode, passKey, timestamp) => {
    const passwordString = `${businessShortCode}${passKey}${timestamp}`;
    return Buffer.from(passwordString).toString('base64');
};

// Main function handler (Netlify Functions use this signature)
exports.handler = async (event, context) => {
    // 1. Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed. Use POST.' })
        };
    }

    try {
        // 2. Get data from your frontend form
        const { phone, amount } = JSON.parse(event.body);

        // 3. Basic validation
        if (!phone || !amount) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Phone number and amount are required.' })
            };
        }

        // 4. Format the phone number to required 2547... format
        let formattedPhone = phone;
        if (phone.startsWith('0')) {
            formattedPhone = `254${phone.slice(1)}`;
        } else if (phone.startsWith('+254')) {
            formattedPhone = phone.slice(1);
        }
        // Ensure it's 12 digits starting with 254[citation:2]
        if (!/^254[0-9]{9}$/.test(formattedPhone)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid phone number format.' })
            };
        }

        // 5. GET YOUR CREDENTIALS FROM NETLIFY'S ENVIRONMENT VARIABLES
        const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
        const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
        const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE; // e.g., 174379 for sandbox
        const PASSKEY = process.env.MPESA_PASSKEY;
        const CALLBACK_URL = process.env.MPESA_CALLBACK_URL; // Must be a public URL

        // CRITICAL: Check if credentials are present
        if (!CONSUMER_KEY || !CONSUMER_SECRET || !BUSINESS_SHORTCODE || !PASSKEY) {
            console.error('Missing one or more M-Pesa credentials in environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Server configuration incomplete. Missing API credentials.'
                })
            };
        }

        // 6. Get Access Token from Safaricom[citation:1][citation:4]
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: { 'Authorization': `Basic ${auth}` }
        });

        if (!tokenResponse.ok) {
            throw new Error(`Failed to get access token: ${tokenResponse.status}`);
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 7. Prepare and send STK Push request
        const timestamp = getTimestamp();
        const password = getPassword(BUSINESS_SHORTCODE, PASSKEY, timestamp);

        const stkRequestBody = {
            BusinessShortCode: BUSINESS_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: BUSINESS_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: CALLBACK_URL,
            AccountReference: 'MissionDonation',
            TransactionDesc: 'Donation'
        };

        const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stkRequestBody)
        });

        const stkData = await stkResponse.json();

        // 8. Return result to your frontend page
        if (stkData.ResponseCode === "0") {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Payment request sent! Please check your phone to enter your M-PESA PIN.',
                    data: stkData
                })
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: stkData.ResponseDescription || 'Failed to initiate payment.',
                    data: stkData
                })
            };
        }

    } catch (error) {
        console.error('STK Push error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An internal server error occurred.',
                error: error.message
            })
        };
    }
};
