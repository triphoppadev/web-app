import mongoose, { Schema, Document, Model } from 'mongoose'

export type RouteOption =
  | 'USA \u2192 Rwanda'
  | 'Canada \u2192 Rwanda'
  | 'UK \u2192 Rwanda'
  | 'China \u2192 Rwanda'
  | 'Dubai \u2192 Rwanda'

export type FreightType = 'air' | 'sea' | 'both'

export interface IShipment extends Document {
  route: RouteOption
  originCode: string
  destinationCode: string
  departureDate: Date
  arrivalDate?: Date
  totalCapacityKg: number
  remainingCapacityKg: number
  // Air freight
  pricePerKg: number
  specialGoodsPricePerKg?: number
  // Sea freight
  pricePerCbm?: number
  seaFreightProcessingFee?: number
  // Common
  processingFeePerShipment: number
  freightType: FreightType
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  createdBy: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ShipmentSchema = new Schema<IShipment>(
  {
    route: {
      type: String,
      enum: [
        'USA \u2192 Rwanda',
        'Canada \u2192 Rwanda',
        'UK \u2192 Rwanda',
        'China \u2192 Rwanda',
        'Dubai \u2192 Rwanda',
      ],
      required: true,
    },
    originCode: { type: String, required: true, uppercase: true, maxlength: 4 },
    destinationCode: { type: String, required: true, uppercase: true, maxlength: 4 },
    departureDate: { type: Date, required: true },
    arrivalDate: { type: Date },
    totalCapacityKg: { type: Number, required: true, min: 1 },
    remainingCapacityKg: { type: Number, required: true, min: 0 },
    pricePerKg: { type: Number, required: true, min: 0 },
    specialGoodsPricePerKg: { type: Number },
    pricePerCbm: { type: Number },
    seaFreightProcessingFee: { type: Number },
    processingFeePerShipment: { type: Number, default: 19 },
    freightType: {
      type: String,
      enum: ['air', 'sea', 'both'],
      default: 'air',
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
)

ShipmentSchema.index({ departureDate: 1, status: 1 })

export const Shipment: Model<IShipment> =
  mongoose.models.Shipment ?? mongoose.model<IShipment>('Shipment', ShipmentSchema)