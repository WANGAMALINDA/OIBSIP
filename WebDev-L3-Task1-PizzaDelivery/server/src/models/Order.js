import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      base: { type: String, required: true },
      sauce: { type: String, required: true },
      cheese: { type: String, required: true },
      vegetables: { type: [String], default: [] },
    },
    inventoryItems: [{ key: String, quantity: Number }],
    currency: { type: String, enum: ['USD', 'INR', 'ZAR'] },
    totalMinorUnits: { type: Number, min: 1 },
    totalPaise: { type: Number, min: 1 },
    hiddenByUserAt: Date,
    status: {
      type: String,
      enum: ['payment_pending', 'received', 'in_kitchen', 'out_for_delivery', 'cancelled'],
      default: 'payment_pending',
      index: true,
    },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, index: true, sparse: true },
    razorpayRefundId: String,
    refundStatus: { type: String, enum: ['none', 'pending', 'processed', 'failed'], default: 'none' },
    reservationExpiresAt: { type: Date, index: true },
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
