import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is undefined. Check your .env.local file.')
  process.exit(1)
}

async function connectDB() {
  await mongoose.connect(MONGODB_URI as string)
}

const ShipmentSchema = new mongoose.Schema({
  route: String,
  originCode: String,
  destinationCode: String,
  departureDate: Date,
  totalCapacityKg: Number,
  remainingCapacityKg: Number,
  // Air freight pricing
  pricePerKg: Number,
  specialGoodsPricePerKg: Number,
  // Sea freight pricing
  pricePerCbm: Number,
  seaFreightProcessingFee: Number,
  // Common
  processingFeePerShipment: Number,
  freightType: String,       // 'air' | 'sea' | 'both'
  status: String,
  createdBy: String,
  notes: String,
}, { timestamps: true })

const Shipment = mongoose.models.Shipment ?? mongoose.model('Shipment', ShipmentSchema)

const arrow = '\u2192'
const PROCESSING_FEE = 19

const SEED_SHIPMENTS = [
  // ─── DUBAI ───────────────────────────────────────────
  {
    route: 'Dubai ' + arrow + ' Rwanda',
    originCode: 'DXB',
    destinationCode: 'KGL',
    departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    totalCapacityKg: 250,
    remainingCapacityKg: 250,
    pricePerKg: 10,
    specialGoodsPricePerKg: 13,
    pricePerCbm: 250,
    seaFreightProcessingFee: 175,
    processingFeePerShipment: PROCESSING_FEE,
    freightType: 'both',
    status: 'upcoming',
    createdBy: 'seed',
    notes: 'Air: $10/kg normal, $13/kg special. Sea: $250/cbm + $175 processing. All subject to $19 shipment fee.',
  },

  // ─── USA ─────────────────────────────────────────────
  {
    route: 'USA ' + arrow + ' Rwanda',
    originCode: 'JFK',
    destinationCode: 'KGL',
    departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    totalCapacityKg: 300,
    remainingCapacityKg: 300,
    pricePerKg: 24,
    specialGoodsPricePerKg: 24,
    pricePerCbm: null,
    seaFreightProcessingFee: null,
    processingFeePerShipment: PROCESSING_FEE,
    freightType: 'air',
    status: 'upcoming',
    createdBy: 'seed',
    notes: 'Air freight only: $24/kg. Subject to $19 shipment fee.',
  },

  // ─── CANADA ──────────────────────────────────────────
  {
    route: 'Canada ' + arrow + ' Rwanda',
    originCode: 'YYZ',
    destinationCode: 'KGL',
    departureDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    totalCapacityKg: 150,
    remainingCapacityKg: 150,
    pricePerKg: 15,
    specialGoodsPricePerKg: 15,
    pricePerCbm: null,
    seaFreightProcessingFee: null,
    processingFeePerShipment: PROCESSING_FEE,
    freightType: 'air',
    status: 'upcoming',
    createdBy: 'seed',
    notes: 'Air freight only: $15/kg. Subject to $19 shipment fee.',
  },

  // ─── CHINA ───────────────────────────────────────────
  {
    route: 'China ' + arrow + ' Rwanda',
    originCode: 'PVG',
    destinationCode: 'KGL',
    departureDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    totalCapacityKg: 400,
    remainingCapacityKg: 400,
    pricePerKg: 17,
    specialGoodsPricePerKg: 22,
    pricePerCbm: 175,
    seaFreightProcessingFee: 100,
    processingFeePerShipment: PROCESSING_FEE,
    freightType: 'both',
    status: 'upcoming',
    createdBy: 'seed',
    notes: 'Air: $17/kg normal, $22/kg special. Sea: $175/cbm + $100 processing. All subject to $19 shipment fee.',
  },

  // ─── UK ──────────────────────────────────────────────
  {
    route: 'UK ' + arrow + ' Rwanda',
    originCode: 'LHR',
    destinationCode: 'KGL',
    departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    totalCapacityKg: 200,
    remainingCapacityKg: 200,
    pricePerKg: 15,
    specialGoodsPricePerKg: 15,
    pricePerCbm: null,
    seaFreightProcessingFee: null,
    processingFeePerShipment: PROCESSING_FEE,
    freightType: 'air',
    status: 'upcoming',
    createdBy: 'seed',
    notes: 'Air freight: $15/kg (placeholder rate). Subject to $19 shipment fee.',
  },
]

async function seed() {
  console.log('Connecting to MongoDB...')
  await connectDB()
  console.log('Connected!')
  await Shipment.deleteMany({ createdBy: 'seed' })
  await Shipment.insertMany(SEED_SHIPMENTS)
  console.log('Seeded 5 shipments with correct rates!')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(function(err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
})