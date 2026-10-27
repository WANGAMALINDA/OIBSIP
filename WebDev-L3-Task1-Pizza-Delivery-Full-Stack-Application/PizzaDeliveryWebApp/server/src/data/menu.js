export const menu = {
  bases: [
    { name: 'Classic', pricePaise: 25000 },
    { name: 'Thin Crust', pricePaise: 27000 },
    { name: 'Whole Wheat', pricePaise: 29000 },
    { name: 'Gluten Free', pricePaise: 32000 },
    { name: 'Stuffed Crust', pricePaise: 35000 },
  ],
  sauces: [
    { name: 'Classic Tomato', pricePaise: 0 },
    { name: 'Spicy Marinara', pricePaise: 1500 },
    { name: 'Pesto', pricePaise: 3500 },
    { name: 'Barbecue', pricePaise: 2000 },
    { name: 'White Garlic', pricePaise: 2500 },
  ],
  cheeses: [
    { name: 'Mozzarella', pricePaise: 5000 },
    { name: 'Vegan Cheese', pricePaise: 6500 },
    { name: 'Cheddar', pricePaise: 5500 },
  ],
  vegetables: [
    { name: 'Mushrooms', pricePaise: 1500 },
    { name: 'Bell Peppers', pricePaise: 1200 },
    { name: 'Red Onions', pricePaise: 1000 },
    { name: 'Black Olives', pricePaise: 1500 },
    { name: 'Spinach', pricePaise: 1200 },
    { name: 'Jalapeños', pricePaise: 1200 },
    { name: 'Sweet Corn', pricePaise: 1000 },
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

  const totalPaise =
    base.pricePaise +
    sauce.pricePaise +
    cheese.pricePaise +
    vegetableOptions.reduce((sum, option) => sum + option.pricePaise, 0)

  return {
    items: { base: base.name, sauce: sauce.name, cheese: cheese.name, vegetables: uniqueVegetables },
    totalPaise,
    inventoryItems: [
      { key: `base:${base.name}`, quantity: 1 },
      { key: `sauce:${sauce.name}`, quantity: 1 },
      { key: `cheese:${cheese.name}`, quantity: 1 },
      ...uniqueVegetables.map((name) => ({ key: `vegetable:${name}`, quantity: 1 })),
    ],
  }
}
