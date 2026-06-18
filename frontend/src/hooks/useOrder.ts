import { getOrder } from '../api/orders';
import { useQuery } from '@tanstack/react-query';

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
    enabled: id > 0,
  });
}
