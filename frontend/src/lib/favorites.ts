const KEY = 'ventorio_favorites';

export function getFavorites(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as number[];
  } catch {
    return [];
  }
}

export function toggleFavorite(productId: number): boolean {
  const current = getFavorites();
  const exists = current.includes(productId);
  const next = exists ? current.filter((id) => id !== productId) : [...current, productId];
  localStorage.setItem(KEY, JSON.stringify(next));
  return !exists;
}

export function isFavorite(productId: number): boolean {
  return getFavorites().includes(productId);
}

const ORDER_KEY = 'ventorio_order_favorites';

export function getOrderFavorites(): number[] {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]') as number[];
  } catch {
    return [];
  }
}

export function toggleOrderFavorite(orderId: number): boolean {
  const current = getOrderFavorites();
  const exists = current.includes(orderId);
  const next = exists ? current.filter((id) => id !== orderId) : [...current, orderId];
  localStorage.setItem(ORDER_KEY, JSON.stringify(next));
  return !exists;
}

export function isOrderFavorite(orderId: number): boolean {
  return getOrderFavorites().includes(orderId);
}
