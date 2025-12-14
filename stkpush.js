const axios = require('axios');

exports.handler = async (event) => {
  const { phone, amount } = JSON.parse(event.body);

  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;
  const callbackURL = "https://your-site.netlify.app/.netlify/functions/callback";

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0,14);

  // Generate password
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

  // Get access token
  const tokenRes = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64')
      }
    }
  );

  const accessToken = tokenRes.data.access_token;

  // STK Push request
  await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: "Philadelphia Donation",
      TransactionDesc: "Mission Support"
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Check your phone to complete payment" })
  };
};
