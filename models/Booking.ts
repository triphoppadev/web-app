import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBooking extends Document {
  shipmentId: mongoose.Types.ObjectId
  userId: string       // Firebase UID
  userEmail: string
  userName: string
  kgBooked: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  paymentMethod?: 'stripe' | 'momo' | null
  specialInstructions?: string
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    kgBooked: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, enum: ['stripe', 'momo', null], default: null },
    specialInstructions: { type: String },
  },
  { timestamps: true }
)

export const Booking: Model<IBooking> =
  mongoose.models.Booking ?? mongoose.model<IBooking>('Booking', BookingSchema)