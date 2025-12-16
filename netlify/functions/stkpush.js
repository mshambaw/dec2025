// netlify/functions/stkpush.js - COMPATIBLE VERSION
exports.handler = function(event, context, callback) {
    // 1. Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return callback(null, {
            statusCode: 405,
            body: JSON.stringify({ 
                success: false,
                message: 'Method not allowed. Use POST.' 
            })
        });
    }
    
    try {
        // 2. Parse the request body
        var data = JSON.parse(event.body);
        var phone = data.phone;
        var amount = data.amount;

        // 3. Validate inputs
        if (!phone || !amount) {
            return callback(null, {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'Phone number and amount are required'
                })
            });
        }

        // 4. Format phone number
        var formattedPhone = phone;
        if (phone.startsWith('0') && phone.length === 10) {
            formattedPhone = '254' + phone.slice(1);
        } else if (phone.startsWith('7') && phone.length === 9) {
            formattedPhone = '254' + phone;
        } else if (phone.startsWith('254') && phone.length === 12) {
            // Already correct format
        } else {
            return callback(null, {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid phone number format. Use 07XXXXXXXX or 2547XXXXXXXX'
                })
            });
        }

        // 5. GET YOUR CREDENTIALS FROM ENVIRONMENT VARIABLES
        var CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
        var CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
        var BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE;
        var PASSKEY = process.env.MPESA_PASSKEY;
        var CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://missioncountdown.netlify.app/.netlify/functions/callback';

        // 6. Check if credentials exist
     if (!CONSUMER_KEY || !CONSUMER_SECRET || !BUSINESS_SHORTCODE || !PASSKEY) {
    console.error('Missing M-Pesa credentials - redirecting to warning page');
    return callback(null, {
        statusCode: 302,
        headers: {
            'Location': '/donatewarn.html',
            'Cache-Control': 'no-cache'
        },
        body: ''
    });
}

        // 7. For now, return a success message (we'll add M-Pesa integration later)
        console.log('STK Push requested:', { phone: formattedPhone, amount: amount });
        
        return callback(null, {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'STK Push simulation successful!',
                data: {
                    phone: formattedPhone,
                    amount: amount,
                    timestamp: new Date().toISOString(),
                    note: 'M-Pesa integration will be added next'
                }
            })
        });

    } catch (error) {
        console.error('STK Push error:', error);
        return callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Internal server error: ' + error.message
            })
        });
    }
};
