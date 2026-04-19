import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  uid: string          // Firebase UID
  email: string
  name: string
  phone?: string
  role: 'customer' | 'traveler' | 'admin'
  isTraveler: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ['customer', 'traveler', 'admin'],
      default: 'customer',
    },
    isTraveler: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)