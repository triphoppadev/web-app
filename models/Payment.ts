import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId
  userId: string
  amount: number
  currency: string
  method: 'stripe' | 'momo'
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  // Stripe fields
  stripePaymentIntentId?: string
  stripeClientSecret?: string
  // MoMo fields
  momoReferenceId?: string
  momoPhone?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    method: { type: String, enum: ['stripe', 'momo'], required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentIntentId: { type: String },
    stripeClientSecret: { type: String },
    momoReferenceId: { type: String },
    momoPhone: { type: String },
  },
  { timestamps: true }
)

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>('Payment', PaymentSchema)