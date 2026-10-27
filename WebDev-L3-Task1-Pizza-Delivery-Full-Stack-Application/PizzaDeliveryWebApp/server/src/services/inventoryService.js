import mongoose from 'mongoose'
import Inventory from '../models/Inventory.js'
import { menu } from '../data/menu.js'

const categories = [
  ['base', menu.bases],
  ['sauce', menu.sauces],
  ['cheese', menu.cheeses],
  ['vegetable', menu.vegetables],
]

export async function initializeInventory() {
  const operations = categories.flatMap(([category, options]) =>
    options.map(({ name }) => ({
      updateOne: {
        filter: { key: `${category}:${name}` },
        update: {
          $setOnInsert: {
            key: `${category}:${name}`,
            category,
            name,
            quantity: 100,
            lowStockThreshold: 20,
            notificationSent: false,
          },
        },
        upsert: true,
      },
    })),
  )
  await Inventory.bulkWrite(operations)
}

export async function reserveInventory(items, session) {
  for (const item of items) {
    const updated = await Inventory.findOneAndUpdate(
      { key: item.key, quantity: { $gte: item.quantity } },
      { $inc: { quantity: -item.quantity } },
      { new: true, session },
    )
    if (!updated) {
      const error = new Error(`Not enough stock for ${item.key.replace(':', ' ')}.`)
      error.status = 409
      throw error
    }
    if (updated.quantity >= updated.lowStockThreshold && updated.notificationSent) {
      updated.notificationSent = false
      await updated.save({ session })
    }
  }
}

export async function restoreInventory(items, session) {
  for (const item of items) {
    const inventory = await Inventory.findOneAndUpdate(
      { key: item.key },
      { $inc: { quantity: item.quantity } },
      { new: true, session },
    )
    if (inventory && inventory.quantity >= inventory.lowStockThreshold && inventory.notificationSent) {
      inventory.notificationSent = false
      await inventory.save({ session })
    }
  }
}

export async function withTransaction(callback) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await callback(session)
    })
    return result
  } finally {
    await session.endSession()
  }
}
