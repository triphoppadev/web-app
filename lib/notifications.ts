import { Notification } from '@/models/Notifications'
import {
  sendBookingConfirmationEmail,
  sendPaymentSuccessEmail,
  sendBookingSavedEmail,
  sendAdminNewBookingEmail,
} from './email'
import { format } from 'date-fns'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

interface BookingNotifyParams {
  userId: string
  userEmail: string
  userName: string
  route: string
  departureDate: string
  kgBooked: number
  totalPrice: number
  bookingRef: string
  freightMode: string
  goodsType: string
}

// Called when booking is created (save for later)
export async function notifyBookingSaved(params: BookingNotifyParams) {
  const formattedDate = format(new Date(params.departureDate), 'MMM d, yyyy')

  // In-app notification
  await Notification.create({
    userId: params.userId,
    title: 'Booking saved!',
    message: `Your booking for ${params.route} is saved. Complete payment to reserve your space.`,
    type: 'booking',
    link: '/bookings',
  })

  // Email to customer
  await sendBookingSavedEmail({
    to: params.userEmail,
    name: params.userName,
    route: params.route,
    totalPrice: params.totalPrice,
    bookingRef: params.bookingRef,
    departureDate: formattedDate,
  }).catch(err => console.error('Email send failed:', err))

  // Email to admin
  await sendAdminNewBookingEmail({
    adminEmail: ADMIN_EMAIL,
    customerName: params.userName,
    customerEmail: params.userEmail,
    route: params.route,
    kgBooked: params.kgBooked,
    totalPrice: params.totalPrice,
    bookingRef: params.bookingRef,
  }).catch(err => console.error('Admin email failed:', err))
}

// Called when payment is confirmed
export async function notifyPaymentSuccess(params: {
  userId: string
  userEmail: string
  userName: string
  route: string
  departureDate: string
  kgBooked: number
  totalPrice: number
  bookingRef: string
  freightMode: string
  goodsType: string
  paymentMethod: string
}) {
  const formattedDate = format(new Date(params.departureDate), 'MMM d, yyyy')

  // In-app notification
  await Notification.create({
    userId: params.userId,
    title: 'Payment confirmed! 🎉',
    message: `Your booking for ${params.route} is confirmed. Your space is reserved!`,
    type: 'payment',
    link: '/bookings',
  })

  // Booking confirmation email
  await sendBookingConfirmationEmail({
    to: params.userEmail,
    name: params.userName,
    route: params.route,
    departureDate: formattedDate,
    kgBooked: params.kgBooked,
    totalPrice: params.totalPrice,
    bookingRef: params.bookingRef,
    freightMode: params.freightMode,
    goodsType: params.goodsType,
  }).catch(err => console.error('Confirmation email failed:', err))

  // Payment success email
  await sendPaymentSuccessEmail({
    to: params.userEmail,
    name: params.userName,
    route: params.route,
    totalPrice: params.totalPrice,
    paymentMethod: params.paymentMethod,
    bookingRef: params.bookingRef,
  }).catch(err => console.error('Payment email failed:', err))
}