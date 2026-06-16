# examples/afrimoney_example.py
# Run: python examples/afrimoney_example.py

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

AFRIMONEY_BASE_URL = "https://sandbox.afrimoney.sl/v1"


def get_headers():
    return {
        "X-API-Key": os.environ["AFRIMONEY_API_KEY"],
        "X-API-Secret": os.environ["AFRIMONEY_API_SECRET"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def initiate_collection(amount, customer_phone, external_id, description):
    payload = {
        "amount": str(amount),
        "currency": "SLL",
        "externalId": external_id,
        "payer": {"partyIdType": "MSISDN", "partyId": customer_phone},
        "payerMessage": description,
        "payeeNote": f"Ref: {external_id}",
        "callbackUrl": "https://yourapp.com/webhooks/afrimoney",
    }
    response = requests.post(
        f"{AFRIMONEY_BASE_URL}/collection/requesttopay",
        json=payload,
        headers=get_headers(),
    )
    response.raise_for_status()
    return response.headers.get("x-reference-id")


def check_status(reference_id):
    response = requests.get(
        f"{AFRIMONEY_BASE_URL}/collection/requesttopay/{reference_id}",
        headers=get_headers(),
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    print("--- Afrimoney Python Example ---\n")

    external_id = f"TXN-{int(time.time())}"

    print("Step 1: Initiating collection...")
    ref_id = initiate_collection(
        amount=25000,
        customer_phone="23278000001",
        external_id=external_id,
        description="Test from SL Developers Guide",
    )
    print(f"✅ Reference ID: {ref_id}\n")

    print("Step 2: Checking status...")
    time.sleep(3)
    result = check_status(ref_id)
    print(f"✅ Status: {result.get('status')}")
    print(f"Amount: {result.get('amount')} SLL")
