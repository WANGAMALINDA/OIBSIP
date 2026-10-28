export const menu = {
  bases: [
    { name: 'Classic', priceMinorUnits: 25000 },
    { name: 'Thin Crust', priceMinorUnits: 27000 },
    { name: 'Whole Wheat', priceMinorUnits: 29000 },
    { name: 'Gluten Free', priceMinorUnits: 32000 },
    { name: 'Stuffed Crust', priceMinorUnits: 35000 },
  ],
  sauces: [
    { name: 'Classic Tomato', priceMinorUnits: 0 },
    { name: 'Spicy Marinara', priceMinorUnits: 1500 },
    { name: 'Pesto', priceMinorUnits: 3500 },
    { name: 'Barbecue', priceMinorUnits: 2000 },
    { name: 'White Garlic', priceMinorUnits: 2500 },
  ],
  cheeses: [
    { name: 'Mozzarella', priceMinorUnits: 5000 },
    { name: 'Vegan Cheese', priceMinorUnits: 6500 },
    { name: 'Cheddar', priceMinorUnits: 5500 },
  ],
  vegetables: [
    { name: 'Mushrooms', priceMinorUnits: 1500 },
    { name: 'Bell Peppers', priceMinorUnits: 1200 },
    { name: 'Red Onions', priceMinorUnits: 1000 },
    { name: 'Black Olives', priceMinorUnits: 1500 },
    { name: 'Spinach', priceMinorUnits: 1200 },
    { name: 'Jalapeños', priceMinorUnits: 1200 },
    { name: 'Sweet Corn', priceMinorUnits: 1000 },
  ],
}

export function getOrderItems(input) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Choose a valid pizza before ordering.')
    error.status = 400
    throw error
  }
  const findOption = (options, name) => options.find((option) => option.name === name)
  const base = findOption(menu.bases, input.base)
  const sauce = findOption(menu.sauces, input.sauce)
  const cheese = findOption(menu.cheeses, input.cheese)
  const vegetables = input.vegetables
  if (!Array.isArray(vegetables)) {
    const error = new Error('Vegetables must be supplied as a list.')
    error.status = 400
    throw error
  }
  const uniqueVegetables = [...new Set(vegetables)]

  if (
    !base ||
    !sauce ||
    !cheese ||
    vegetables.some((vegetable) => typeof vegetable !== 'string') ||
    vegetables.length !== uniqueVegetables.length
  ) {
    const error = new Error('Choose a valid base, sauce, cheese, and vegetable selection.')
    error.status = 400
    throw error
  }

  const vegetableOptions = uniqueVegetables.map((name) =>
    findOption(menu.vegetables, name),
  )
  if (vegetableOptions.some((option) => !option)) {
    const error = new Error('One or more vegetables are not available.')
    error.status = 400
    throw error
  }

  const totalMinorUnits =
    base.priceMinorUnits +
    sauce.priceMinorUnits +
    cheese.priceMinorUnits +
    vegetableOptions.reduce((sum, option) => sum + option.priceMinorUnits, 0)

  return {
    items: { base: base.name, sauce: sauce.name, cheese: cheese.name, vegetables: uniqueVegetables },
    totalMinorUnits,
    inventoryItems: [
      { key: `base:${base.name}`, quantity: 1 },
      { key: `sauce:${sauce.name}`, quantity: 1 },
      { key: `cheese:${cheese.name}`, quantity: 1 },
      ...uniqueVegetables.map((name) => ({ key: `vegetable:${name}`, quantity: 1 })),
    ],
  }
}
