import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectProductToChannel,
  disconnectProductFromChannel,
  getSalesChannels,
} from '../api/salesChannels';

export function useSalesChannels() {
  return useQuery({
    queryKey: ['sales-channels'],
    queryFn: getSalesChannels,
  });
}

export function useSalesChannelMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const connect = useMutation({
    mutationFn: ({ channelId, productId }: { channelId: number; productId: number }) =>
      connectProductToChannel(channelId, productId),
    onSuccess: invalidate,
  });

  const disconnect = useMutation({
    mutationFn: ({ channelId, productId }: { channelId: number; productId: number }) =>
      disconnectProductFromChannel(channelId, productId),
    onSuccess: invalidate,
  });

  return { connect, disconnect };
}
