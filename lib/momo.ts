import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

// Install uuid: npm install uuid @types/uuid
const BASE_URL = process.env.MOMO_BASE_URL!
const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY!
const TARGET_ENV = process.env.MOMO_TARGET_ENVIRONMENT ?? 'sandbox'
const API_USER = process.env.MOMO_API_USER!
const API_SECRET = process.env.MOMO_API_SECRET!

function getBasicAuth() {
  return Buffer.from(`${API_USER}:${API_SECRET}`).toString('base64')
}

async function getAccessToken(): Promise<string> {
  const res = await axios.post(
    `${BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${getBasicAuth()}`,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  )
  return res.data.access_token
}

export async function requestMoMoPayment({
  amount,
  currency = 'EUR', // MoMo sandbox uses EUR
  phone,
  referenceId,
  note,
}: {
  amount: number
  currency?: string
  phone: string
  referenceId?: string
  note?: string
}) {
  const token = await getAccessToken()
  const externalId = referenceId ?? uuidv4()
  const momoReferenceId = uuidv4()

  await axios.post(
    `${BASE_URL}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency,
      externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phone.replace(/\D/g, ''), // strip non-digits
      },
      payerMessage: note ?? 'Triphoppa cargo booking',
      payeeNote: note ?? 'Triphoppa payment',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': momoReferenceId,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
    }
  )

  return { momoReferenceId, externalId }
}

export async function getMoMoPaymentStatus(referenceId: string) {
  const token = await getAccessToken()

  const res = await axios.get(
    `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  )

  return res.data // { status: 'SUCCESSFUL' | 'FAILED' | 'PENDING', ... }
}