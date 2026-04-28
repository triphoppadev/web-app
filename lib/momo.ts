import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const BASE_URL = process.env.MOMO_BASE_URL!
const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY!
const TARGET_ENV = process.env.MOMO_TARGET_ENVIRONMENT ?? 'sandbox'
const API_USER = process.env.MOMO_API_USER!
const API_SECRET = process.env.MOMO_API_SECRET!

function getBasicAuth() {
  return Buffer.from(`${API_USER}:${API_SECRET}`).toString('base64')
}

async function getAccessToken(): Promise<string> {
  console.log('[MoMo] Getting access token...', {
    user: API_USER?.slice(0, 8) + '...',
    env: TARGET_ENV,
    hasKey: !!SUBSCRIPTION_KEY,
  })

  try {
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
    console.log('[MoMo] Token obtained successfully')
    return res.data.access_token
  } catch (err: unknown) {
    const error = err as { response?: { status: number; data: unknown } }
    console.error('[MoMo] Token error:', error.response?.status, error.response?.data)
    throw err
  }
}

export async function requestMoMoPayment({
  amount,
  currency = 'RWF',
  phone,
  note,
}: {
  amount: number
  currency?: string
  phone: string
  note?: string
}) {
  const token = await getAccessToken()

  // Both IDs are the same UUID — this is the reference we'll use to check status
  const referenceId = uuidv4()
  const cleanPhone = phone.replace(/\D/g, '')

  console.log('[MoMo] Initiating requesttopay:', {
    referenceId,
    amount,
    currency,
    phone: cleanPhone,
    env: TARGET_ENV,
  })

  try {
    const response = await axios.post(
      `${BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: String(amount),
        currency,
        externalId: referenceId,  // use same ID for both
        payer: {
          partyIdType: 'MSISDN',
          partyId: cleanPhone,
        },
        payerMessage: note ?? 'Triphoppa cargo booking',
        payeeNote: note ?? 'Triphoppa payment',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': referenceId,  // this is what we check status with
          'X-Target-Environment': TARGET_ENV,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[MoMo] requesttopay HTTP status:', response.status)
    // 202 Accepted is success for requesttopay
    return { momoReferenceId: referenceId }
  } catch (err: unknown) {
    const error = err as { response?: { status: number; data: unknown } }
    console.error('[MoMo] requesttopay error:', error.response?.status, error.response?.data)
    throw err
  }
}

export async function getMoMoPaymentStatus(referenceId: string) {
  const token = await getAccessToken()

  console.log('[MoMo] Checking status for referenceId:', referenceId)

  try {
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

    console.log('[MoMo] Status response:', JSON.stringify(res.data, null, 2))
    return res.data
  } catch (err: unknown) {
    const error = err as { response?: { status: number; data: unknown } }
    console.error('[MoMo] Status check error:', error.response?.status, error.response?.data)
    throw err
  }
}