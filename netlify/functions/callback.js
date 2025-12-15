// netlify/functions/callback.js
exports.handler = async function(event, context) {
    console.log('📱 M-PESA CALLBACK RECEIVED');
    
    // Only accept POST requests (M-Pesa sends POST)
    if (event.httpMethod !== 'POST') {
        console.log('❌ Wrong method:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
        };
    }
    
    try {
        // Parse the callback data from M-Pesa
        const callbackData = JSON.parse(event.body);
        console.log('📦 Full callback data:', JSON.stringify(callbackData, null, 2));
        
        // Extract important information
        const stkCallback = callbackData?.Body?.stkCallback;
        
        if (!stkCallback) {
            console.log('⚠️ No STK callback found in data');
            return {
                statusCode: 200, // Always return 200 to M-Pesa
                body: JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' })
            };
        }
        
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        const callbackMetadata = stkCallback.CallbackMetadata;
        const checkoutRequestID = stkCallback.CheckoutRequestID;
        const merchantRequestID = stkCallback.MerchantRequestID;
        
        console.log('🔍 Callback Details:');
        console.log('- ResultCode:', resultCode);
        console.log('- ResultDesc:', resultDesc);
        console.log('- CheckoutRequestID:', checkoutRequestID);
        console.log('- MerchantRequestID:', merchantRequestID);
        
        // Payment was successful (ResultCode 0 means success)
        if (resultCode === 0 && callbackMetadata) {
            console.log('✅ PAYMENT SUCCESSFUL!');
            
            // Extract payment details
            const metadataItems = callbackMetadata.Item || [];
            let paymentDetails = {};
            
            metadataItems.forEach(item => {
                if (item.Name === 'Amount') paymentDetails.amount = item.Value;
                if (item.Name === 'MpesaReceiptNumber') paymentDetails.receipt = item.Value;
                if (item.Name === 'TransactionDate') paymentDetails.date = item.Value;
                if (item.Name === 'PhoneNumber') paymentDetails.phone = item.Value;
            });
            
            console.log('💰 Payment Details:', paymentDetails);
            
            // HERE'S WHERE YOU SAVE TO DATABASE/SPREADSHEET
            // You should save: receipt number, amount, phone, date, checkoutRequestID
            
            // Example: Log to console (replace with your database logic)
            const donationRecord = {
                receipt: paymentDetails.receipt,
                amount: paymentDetails.amount,
                phone: paymentDetails.phone,
                date: paymentDetails.date,
                checkoutID: checkoutRequestID,
                status: 'completed',
                timestamp: new Date().toISOString()
            };
            
            console.log('💾 Donation to save:', donationRecord);
            
            // TODO: Add your database saving logic here
            // Options: Google Sheets, Airtable, Firebase, Supabase, MySQL
            
        } else {
            console.log('❌ PAYMENT FAILED:', resultDesc);
            // Payment failed or was cancelled
            // You might want to log this for troubleshooting
        }
        
        // IMPORTANT: Always return success to M-Pesa
        // Even if payment failed, M-Pesa expects a 200 response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ResultCode: 0,
                ResultDesc: 'Success'
            })
        };
        
    } catch (error) {
        console.error('🔥 CALLBACK PROCESSING ERROR:', error);
        
        // Still return success to M-Pesa even on our error
        return {
            statusCode: 200,
            body: JSON.stringify({
                ResultCode: 0,
                ResultDesc: 'Success'
            })
        };
  
    
    }

    // Add this function to your callback.js, and call it when payment is successful
async function saveToGoogleSheets(donationData) {
    const webAppUrl =// In your callback.js function
const webAppUrl = 'https://script.google.com/macros/s/AKfycbyk0El0jehxu0EpLek_bIwtVmV-4zyTqe9YXXJfbYxKKAnDMa-mYPzT4WB83Qh1V86C/exec';
    
    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donationData)
        });
        
        const result = await response.json();
        console.log('Google Sheets save result:', result);
        return result.success;
    } catch (error) {
        console.error('Failed to save to Google Sheets:', error);
        return false;
    }
}

// Then in your successful payment section, add:
// const saved = await saveToGoogleSheets(donationRecord);
// console.log('Saved to sheets:', saved);
};

