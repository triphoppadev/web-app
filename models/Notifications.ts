import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotification extends Document {
  userId: string
  title: string
  message: string
  type: 'booking' | 'shipment' | 'payment' | 'system'
  read: boolean
  link?: string
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['booking', 'shipment', 'payment', 'system'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
)

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>('Notification', NotificationSchema)