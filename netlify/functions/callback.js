// netlify/functions/callback.js - COMPATIBLE VERSION
exports.handler = function(event, context, callback) {
    console.log('M-Pesa Callback received');
    
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return callback(null, {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        });
    }
    
    try {
        var callbackData = JSON.parse(event.body);
        console.log('Callback data:', JSON.stringify(callbackData));
        
        // Always return success to M-Pesa
        return callback(null, {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ResultCode: 0,
                ResultDesc: 'Success'
            })
        });
        
    } catch (error) {
        console.error('Callback error:', error);
        return callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                ResultCode: 0,
                ResultDesc: 'Success'
            })
        });
    }
};
