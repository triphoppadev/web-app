import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Shipment } from "@/models/Shipment";
import { Notification } from "@/models/Notifications";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const uid = req.headers.get("x-user-uid");
    if (!uid)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookings = await Booking.find({ userId: uid })
      .populate("shipmentId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/bookings]", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const uid = req.headers.get("x-user-uid");
    if (!uid)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      shipmentId,
      kgBooked,
      cbmBooked,
      freightMode,
      goodsType,
      userName,
      userEmail,
      totalPrice,
      specialInstructions,
    } = await req.json();

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Invalid booking data" },
        { status: 400 },
      );
    }

    // Verify shipment exists and has capacity — but DO NOT deduct yet
    // Capacity is only deducted after payment is confirmed
    const shipment = await Shipment.findOne({
      _id: shipmentId,
      status: "upcoming",
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found or no longer available" },
        { status: 404 },
      );
    }

    // Check capacity is sufficient (soft check — not deducted yet)
    if (freightMode !== "sea" && kgBooked > shipment.remainingCapacityKg) {
      return NextResponse.json(
        {
          error: `Only ${shipment.remainingCapacityKg}kg remaining on this shipment`,
        },
        { status: 409 },
      );
    }

    const booking = await Booking.create({
      shipmentId,
      userId: uid,
      userEmail,
      userName,
      kgBooked: kgBooked ?? 0,
      cbmBooked: cbmBooked ?? 0,
      freightMode: freightMode ?? "air",
      goodsType: goodsType ?? "normal",
      totalPrice: totalPrice ?? 0,
      specialInstructions,
      status: "pending",
      paymentStatus: "unpaid",
    });

    // Notify user — capacity not yet reserved
    await Notification.create({
      userId: uid,
      title: "Booking saved!",
      message: `Your booking for ${shipment.route} has been saved. Complete payment to reserve your space.`,
      type: "booking",
      link: "/bookings",
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
