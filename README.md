# Mobile Money Integration Guide for SL Developers

**Author:** Mohamed Vonjo — Software Developer & IT Systems Specialist, Freetown, Sierra Leone  
**GitHub:** [github.com/MEDVONJOSON](https://github.com/MEDVONJOSON)  
**Published:** June 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Overview of SL Mobile Money Providers](#overview)
3. [Orange Money Integration](#orange-money)
   - Authentication
   - Initiating a Transfer
   - Webhook Handling
4. [Afrimoney Integration](#afrimoney)
   - Authentication
   - Initiating a Transfer
   - Webhook Handling
5. [Error Handling Best Practices](#error-handling)
6. [Testing Your Integration](#testing)
7. [Security Recommendations](#security)
8. [Summary & Next Steps](#summary)

---

## 1. Introduction <a name="introduction"></a>

Mobile money is the backbone of digital payments in Sierra Leone. With over 60% of financial transactions in the country processed through mobile money platforms, integrating these services into your application is no longer optional — it is essential.

This guide walks intermediate developers through integrating two of Sierra Leone's major mobile money providers: **Orange Money** and **Afrimoney**. You will learn how to authenticate, initiate transfers, and handle webhooks using practical JavaScript/TypeScript and Python code samples that you can run immediately.

By the end of this guide you will be able to:
- Authenticate with both Orange Money and Afrimoney APIs
- Initiate payments and transfers programmatically
- Handle real-time payment notifications via webhooks
- Apply security and error-handling best practices

---

## 2. Overview of SL Mobile Money Providers <a name="overview"></a>

| Provider | Network | API Type | Sandbox Available |
|---|---|---|---|
| Orange Money | Orange SL | REST API | Yes |
| Afrimoney | Africell SL | REST API | Yes |
| Monime | Multi-network | REST API | Yes |

This guide covers **Orange Money** and **Afrimoney** in full detail with working code samples.

---

## 3. Orange Money Integration <a name="orange-money"></a>

Orange Money is operated by Orange Sierra Leone and is one of the most widely used mobile money platforms in the country. Their API follows OAuth 2.0 for authentication and uses standard REST endpoints for transactions.

### 3.1 Authentication

Orange Money uses **OAuth 2.0 Client Credentials** flow. You will need:
- `client_id` — provided when you register your app on the Orange Developer Portal
- `client_secret` — your secret key
- `subscription_key` — your API subscription key

#### JavaScript / TypeScript

```javascript
// orange-money/auth.js

const axios = require('axios');

const ORANGE_BASE_URL = 'https://api.orange.com/oauth/v3';

async function getOrangeAccessToken() {
  const credentials = Buffer.from(
    `${process.env.ORANGE_CLIENT_ID}:${process.env.ORANGE_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.post(
      `${ORANGE_BASE_URL}/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;
    console.log('Orange Money token obtained. Expires in:', expires_in, 'seconds');
    return access_token;

  } catch (error) {
    console.error('Orange Money auth failed:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getOrangeAccessToken };
```

#### Python

```python
# orange_money/auth.py

import os
import base64
import requests

ORANGE_BASE_URL = "https://api.orange.com/oauth/v3"

def get_orange_access_token():
    client_id = os.environ["ORANGE_CLIENT_ID"]
    client_secret = os.environ["ORANGE_CLIENT_SECRET"]

    credentials = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode()

    headers = {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    response = requests.post(
        f"{ORANGE_BASE_URL}/token",
        data={"grant_type": "client_credentials"},
        headers=headers,
    )

    response.raise_for_status()
    token_data = response.json()
    print(f"Token obtained. Expires in: {token_data['expires_in']}s")
    return token_data["access_token"]
```

---

### 3.2 Initiating a Transfer (Payment Request)

Once authenticated, you can initiate a payment request to a customer's Orange Money wallet.

#### JavaScript / TypeScript

```javascript
// orange-money/transfer.js

const axios = require('axios');
const { getOrangeAccessToken } = require('./auth');

const ORANGE_API_URL = 'https://api.orange.com/orange-money-webpay/sl/v1';

async function initiateOrangePayment({ amount, customerPhone, orderId, description }) {
  const token = await getOrangeAccessToken();

  const payload = {
    merchant_key: process.env.ORANGE_MERCHANT_KEY,
    currency: 'SLL', // Sierra Leone Leone
    order_id: orderId,
    amount: amount,
    return_url: 'https://yourapp.com/payment/success',
    cancel_url: 'https://yourapp.com/payment/cancel',
    notif_url: 'https://yourapp.com/webhooks/orange-money', // webhook URL
    lang: 'en',
    reference: description,
  };

  try {
    const response = await axios.post(
      `${ORANGE_API_URL}/webpayment`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.ORANGE_SUBSCRIPTION_KEY,
        },
      }
    );

    const { payment_url, pay_token } = response.data;
    console.log('Payment initiated. Redirect customer to:', payment_url);
    return { payment_url, pay_token };

  } catch (error) {
    console.error('Payment initiation failed:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { initiateOrangePayment };
```

#### Python

```python
# orange_money/transfer.py

import os
import requests
from auth import get_orange_access_token

ORANGE_API_URL = "https://api.orange.com/orange-money-webpay/sl/v1"

def initiate_orange_payment(amount, customer_phone, order_id, description):
    token = get_orange_access_token()

    payload = {
        "merchant_key": os.environ["ORANGE_MERCHANT_KEY"],
        "currency": "SLL",
        "order_id": order_id,
        "amount": amount,
        "return_url": "https://yourapp.com/payment/success",
        "cancel_url": "https://yourapp.com/payment/cancel",
        "notif_url": "https://yourapp.com/webhooks/orange-money",
        "lang": "en",
        "reference": description,
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": os.environ["ORANGE_SUBSCRIPTION_KEY"],
    }

    response = requests.post(
        f"{ORANGE_API_URL}/webpayment",
        json=payload,
        headers=headers,
    )

    response.raise_for_status()
    data = response.json()
    print(f"Payment initiated. Redirect to: {data['payment_url']}")
    return data
```

---

### 3.3 Webhook Handling (Orange Money)

Orange Money sends a POST request to your `notif_url` when a payment is completed or fails. You must verify the request and update your database accordingly.

#### JavaScript (Express.js)

```javascript
// orange-money/webhook.js

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

router.post('/webhooks/orange-money', express.json(), (req, res) => {
  const { status, order_id, txnid, amount } = req.body;

  // Always respond 200 immediately to acknowledge receipt
  res.status(200).json({ received: true });

  // Verify the notification is legitimate
  const expectedHash = crypto
    .createHmac('sha256', process.env.ORANGE_WEBHOOK_SECRET)
    .update(`${order_id}${amount}`)
    .digest('hex');

  if (req.headers['x-orange-signature'] !== expectedHash) {
    console.warn('Invalid Orange Money webhook signature. Ignoring.');
    return;
  }

  if (status === 'SUCCESS') {
    console.log(`Payment confirmed for order ${order_id}. Transaction ID: ${txnid}`);
    // TODO: Update your database — mark order as paid
    updateOrderStatus(order_id, 'paid', txnid);
  } else {
    console.log(`Payment failed for order ${order_id}. Status: ${status}`);
    updateOrderStatus(order_id, 'failed', txnid);
  }
});

async function updateOrderStatus(orderId, status, txnid) {
  // Your database update logic here
  console.log(`Order ${orderId} updated to ${status} (txn: ${txnid})`);
}

module.exports = router;
```

#### Python (Flask)

```python
# orange_money/webhook.py

import os
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks/orange-money', methods=['POST'])
def orange_webhook():
    data = request.get_json()
    status = data.get('status')
    order_id = data.get('order_id')
    txnid = data.get('txnid')
    amount = data.get('amount')

    # Respond immediately
    response = jsonify({"received": True})

    # Verify signature
    secret = os.environ["ORANGE_WEBHOOK_SECRET"]
    expected = hmac.new(
        secret.encode(),
        f"{order_id}{amount}".encode(),
        hashlib.sha256
    ).hexdigest()

    incoming_sig = request.headers.get('X-Orange-Signature', '')
    if not hmac.compare_digest(expected, incoming_sig):
        print("Invalid webhook signature. Ignoring.")
        return response

    if status == "SUCCESS":
        print(f"Payment confirmed: order={order_id}, txn={txnid}")
        update_order_status(order_id, "paid", txnid)
    else:
        print(f"Payment failed: order={order_id}, status={status}")
        update_order_status(order_id, "failed", txnid)

    return response

def update_order_status(order_id, status, txnid):
    # Your database update logic here
    print(f"Order {order_id} -> {status} (txn: {txnid})")
```

---

## 4. Afrimoney Integration <a name="afrimoney"></a>

Afrimoney is operated by Africell Sierra Leone. Their API uses API Key authentication and provides endpoints for collections (receiving money) and disbursements (sending money).

### 4.1 Authentication

Afrimoney uses **API Key + Secret** authentication passed in request headers.

#### JavaScript / TypeScript

```javascript
// afrimoney/auth.js

function getAfrimoneyHeaders() {
  return {
    'X-API-Key': process.env.AFRIMONEY_API_KEY,
    'X-API-Secret': process.env.AFRIMONEY_API_SECRET,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

module.exports = { getAfrimoneyHeaders };
```

#### Python

```python
# afrimoney/auth.py

import os

def get_afrimoney_headers():
    return {
        "X-API-Key": os.environ["AFRIMONEY_API_KEY"],
        "X-API-Secret": os.environ["AFRIMONEY_API_SECRET"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
```

---

### 4.2 Initiating a Collection (Receive Payment)

A collection request prompts a customer's Afrimoney wallet to approve a payment to your merchant account.

#### JavaScript / TypeScript

```javascript
// afrimoney/transfer.js

const axios = require('axios');
const { getAfrimoneyHeaders } = require('./auth');

const AFRIMONEY_BASE_URL = 'https://api.afrimoney.sl/v1';

async function initiateAfrimoneyCollection({ amount, customerPhone, externalId, description }) {
  const payload = {
    amount: amount.toString(),
    currency: 'SLL',
    externalId: externalId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: customerPhone, // e.g. "23278123456"
    },
    payerMessage: description,
    payeeNote: `Payment ref: ${externalId}`,
    callbackUrl: 'https://yourapp.com/webhooks/afrimoney',
  };

  try {
    const response = await axios.post(
      `${AFRIMONEY_BASE_URL}/collection/requesttopay`,
      payload,
      { headers: getAfrimoneyHeaders() }
    );

    // Afrimoney returns 202 Accepted with a reference ID in headers
    const referenceId = response.headers['x-reference-id'];
    console.log('Afrimoney collection initiated. Reference ID:', referenceId);
    return referenceId;

  } catch (error) {
    console.error('Afrimoney collection failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkAfrimoneyStatus(referenceId) {
  try {
    const response = await axios.get(
      `${AFRIMONEY_BASE_URL}/collection/requesttopay/${referenceId}`,
      { headers: getAfrimoneyHeaders() }
    );

    const { status, amount, payer } = response.data;
    console.log(`Status for ${referenceId}: ${status}`);
    return response.data;

  } catch (error) {
    console.error('Status check failed:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { initiateAfrimoneyCollection, checkAfrimoneyStatus };
```

#### Python

```python
# afrimoney/transfer.py

import os
import requests
from auth import get_afrimoney_headers

AFRIMONEY_BASE_URL = "https://api.afrimoney.sl/v1"

def initiate_afrimoney_collection(amount, customer_phone, external_id, description):
    payload = {
        "amount": str(amount),
        "currency": "SLL",
        "externalId": external_id,
        "payer": {
            "partyIdType": "MSISDN",
            "partyId": customer_phone,  # e.g. "23278123456"
        },
        "payerMessage": description,
        "payeeNote": f"Payment ref: {external_id}",
        "callbackUrl": "https://yourapp.com/webhooks/afrimoney",
    }

    response = requests.post(
        f"{AFRIMONEY_BASE_URL}/collection/requesttopay",
        json=payload,
        headers=get_afrimoney_headers(),
    )

    response.raise_for_status()
    reference_id = response.headers.get("x-reference-id")
    print(f"Collection initiated. Reference ID: {reference_id}")
    return reference_id


def check_afrimoney_status(reference_id):
    response = requests.get(
        f"{AFRIMONEY_BASE_URL}/collection/requesttopay/{reference_id}",
        headers=get_afrimoney_headers(),
    )
    response.raise_for_status()
    data = response.json()
    print(f"Status for {reference_id}: {data.get('status')}")
    return data
```

---

### 4.3 Webhook Handling (Afrimoney)

Afrimoney sends a callback to your `callbackUrl` when a transaction status changes.

#### JavaScript (Express.js)

```javascript
// afrimoney/webhook.js

const express = require('express');
const router = express.Router();

router.post('/webhooks/afrimoney', express.json(), (req, res) => {
  // Always acknowledge immediately
  res.status(200).json({ received: true });

  const { referenceId, status, amount, payer, reason } = req.body;

  console.log(`Afrimoney callback received: ref=${referenceId}, status=${status}`);

  if (status === 'SUCCESSFUL') {
    console.log(`Payment of ${amount} SLL received from ${payer?.partyId}`);
    // TODO: Update your order/database
    updateOrderByReference(referenceId, 'paid');
  } else if (status === 'FAILED') {
    console.log(`Payment failed. Reason: ${reason}`);
    updateOrderByReference(referenceId, 'failed');
  } else if (status === 'PENDING') {
    console.log('Payment still pending...');
  }
});

async function updateOrderByReference(referenceId, status) {
  console.log(`Updating order for ref ${referenceId} to ${status}`);
  // Your database logic here
}

module.exports = router;
```

#### Python (Flask)

```python
# afrimoney/webhook.py

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks/afrimoney', methods=['POST'])
def afrimoney_webhook():
    data = request.get_json()

    reference_id = data.get('referenceId')
    status = data.get('status')
    amount = data.get('amount')
    payer = data.get('payer', {})
    reason = data.get('reason', '')

    print(f"Afrimoney callback: ref={reference_id}, status={status}")

    if status == "SUCCESSFUL":
        print(f"Payment of {amount} SLL received from {payer.get('partyId')}")
        update_order_by_reference(reference_id, "paid")
    elif status == "FAILED":
        print(f"Payment failed. Reason: {reason}")
        update_order_by_reference(reference_id, "failed")
    elif status == "PENDING":
        print("Payment still pending...")

    return jsonify({"received": True}), 200

def update_order_by_reference(reference_id, status):
    print(f"Updating order {reference_id} -> {status}")
    # Your database logic here
```

---

## 5. Error Handling Best Practices <a name="error-handling"></a>

Robust error handling is critical for payment integrations. Here are the key patterns:

### Retry Logic for Network Failures

```javascript
// utils/retry.js

async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isNetworkError = !error.response; // No response = network issue

      if (isLastAttempt || !isNetworkError) throw error;

      console.log(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
}

// Usage
const referenceId = await withRetry(() =>
  initiateAfrimoneyCollection({ amount: 50000, customerPhone: '23278123456', ... })
);
```

### Idempotency — Never Double-Charge

Always generate a unique `externalId` or `orderId` per transaction and store it in your database **before** calling the API. If the API call fails and you retry, use the same ID — both Orange Money and Afrimoney will return the existing transaction instead of creating a duplicate.

```javascript
const { v4: uuidv4 } = require('uuid');

// Generate once, store in DB, reuse on retry
const orderId = uuidv4();
await saveOrderToDatabase({ orderId, status: 'pending', amount });
await initiateOrangePayment({ orderId, amount, ... });
```

---

## 6. Testing Your Integration <a name="testing"></a>

Both providers offer sandbox environments. Use these test credentials and numbers:

### Orange Money Sandbox
- Base URL: `https://api.orange.com/sandbox/...`
- Test phone: Use any number in the format `23276XXXXXXX`
- Test amounts: Any value under 1,000,000 SLL

### Afrimoney Sandbox
- Base URL: `https://sandbox.afrimoney.sl/v1`
- Test MSISDN: `23278000001` (always succeeds), `23278000002` (always fails)

### Running the Examples

```bash
# Clone the repo
git clone https://github.com/MEDVONJOSON/sl-mobile-money-guide
cd sl-mobile-money-guide

# Install Node.js dependencies
npm install

# Copy and fill in your sandbox credentials
cp .env.example .env

# Run Orange Money example
node examples/orange-money-example.js

# Run Afrimoney example
node examples/afrimoney-example.js

# Python setup
pip install -r requirements.txt
python examples/orange_money_example.py
python examples/afrimoney_example.py
```

---

## 7. Security Recommendations <a name="security"></a>

- **Never hardcode credentials.** Always use environment variables (`.env` files) and add `.env` to `.gitignore`.
- **Always verify webhook signatures** before processing any payment notification.
- **Use HTTPS only** for all API calls and webhook endpoints.
- **Log transactions** but never log full card numbers, wallet PINs, or secrets.
- **Implement idempotency** to prevent double-charging on retries.
- **Rate-limit your webhook endpoints** to prevent abuse.

---

## 8. Summary & Next Steps <a name="summary"></a>

You now have working integrations for Sierra Leone's two major mobile money providers:

| Provider | Auth Method | Payment Flow | Webhook |
|---|---|---|---|
| Orange Money | OAuth 2.0 | Redirect-based | POST to notif_url |
| Afrimoney | API Key + Secret | Direct API request | POST to callbackUrl |

**Next steps:**
- Register on the [Orange Developer Portal](https://developer.orange.com) for sandbox credentials
- Contact Africell/Afrimoney Business team for API access
- Test all flows in sandbox before going live
- Add database persistence to the webhook handlers
- Deploy your webhook endpoints to a public HTTPS server (e.g. Railway, Render, or VPS)

---

*Written by Mohamed Vonjo · Software Developer · Freetown, Sierra Leone · github.com/MEDVONJOSON*
