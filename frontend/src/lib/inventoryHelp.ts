export type QuickActionId = 'new-item' | 'new-group' | 'composite' | 'barcodes';

export const INVENTORY_QUICK_ACTIONS: Record<
  QuickActionId,
  { label: string; description: string; where: string }
> = {
  'new-item': {
    label: 'New Item',
    description: 'Link an existing product to inventory with quantity, threshold, and location.',
    where: 'Please check Inventory → Items tab.',
  },
  'new-group': {
    label: 'New Item Groups',
    description: 'Create a category to organize related products and variants.',
    where: 'Please check Inventory → Item Groups tab.',
  },
  composite: {
    label: 'New Composite Items',
    description: 'Create a product listing made up of multiple components or variants.',
    where: 'Please check Listings → All Listings tab.',
  },
  barcodes: {
    label: 'Barcodes',
    description: 'Export SKU, product name, and generated barcode values for all inventory rows.',
    where: 'Please check your downloads folder for the CSV file.',
  },
};

export function getAddedToastMessage(action: QuickActionId): string {
  const { label, where } = INVENTORY_QUICK_ACTIONS[action];
  if (action === 'barcodes') {
    return `Barcodes exported successfully. ${where}`;
  }
  return `${label} added successfully. ${where}`;
}

export const FAVORITE_STAR_HELP =
  'Star a product to pin it to the Favorites tab on Inventory and Listings. Unstar to remove it.';

export const INVENTORY_FIND_GUIDE = [
  { action: 'New Item', destination: 'Inventory → Items tab' },
  { action: 'Item Groups', destination: 'Inventory → Item Groups tab (also categories in Listings)' },
  { action: 'Composite Items', destination: 'Listings page' },
  { action: 'Barcodes', destination: 'CSV file download' },
  { action: 'Favorites', destination: 'Star ⭐ a row, then Inventory or Listings → Favorites tab' },
] as const;
