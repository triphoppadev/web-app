import mongoose, { Schema, Document, Model } from 'mongoose'
import type { RouteOption } from './Shipment'

export interface ITravelerTrip extends Document {
  travelerId: string      // Firebase UID
  travelerName: string
  travelerEmail: string
  route: RouteOption
  departureDate: Date
  availableKg: number
  remainingKg: number
  pricePerKg: number
  status: 'active' | 'full' | 'completed' | 'cancelled'
  verifiedByAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

const TravelerTripSchema = new Schema<ITravelerTrip>(
  {
    travelerId: { type: String, required: true, index: true },
    travelerName: { type: String, required: true },
    travelerEmail: { type: String, required: true },
    route: {
      type: String,
      enum: ['USA → Rwanda', 'Canada → Rwanda', 'UK → Rwanda', 'China → Rwanda', 'Dubai → Rwanda'],
      required: true,
    },
    departureDate: { type: Date, required: true },
    availableKg: { type: Number, required: true, min: 1 },
    remainingKg: { type: Number, required: true, min: 0 },
    pricePerKg: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'full', 'completed', 'cancelled'],
      default: 'active',
    },
    verifiedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const TravelerTrip: Model<ITravelerTrip> =
  mongoose.models.TravelerTrip ??
  mongoose.model<ITravelerTrip>('TravelerTrip', TravelerTripSchema)