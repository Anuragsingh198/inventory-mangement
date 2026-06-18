export const SALES_CHANNELS = [
  'Aliexpress',
  'eBay',
  'Amazon',
  'Walmart',
  'Etsy',
  'Wayfair',
  'Rakuten',
] as const;

export function getProductChannels(product: { channels?: string[] }): string[] {
  return product.channels ?? [];
}

export function productOnChannel(product: { id: number; channels?: string[] }, channel: string): boolean {
  return getProductChannels(product).includes(channel);
}

export function filterProductsByChannel<T extends { id: number; channels?: string[] }>(
  products: T[],
  channel: string,
): T[] {
  return products.filter((product) => productOnChannel(product, channel));
}

export function formatOrderId(id: number): string {
  return String(id).padStart(6, '0');
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const PAGE_SIZE = 10;

export function paginate<T>(items: T[], page: number, perPage = PAGE_SIZE): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export function totalPages(count: number, perPage = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / perPage));
}

export function orderTotal(items: { quantity: number; unit_price: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);
}

export function paymentStatus(orderStatus: string): string {
  if (orderStatus === 'received') return 'Completed';
  if (orderStatus === 'cancelled') return 'Cancelled';
  return 'Submitted';
}

export const PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=80&h=80&fit=crop';
