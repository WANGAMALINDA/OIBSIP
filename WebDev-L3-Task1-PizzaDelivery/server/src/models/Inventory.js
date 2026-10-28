import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    category: { type: String, enum: ['base', 'sauce', 'cheese', 'vegetable'], required: true },
    name: { type: String, required: true },
    quantity: { type: Number, min: 0, required: true, default: 0 },
    lowStockThreshold: { type: Number, min: 0, required: true, default: 20 },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model('Inventory', inventorySchema)
