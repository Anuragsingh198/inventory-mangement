import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Layers, Package, QrCode } from 'lucide-react';
import {
  Badge,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageCard,
  PageHeader,
  Pagination,
  PrimaryButton,
  RowActions,
  SearchInput,
  TabBar,
  Table,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCategoryMutations } from '../hooks/useCategories';
import { useInventory, useInventoryMutations } from '../hooks/useInventory';
import { useProducts } from '../hooks/useProducts';
import { usePagination } from '../hooks/usePagination';
import { downloadCsv } from '../lib/export';
import { getFavorites, isFavorite, toggleFavorite } from '../lib/favorites';
import { formatCurrency, formatOrderId, PAGE_SIZE } from '../lib/utils';
import type { InventoryItem } from '../types';

type InventoryTab = 'items' | 'groups' | 'prices';
type QuickAction = 'new-item' | 'new-group' | 'composite' | 'barcodes';

const quickActions: { label: string; icon: typeof Package; action: QuickAction }[] = [
  { label: 'New Item', icon: Package, action: 'new-item' },
  { label: 'New Item Groups', icon: Layers, action: 'new-group' },
  { label: 'New Composite Items', icon: Box, action: 'composite' },
  { label: 'Barcodes', icon: QrCode, action: 'barcodes' },
];

function stockLevel(item: InventoryItem): 'danger' | 'warning' | 'success' {
  if (item.quantity < item.min_threshold) return 'danger';
  if (item.quantity < item.min_threshold * 1.2) return 'warning';
  return 'success';
}

export function InventoryPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<InventoryTab>('items');
  const [search, setSearch] = useState('');
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [newItem, setNewItem] = useState({ product_id: 0, quantity: 0, min_threshold: 10, location: 'USA' });
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const { data: inventory, isLoading, error } = useInventory();
  const { data: products } = useProducts();
  const { adjust, create, remove } = useInventoryMutations();
  const { create: createCategory } = useCategoryMutations();

  const filtered = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(
      (item) =>
        item.product?.name.toLowerCase().includes(search.toLowerCase()) ||
        item.product?.sku.toLowerCase().includes(search.toLowerCase()),
    );
  }, [inventory, search]);

  const { page, pages, paged, setPage, total } = usePagination(filtered, `${search}-${tab}`);

  const refreshFavorites = () => setFavoriteIds(getFavorites());

  const handleQuickAction = (action: QuickAction) => {
    if (!isAdmin && action !== 'barcodes') {
      showToast('Admin access required', 'error');
      return;
    }
    switch (action) {
      case 'new-item':
        setNewItem({ product_id: products?.[0]?.id ?? 0, quantity: 0, min_threshold: 10, location: 'USA' });
        setCreateOpen(true);
        break;
      case 'new-group':
        setGroupName('');
        setGroupDescription('');
        setGroupOpen(true);
        break;
      case 'composite':
        navigate('/listings', { state: { openCreate: true } });
        break;
      case 'barcodes':
        if (!inventory?.length) {
          showToast('No inventory to export', 'error');
          return;
        }
        downloadCsv(
          'barcodes.csv',
          ['SKU', 'Product', 'Barcode'],
          inventory.map((item) => [
            item.product?.sku ?? '',
            item.product?.name ?? '',
            `INV-${String(item.product_id).padStart(5, '0')}`,
          ]),
        );
        showToast('Barcodes exported', 'success');
        break;
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.product_id) {
      showToast('Select a product', 'error');
      return;
    }
    try {
      await create.mutateAsync(newItem);
      showToast('Inventory item created', 'success');
      setCreateOpen(false);
    } catch {
      showToast('Failed to create item', 'error');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Enter a group name', 'error');
      return;
    }
    try {
      await createCategory.mutateAsync({ name: groupName, description: groupDescription || undefined });
      showToast('Item group created', 'success');
      setGroupOpen(false);
    } catch {
      showToast('Failed to create group', 'error');
    }
  };

  const handleAdjust = async () => {
    if (!adjustItem || !reason) return;
    try {
      await adjust.mutateAsync({ id: adjustItem.id, data: { adjustment, reason } });
      showToast('Stock adjusted', 'success');
      setAdjustItem(null);
      setAdjustment(0);
      setReason('');
    } catch {
      showToast('Failed to adjust stock', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      showToast('Item removed', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  const handleStar = (productId: number) => {
    const starred = toggleFavorite(productId);
    refreshFavorites();
    showToast(starred ? 'Added to favorites' : 'Removed from favorites', 'success');
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load inventory" />;

  return (
    <div>
      <PageHeader title="Inventory" />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(({ label, icon: Icon, action }) => (
          <div key={label} className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 rounded-lg bg-sky-50 p-4 text-brand">
              <Icon className="h-8 w-8" />
            </div>
            <PrimaryButton className="w-full" onClick={() => handleQuickAction(action)}>
              {label}
            </PrimaryButton>
          </div>
        ))}
      </div>

      <PageCard>
        <TabBar
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'items', label: 'Items', count: tab === 'items' ? total : inventory?.length },
            { id: 'groups', label: 'Item Groups (Variants)' },
            { id: 'prices', label: 'Price List' },
          ]}
        />

        {tab === 'items' && (
          <>
            <Table
              headers={['ID', 'Product Name', 'Total QTY', 'Buy Price', 'Sell Price', 'Location', 'Action']}
              filterRow={
                <>
                  <td colSpan={7} className="px-3 py-2">
                    <SearchInput value={search} onChange={setSearch} placeholder="Filter products..." className="max-w-xs" />
                  </td>
                </>
              }
            >
              {paged.map((item) => {
                const buyPrice = Number(item.product?.price ?? 0) * 0.85;
                const level = stockLevel(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-sm text-gray-500">{formatOrderId(item.product_id)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.product?.name}</td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold">{item.quantity}</span>
                      {level !== 'success' && (
                        <span className="ml-2">
                          <Badge variant={level}>{level === 'danger' ? 'Low' : 'Warn'}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">{formatCurrency(buyPrice)}</td>
                    <td className="px-4 py-4 text-sm">{formatCurrency(Number(item.product?.price ?? 0))}</td>
                    <td className="px-4 py-4 text-sm">{item.location ?? 'USA'}</td>
                    <td className="px-4 py-4">
                      {isAdmin && (
                        <RowActions
                          onEdit={() => setAdjustItem(item)}
                          onDelete={() => setDeleteId(item.id)}
                          onStar={() => handleStar(item.product_id)}
                          starred={isFavorite(item.product_id) || favoriteIds.includes(item.product_id)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
          </>
        )}

        {tab === 'groups' && (
          <Table headers={['Group Name', 'Variants', 'Total QTY', 'Location']}>
            {filtered.slice(0, 5).map((item, i) => (
              <tr key={item.id}>
                <td className="px-4 py-4 text-sm font-medium">{item.product?.name} Group</td>
                <td className="px-4 py-4 text-sm">{3 + (i % 4)}</td>
                <td className="px-4 py-4 text-sm">{item.quantity}</td>
                <td className="px-4 py-4 text-sm">{item.location ?? 'USA'}</td>
              </tr>
            ))}
          </Table>
        )}

        {tab === 'prices' && (
          <>
            <Table headers={['Product', 'SKU', 'Buy Price', 'Sell Price', 'Margin']}>
              {paged.map((item) => {
                const sell = Number(item.product?.price ?? 0);
                const buy = sell * 0.85;
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-4 text-sm">{item.product?.name}</td>
                    <td className="px-4 py-4 text-sm">
                      <code className="text-xs">{item.product?.sku}</code>
                    </td>
                    <td className="px-4 py-4 text-sm">{formatCurrency(buy)}</td>
                    <td className="px-4 py-4 text-sm">{formatCurrency(sell)}</td>
                    <td className="px-4 py-4 text-sm text-green-600">
                      {sell > 0 ? `${(((sell - buy) / sell) * 100).toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
          </>
        )}
      </PageCard>

      <Modal isOpen={adjustItem !== null} onClose={() => setAdjustItem(null)} title="Adjust Stock">
        <p className="mb-4 text-sm text-gray-500">
          {adjustItem?.product?.name} — current: {adjustItem?.quantity}
        </p>
        <div className="space-y-4">
          <input
            type="number"
            value={adjustment}
            onChange={(e) => setAdjustment(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Adjustment (+/-)"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            rows={2}
            placeholder="Reason..."
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setAdjustItem(null)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <PrimaryButton onClick={handleAdjust}>Apply</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Inventory Item">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Product</label>
            <select
              value={newItem.product_id}
              onChange={(e) => setNewItem({ ...newItem, product_id: Number(e.target.value) })}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value={0}>Select product</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Quantity</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Min threshold</label>
              <input
                type="number"
                value={newItem.min_threshold}
                onChange={(e) => setNewItem({ ...newItem, min_threshold: Number(e.target.value) })}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm">Location</label>
            <input
              value={newItem.location}
              onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <PrimaryButton onClick={handleCreateItem}>Create</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={groupOpen} onClose={() => setGroupOpen(false)} title="New Item Group">
        <div className="space-y-4">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border px-3 py-2"
          />
          <textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border px-3 py-2"
            rows={2}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setGroupOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <PrimaryButton onClick={handleCreateGroup}>Create</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Inventory Item">
        <p className="text-sm text-gray-600">Remove this item from inventory?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
