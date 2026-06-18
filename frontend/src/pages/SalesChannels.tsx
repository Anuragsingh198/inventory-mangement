import { useNavigate } from 'react-router-dom';
import { PageHeader, PrimaryButton } from '../components';
import { useProducts } from '../hooks/useProducts';
import { SALES_CHANNELS } from '../lib/utils';

export function SalesChannelsPage() {
  const navigate = useNavigate();
  const { data: products } = useProducts();

  const channelStats = SALES_CHANNELS.map((name, i) => {
    const listings = products?.filter((p) => p.id % SALES_CHANNELS.length === i).length ?? (i + 3) * 12;
    const revenue = products
      ?.filter((p) => p.id % SALES_CHANNELS.length === i)
      .reduce((sum, p) => sum + Number(p.price), 0) ?? (i + 1) * 4200;

    return {
      name,
      listings,
      revenue,
      status: i % 3 === 0 ? 'Active' : 'Connected',
    };
  });

  return (
    <div>
      <PageHeader
        title="Sales Channels"
        action={
          <PrimaryButton onClick={() => navigate('/listings', { state: { openCreate: true } })}>
            Connect Channel
          </PrimaryButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channelStats.map((ch) => (
          <div key={ch.name} className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-brand p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{ch.name}</h3>
                <span className="rounded bg-mint px-2 py-0.5 text-xs font-semibold text-white">{ch.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p>{ch.listings} active listings</p>
                <p>${ch.revenue.toLocaleString()} revenue</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/listings?search=${encodeURIComponent(ch.name)}`)}
                className="mt-4 text-sm font-medium text-brand hover:underline"
              >
                Manage →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
