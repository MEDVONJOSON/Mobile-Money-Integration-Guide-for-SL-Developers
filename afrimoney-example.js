// examples/afrimoney-example.js
// Runnable example for Afrimoney integration
// Run: node examples/afrimoney-example.js

require('dotenv').config();
const axios = require('axios');

const AFRIMONEY_BASE_URL = 'https://sandbox.afrimoney.sl/v1';

function getHeaders() {
  return {
    'X-API-Key': process.env.AFRIMONEY_API_KEY,
    'X-API-Secret': process.env.AFRIMONEY_API_SECRET,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ── 1. Initiate Collection ─────────────────────────────────────────────────
async function initiateCollection({ amount, customerPhone, externalId, description }) {
  const response = await axios.post(
    `${AFRIMONEY_BASE_URL}/collection/requesttopay`,
    {
      amount: amount.toString(),
      currency: 'SLL',
      externalId,
      payer: { partyIdType: 'MSISDN', partyId: customerPhone },
      payerMessage: description,
      payeeNote: `Ref: ${externalId}`,
      callbackUrl: 'https://yourapp.com/webhooks/afrimoney',
    },
    { headers: getHeaders() }
  );

  return response.headers['x-reference-id'];
}

// ── 2. Check Status ────────────────────────────────────────────────────────
async function checkStatus(referenceId) {
  const response = await axios.get(
    `${AFRIMONEY_BASE_URL}/collection/requesttopay/${referenceId}`,
    { headers: getHeaders() }
  );
  return response.data;
}

// ── 3. Main ────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('--- Afrimoney Integration Example ---\n');

    const externalId = `TXN-${Date.now()}`;

    console.log('Step 1: Initiating collection request...');
    const referenceId = await initiateCollection({
      amount: 25000,
      customerPhone: '23278000001', // sandbox test number (always succeeds)
      externalId,
      description: 'Test collection from SL Developers Guide',
    });
    console.log('✅ Collection initiated. Reference ID:', referenceId, '\n');

    // Wait 3 seconds then check status (sandbox processes instantly)
    console.log('Step 2: Checking transaction status...');
    await new Promise(r => setTimeout(r, 3000));
    const status = await checkStatus(referenceId);

    console.log('✅ Status:', status.status);
    console.log('Amount:', status.amount, 'SLL');
    console.log('Payer:', status.payer?.partyId);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
})();
