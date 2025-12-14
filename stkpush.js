const axios = require('axios');

exports.handler = async (event) => {
  const { phone, amount } = JSON.parse(event.body);

  const key = process.env.CONSUMER_KEY;
  const secret = process.env.CONSUMER_SECRET;
  const shortcode = process.env.SHORTCODE;
  const passkey = process.env.PASSKEY;

  const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

  // Get token
  const tokenRes = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: 'Basic ' +
          Buffer.from(key + ':' + secret).toString('base64')
      }
    }
  );

  const accessToken = tokenRes.data.access_token;

  // STK Push
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
      CallBackURL: "https://YOUR-SITE.netlify.app/.netlify/functions/callback",
      AccountReference: "Philadelphia Ministry",
      TransactionDesc: "Mission Donation"
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "📲 Enter M-Pesa PIN on your phone to complete donation"
    })
  };
};
