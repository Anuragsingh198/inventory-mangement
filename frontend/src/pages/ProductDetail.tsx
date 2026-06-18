import { useParams } from 'react-router-dom';
import { ErrorState, LoadingSkeleton, PageCard, PageHeader, Table } from '../components';
import { useInventory } from '../hooks/useInventory';
import { useProductDetail, useProductVariants, useStockMovements } from '../hooks/useEnterprise';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatCurrency, formatDate } from '../lib/utils';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading, error } = useProductDetail(productId);
  const { data: variants } = useProductVariants(productId);
  const { data: movements } = useStockMovements(productId);
  const { data: inventoryData } = useInventory(undefined, { all: true });
  const inventory = inventoryData?.items;

  const stock = inventory?.find((i) => i.product_id === productId);

  if (isLoading) return <LoadingSkeleton />;
  if (error || !product) return <ErrorState message="Product not found" />;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={product.description || PAGE_DESCRIPTIONS.productDetail}
        showDate={false}
        backTo={{ label: 'Back to Listings', path: '/listings' }}
      />
      <PageCard>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">SKU</p>
            <p className="font-medium">{product.sku}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Category</p>
            <p className="font-medium">{product.category?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="font-medium">{formatCurrency(Number(product.price))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Stock</p>
            <p className="font-medium">{stock?.quantity ?? 0} units</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Barcode</p>
            <p className="font-medium">{product.barcode ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Cost Price</p>
            <p className="font-medium">{product.cost_price ? formatCurrency(Number(product.cost_price)) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Min Threshold</p>
            <p className="font-medium">{stock?.min_threshold ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium">{formatDate(product.created_at)}</p>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-gray-700">Variants</h2>
        <Table headers={['SKU', 'Attributes', 'Price']}>
          {(variants ?? []).length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No variants</td></tr>
          ) : (
            (variants as { id: number; sku: string; attributes: Record<string, string> | null; price: number | null }[]).map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3 text-sm">{v.sku}</td>
                <td className="px-4 py-3 text-sm">{v.attributes ? JSON.stringify(v.attributes) : '—'}</td>
                <td className="px-4 py-3 text-sm">{v.price ? formatCurrency(Number(v.price)) : '—'}</td>
              </tr>
            ))
          )}
        </Table>

        <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-700">Recent Stock Movements</h2>
        <Table headers={['Type', 'Qty Change', 'Reason', 'Date']}>
          {(movements ?? []).length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No movements</td></tr>
          ) : (
            movements!.slice(0, 10).map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-sm">{m.movement_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-sm">{m.quantity_delta > 0 ? '+' : ''}{m.quantity_delta}</td>
                <td className="px-4 py-3 text-sm">{m.reason ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{formatDate(m.created_at)}</td>
              </tr>
            ))
          )}
        </Table>
      </PageCard>
    </div>
  );
}
