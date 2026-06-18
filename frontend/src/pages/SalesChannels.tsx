import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState, HeaderButton, LoadingSkeleton, Modal, PageHeader, PrimaryButton } from '../components';
import { useSalesChannels } from '../hooks/useSalesChannels';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatCurrency } from '../lib/utils';

export function SalesChannelsPage() {
  const navigate = useNavigate();
  const [connectOpen, setConnectOpen] = useState(false);
  const { data: channels, isLoading, error } = useSalesChannels();

  const openChannelListings = (channelName: string) => {
    navigate(`/listings?channel=${encodeURIComponent(channelName)}`);
  };

  if (error && !channels) {
    return <ErrorState message="Failed to load sales channels" />;
  }

  return (
    <div>
      <PageHeader
        title="Sales Channels"
        description={PAGE_DESCRIPTIONS.salesChannels}
        action={<HeaderButton onClick={() => setConnectOpen(true)}>Connect Channel</HeaderButton>}
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(channels ?? []).map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => openChannelListings(channel.name)}
              className="rounded-lg border border-gray-200 bg-white text-left shadow-sm transition hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              <div className="border-l-4 border-brand p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{channel.name}</h3>
                  <span className="rounded bg-mint px-2 py-0.5 text-xs font-semibold text-white">
                    {channel.listings_count > 0 ? 'Active' : 'Connected'}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <p>{channel.listings_count} active listings</p>
                  <p>{formatCurrency(Number(channel.revenue))} revenue</p>
                </div>
                <span className="mt-4 inline-block text-sm font-medium text-brand">Manage →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={connectOpen} onClose={() => setConnectOpen(false)} title="Connect a sales channel">
        <p className="text-sm text-gray-600">
          Choose a marketplace to view its listings from the database.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(channels ?? []).map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => {
                setConnectOpen(false);
                openChannelListings(channel.name);
              }}
              className="rounded-lg border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:border-brand hover:bg-brand/5"
            >
              {channel.name}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <PrimaryButton onClick={() => setConnectOpen(false)}>Close</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
