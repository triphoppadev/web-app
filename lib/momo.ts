// import axios from 'axios'
// import { v4 as uuidv4 } from 'uuid'

// /**
//  * Helper to retrieve environment variables dynamically.
//  * This ensures they are not 'undefined' due to module hoisting/initialization issues.
//  */
// const getMomoConfig = () => {
//   const config = {
//     BASE_URL: process.env.MOMO_BASE_URL,
//     SUBSCRIPTION_KEY: process.env.MOMO_SUBSCRIPTION_KEY,
//     TARGET_ENV: process.env.MOMO_TARGET_ENVIRONMENT ?? 'sandbox',
//     API_USER: process.env.MOMO_API_USER,
//     API_SECRET: process.env.MOMO_API_SECRET,
//   }

//   // Early exit if crucial keys are missing
//   if (!config.API_USER || !config.API_SECRET || !config.SUBSCRIPTION_KEY) {
//     console.error('[MoMo] Configuration Missing:', {
//       hasUser: !!config.API_USER,
//       hasSecret: !!config.API_SECRET,
//       hasSubKey: !!config.SUBSCRIPTION_KEY,
//     })
//     throw new Error('MoMo environment variables are not fully configured.')
//   }

//   return config as {
//     BASE_URL: string
//     SUBSCRIPTION_KEY: string
//     TARGET_ENV: string
//     API_USER: string
//     API_SECRET: string
//   }
// }

// function getBasicAuth() {
//   const { API_USER, API_SECRET } = getMomoConfig()
//   // This constructs the "API_USER:API_SECRET" base64 string
//   return Buffer.from(`${API_USER}:${API_SECRET}`).toString('base64')
// }

// async function getAccessToken(): Promise<string> {
//   const { BASE_URL, SUBSCRIPTION_KEY, TARGET_ENV, API_USER } = getMomoConfig()

//   console.log('[MoMo] Getting access token...', {
//     user: API_USER.slice(0, 8) + '...',
//     env: TARGET_ENV,
//   })

//   try {
//     const res = await axios.post(
//       `${BASE_URL}/collection/token/`,
//       {},
//       {
//         headers: {
//           Authorization: `Basic ${getBasicAuth()}`,
//           'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
//         },

//     )
//     console.log('[MoMo] Token obtained successfully')
//     return res.data.access_token
//   } catch (err: unknown) {
//     const error = err as { response?: { status: number; data: unknown } }
//     console.error('[MoMo] Token error:', error.response?.status, error.response?.data)
//     throw err
//   }
// }

// export async function requestMoMoPayment({
//   amount,
//   currency = 'RWF',
//   phone,
//   note,
// }: {
//   amount: number
//   currency?: string
//   phone: string
//   note?: string
// }) {
//   const config = getMomoConfig()
//   const token = await getAccessToken()

//   const referenceId = uuidv4()
//   const cleanPhone = phone.replace(/\D/g, '')

//   console.log('[MoMo] Initiating requesttopay:', {
//     referenceId,
//     amount,
//     currency,
//     phone: cleanPhone,
//   })

//   try {
//     const response = await axios.post(
//       `${config.BASE_URL}/collection/v1_0/requesttopay`,
//       {
//         amount: String(amount),
//         currency,
//         externalId: referenceId,
//         payer: {
//           partyIdType: 'MSISDN',
//           partyId: cleanPhone,
//         },
//         payerMessage: note ?? 'Triphoppa cargo booking',
//         payeeNote: note ?? 'Triphoppa payment',
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'X-Reference-Id': referenceId,
//           'X-Target-Environment': config.TARGET_ENV,
//           'Ocp-Apim-Subscription-Key': config.SUBSCRIPTION_KEY,
//           'Content-Type': 'application/json',
//         },
//       }
//     )

//     console.log('[MoMo] requesttopay HTTP status:', response.status)
//     return { momoReferenceId: referenceId }
//   } catch (err: unknown) {
//     const error = err as { response?: { status: number; data: unknown } }
//     console.error('[MoMo] requesttopay error:', error.response?.status, error.response?.data)
//     throw err
//   }
// }

// export async function getMoMoPaymentStatus(referenceId: string) {
//   const config = getMomoConfig()
//   const token = await getAccessToken()

//   console.log('[MoMo] Checking status for referenceId:', referenceId)

//   try {
//     const res = await axios.get(
//       `${config.BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'X-Target-Environment': config.TARGET_ENV,
//           'Ocp-Apim-Subscription-Key': config.SUBSCRIPTION_KEY,
//         },
//       }
//     )

//     console.log('[MoMo] Status response:', JSON.stringify(res.data, null, 2))
//     return res.data
//   } catch (err: unknown) {
//     const error = err as { response?: { status: number; data: unknown } }
//     console.error('[MoMo] Status check error:', error.response?.status, error.response?.data)
//     throw err
//   }
// }


import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const getMomoConfig = () => {
  const config = {
    BASE_URL: process.env.MOMO_BASE_URL,
    SUBSCRIPTION_KEY: process.env.MOMO_SUBSCRIPTION_KEY,
    TARGET_ENV: process.env.MOMO_TARGET_ENVIRONMENT ?? 'sandbox',
    API_USER: process.env.MOMO_API_USER,
    API_SECRET: process.env.MOMO_API_SECRET,
  }

  if (!config.API_USER || !config.API_SECRET || !config.SUBSCRIPTION_KEY) {
    console.error('[MoMo] Configuration Missing:', {
      hasUser: !!config.API_USER,
      hasSecret: !!config.API_SECRET,
      hasSubKey: !!config.SUBSCRIPTION_KEY,
    })
    throw new Error('MoMo environment variables are not fully configured.')
  }

  return config as {
    BASE_URL: string
    SUBSCRIPTION_KEY: string
    TARGET_ENV: string
    API_USER: string
    API_SECRET: string
  }
}

function getBasicAuth() {
  const { API_USER, API_SECRET } = getMomoConfig()
  return Buffer.from(`${API_USER}:${API_SECRET}`).toString('base64')
}

async function getAccessToken(): Promise<string> {
  const { BASE_URL, SUBSCRIPTION_KEY, TARGET_ENV, API_USER } = getMomoConfig()

  console.log('[MoMo] Getting access token...', {
    user: API_USER.slice(0, 8) + '...',
    env: TARGET_ENV,
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
  const config = getMomoConfig()
  const token = await getAccessToken()

  const referenceId = uuidv4()
  const cleanPhone = phone.replace(/\D/g, '')

  // --- LOG 1: VERIFY IDs BEFORE REQUEST ---
  console.log('[MoMo DEBUG] Requesting Payment with ID:', referenceId)

  try {
    const response = await axios.post(
      `${config.BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: String(amount),
        currency,
        externalId: referenceId,
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
          'X-Reference-Id': referenceId, // THIS IS THE KEY PART
          'X-Target-Environment': config.TARGET_ENV,
          'Ocp-Apim-Subscription-Key': config.SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    // --- LOG 2: VERIFY SUCCESSFUL HEADERS ---
    console.log('[MoMo] requesttopay Accepted:', response.status)
    return { momoReferenceId: referenceId }
  } catch (err: unknown) {
    const error = err as { response?: { status: number; data: unknown } }
    console.error('[MoMo] requesttopay error:', error.response?.status, error.response?.data)
    throw err
  }
}

export async function getMoMoPaymentStatus(referenceId: string) {
  const config = getMomoConfig()
  const token = await getAccessToken()

  // --- LOG 3: COMPARE THIS ID TO LOG 1 ---
  console.log('[MoMo DEBUG] Checking Status for ID:', referenceId)

  try {
    const res = await axios.get(
      `${config.BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': config.TARGET_ENV,
          'Ocp-Apim-Subscription-Key': config.SUBSCRIPTION_KEY,
        },
      }
    )

    console.log('[MoMo] Status response:', JSON.stringify(res.data, null, 2))
    return res.data
  } catch (err: unknown) {
    const error = err as { response?: { status: number; data: unknown } }
    // If this is a 404, the Reference-Id was likely not accepted in the previous step
    console.error('[MoMo] Status check error:', error.response?.status, error.response?.data)
    throw err
  }
}