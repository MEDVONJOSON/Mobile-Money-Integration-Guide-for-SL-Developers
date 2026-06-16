// examples/orange-money-example.js
// Runnable example for Orange Money integration
// Run: node examples/orange-money-example.js

require('dotenv').config();
const axios = require('axios');

// ── 1. Authentication ──────────────────────────────────────────────────────
async function getOrangeAccessToken() {
  const credentials = Buffer.from(
    `${process.env.ORANGE_CLIENT_ID}:${process.env.ORANGE_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    'https://api.orange.com/oauth/v3/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

// ── 2. Initiate Payment ────────────────────────────────────────────────────
async function initiateOrangePayment(token, { amount, orderId, description }) {
  const response = await axios.post(
    'https://api.orange.com/orange-money-webpay/sl/v1/webpayment',
    {
      merchant_key: process.env.ORANGE_MERCHANT_KEY,
      currency: 'SLL',
      order_id: orderId,
      amount,
      return_url: 'https://yourapp.com/payment/success',
      cancel_url: 'https://yourapp.com/payment/cancel',
      notif_url: 'https://yourapp.com/webhooks/orange-money',
      lang: 'en',
      reference: description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.ORANGE_SUBSCRIPTION_KEY,
      },
    }
  );

  return response.data;
}

// ── 3. Main ────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('--- Orange Money Integration Example ---\n');

    console.log('Step 1: Getting access token...');
    const token = await getOrangeAccessToken();
    console.log('✅ Token obtained successfully\n');

    console.log('Step 2: Initiating payment...');
    const result = await initiateOrangePayment(token, {
      amount: 50000,
      orderId: `ORDER-${Date.now()}`,
      description: 'Test payment from SL Developers Guide',
    });

    console.log('✅ Payment initiated!');
    console.log('Payment URL:', result.payment_url);
    console.log('Pay Token:', result.pay_token);
    console.log('\nRedirect your customer to the Payment URL to complete payment.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
})();
