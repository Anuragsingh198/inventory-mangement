import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Layers, Package, QrCode } from 'lucide-react';
import type { InventorySort } from '../api/inventory';
import {
  Badge,
  DangerButton,
  ErrorState,
  FilterInput,
  InfoTip,
  LoadingSkeleton,
  Modal,
  PageCard,
  PageHeader,
  Pagination,
  PrimaryButton,
  RowActions,
  SortSelect,
  TabBar,
  Table,
  TableArea,
} from '../components';
import { getInventory } from '../api/inventory';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { useCategoryMutations } from '../hooks/useCategories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInventory, useInventoryMutations } from '../hooks/useInventory';
import { useCategories, useProductMutations, useProducts } from '../hooks/useProducts';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { usePagination } from '../hooks/usePagination';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { getApiErrorMessage } from '../lib/apiError';
import { downloadCsv } from '../lib/export';
import { getFavorites, isFavorite, toggleFavorite } from '../lib/favorites';
import {
  FAVORITE_STAR_HELP,
  getAddedToastMessage,
  INVENTORY_QUICK_ACTIONS,
  type QuickActionId,
} from '../lib/inventoryHelp';
import { formatCurrency, formatOrderId } from '../lib/utils';
import type { InventoryItem, ProductCreate } from '../types';

const emptyCompositeForm: ProductCreate = {
  name: '',
  sku: '',
  category_id: 0,
  price: 0,
  description: '',
  image_url: '',
};

type InventoryTab = 'items' | 'groups' | 'prices' | 'favorites';

const quickActions: { label: string; icon: typeof Package; action: QuickActionId }[] = [
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
  const [sort, setSort] = useState<InventorySort>('name');
  const [page, setPage] = useState(1);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [compositeOpen, setCompositeOpen] = useState(false);
  const [compositeForm, setCompositeForm] = useState<ProductCreate>(emptyCompositeForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getFavorites());
  const [newItem, setNewItem] = useState({ product_id: 0, quantity: 1, min_threshold: 10, location: 'USA' });
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const { pageSize } = usePageSize();
  const inventorySearch = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [inventorySearch, tab, pageSize, sort]);

  const { data, isLoading, isFetching, error } = useInventory(inventorySearch, { page, pageSize, sort });
  const { data: allInventoryData } = useInventory(undefined, { all: true, sort: 'name' });
  const { data: productsData } = useProducts(undefined, undefined, 'name', { all: true });
  const { data: categories } = useCategories();
  const { adjust, create, remove } = useInventoryMutations();
  const { create: createCategory } = useCategoryMutations();
  const { create: createProduct } = useProductMutations();

  const inventoryItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const products = productsData?.items;
  const showTableSkeleton = isLoading && !data;
  const tableLoading = isFetching && !showTableSkeleton;

  useEffect(() => {
    setFavoriteIds(getFavorites());
  }, []);

  const favoriteItems = useMemo(() => {
    const ids = new Set(favoriteIds);
    return (allInventoryData?.items ?? []).filter((item) => ids.has(item.product_id));
  }, [allInventoryData, favoriteIds]);

  const {
    page: favPage,
    pages: favPages,
    paged: pagedFavorites,
    setPage: setFavPage,
    total: favoritesTotal,
  } = usePagination(favoriteItems, `inventory-favorites-${favoriteIds.join(',')}`, pageSize);

  const categoryProductCounts = useMemo(() => {
    const map = new Map<number, number>();
    products?.forEach((product) => {
      map.set(product.category_id, (map.get(product.category_id) ?? 0) + 1);
    });
    return map;
  }, [products]);

  const inventoryProductIds = useMemo(
    () => new Set((allInventoryData?.items ?? []).map((item) => item.product_id)),
    [allInventoryData],
  );

  const availableProducts = useMemo(
    () => (products ?? []).filter((product) => !inventoryProductIds.has(product.id)),
    [products, inventoryProductIds],
  );

  const refreshFavorites = () => setFavoriteIds(getFavorites());

  const handleQuickAction = async (action: QuickActionId) => {
    if (!isAdmin && action !== 'barcodes') {
      showToast('Admin access required', 'error');
      return;
    }
    switch (action) {
      case 'new-item': {
        if (!availableProducts.length) {
          showToast('All products already have inventory. Create a composite item first.', 'error');
          return;
        }
        setNewItem({
          product_id: availableProducts[0].id,
          quantity: 1,
          min_threshold: 10,
          location: 'USA',
        });
        setCreateOpen(true);
        break;
      }
      case 'new-group':
        setGroupName('');
        setGroupDescription('');
        setGroupOpen(true);
        break;
      case 'composite': {
        if (!categories?.length) {
          showToast('Create an item group first, then add a composite item.', 'error');
          return;
        }
        setCompositeForm({
          ...emptyCompositeForm,
          category_id: categories[0].id,
          sku: `COMP-${Date.now().toString(36).toUpperCase()}`,
        });
        setCompositeOpen(true);
        break;
      }
      case 'barcodes': {
        const allInventory = await getInventory(undefined, 1, 0, true);
        if (!allInventory.items.length) {
          showToast('No inventory to export', 'error');
          return;
        }
        downloadCsv(
          'barcodes.csv',
          ['SKU', 'Product', 'Barcode'],
          allInventory.items.map((item) => [
            item.product?.sku ?? '',
            item.product?.name ?? '',
            `INV-${String(item.product_id).padStart(5, '0')}`,
          ]),
        );
        showToast(getAddedToastMessage('barcodes'), 'success');
        break;
      }
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.product_id) {
      showToast('Select a product', 'error');
      return;
    }
    try {
      await create.mutateAsync(newItem);
      showToast(getAddedToastMessage('new-item'), 'success');
      setCreateOpen(false);
      setTab('items');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to create item'), 'error');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Enter a group name', 'error');
      return;
    }
    try {
      await createCategory.mutateAsync({ name: groupName, description: groupDescription || undefined });
      showToast(getAddedToastMessage('new-group'), 'success');
      setGroupOpen(false);
      setTab('groups');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to create group'), 'error');
    }
  };

  const handleCreateComposite = async () => {
    if (!compositeForm.name.trim() || !compositeForm.sku.trim() || !compositeForm.category_id) {
      showToast('Enter name, SKU, and category', 'error');
      return;
    }
    try {
      await createProduct.mutateAsync(compositeForm);
      showToast(getAddedToastMessage('composite'), 'success');
      setCompositeOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to create composite item'), 'error');
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
    showToast(starred ? 'Added to favorites — see Favorites tab' : 'Removed from favorites', 'success');
  };

  if (error && !data) return <ErrorState message="Failed to load inventory" />;

  return (
    <div>
      <PageHeader title="Inventory" description={PAGE_DESCRIPTIONS.inventory} />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(({ label, icon: Icon, action }) => {
          const help = INVENTORY_QUICK_ACTIONS[action];
          return (
            <div key={label} className="relative flex flex-col items-center rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <InfoTip label={`About ${label}`} className="absolute right-3 top-3" align="right">
                <p className="text-xs font-semibold text-gray-800">{help.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{help.description}</p>
                <p className="mt-2 text-xs leading-relaxed text-brand">{help.where}</p>
              </InfoTip>
              <div className="mb-4 rounded-lg bg-sky-50 p-4 text-brand">
                <Icon className="h-8 w-8" />
              </div>
              <PrimaryButton className="w-full" onClick={() => handleQuickAction(action)}>
                {label}
              </PrimaryButton>
            </div>
          );
        })}
      </div>

      <PageCard>
        <TabBar
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'items', label: 'Items', count: tab === 'items' ? total : data?.total },
            { id: 'favorites', label: 'Favorites', count: favoriteIds.length || undefined },
            { id: 'groups', label: 'Item Groups (Variants)', count: categories?.length },
            { id: 'prices', label: 'Price List' },
          ]}
        />

        {(tab === 'items' || tab === 'prices') && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FilterInput
              value={search}
              onChange={setSearch}
              placeholder="ID, product, SKU, category, location, qty..."
              className="w-full sm:w-72"
            />
            <SortSelect
              value={sort}
              onChange={(value) => setSort(value as InventorySort)}
              defaultValue="name"
              className="shrink-0"
              options={[
                { value: 'name', label: 'Sort: Name' },
                { value: 'quantity', label: 'Sort: Qty' },
                { value: 'location', label: 'Sort: Location' },
              ]}
            />
          </div>
        )}

        {tab === 'items' && (
          <TableArea loading={tableLoading}>
            {showTableSkeleton ? (
              <LoadingSkeleton rows={6} />
            ) : (
              <>
            <Table headers={['ID', 'Product Name', 'Total QTY', 'Buy Price', 'Sell Price', 'Location', 'Action']}>
              {inventoryItems.map((item) => {
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
                          starHint={FAVORITE_STAR_HELP}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
              </>
            )}
          </TableArea>
        )}

        {tab === 'groups' && (
          <TableArea loading={tableLoading}>
            <Table headers={['Group Name', 'Description', 'Products', '']}>
              {(categories ?? []).map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-4 text-sm font-medium">{category.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{category.description ?? '—'}</td>
                  <td className="px-4 py-4 text-sm">{categoryProductCounts.get(category.id) ?? 0}</td>
                  <td className="px-4 py-4 text-sm">
                    <button
                      type="button"
                      className="text-brand hover:underline"
                      onClick={() => navigate(`/listings?category=${category.id}`)}
                    >
                      View in Listings
                    </button>
                  </td>
                </tr>
              ))}
              {(categories ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No item groups yet — use New Item Groups above
                  </td>
                </tr>
              )}
            </Table>
          </TableArea>
        )}

        {tab === 'favorites' && (
          <TableArea loading={!allInventoryData && favoriteIds.length > 0}>
            {favoriteIds.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No favorites yet. Star ⭐ any product in the Items tab to add it here.
              </p>
            ) : (
              <>
                <Table headers={['ID', 'Product Name', 'Total QTY', 'Location', 'Action']}>
                  {pagedFavorites.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-sm text-gray-500">{formatOrderId(item.product_id)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.product?.name}</td>
                      <td className="px-4 py-4 text-sm font-semibold">{item.quantity}</td>
                      <td className="px-4 py-4 text-sm">{item.location ?? 'USA'}</td>
                      <td className="px-4 py-4">
                        {isAdmin && (
                          <RowActions
                            onEdit={() => setAdjustItem(item)}
                            onDelete={() => setDeleteId(item.id)}
                            onStar={() => handleStar(item.product_id)}
                            starred={isFavorite(item.product_id) || favoriteIds.includes(item.product_id)}
                            starHint={FAVORITE_STAR_HELP}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pagination page={favPage} total={favPages} onChange={setFavPage} totalItems={favoritesTotal} />
              </>
            )}
          </TableArea>
        )}

        {tab === 'prices' && (
          <TableArea loading={tableLoading}>
            {showTableSkeleton ? (
              <LoadingSkeleton rows={6} />
            ) : (
              <>
            <Table headers={['Product', 'SKU', 'Buy Price', 'Sell Price', 'Margin']}>
              {inventoryItems.map((item) => {
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
            <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
              </>
            )}
          </TableArea>
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
          <PrimaryButton loading={adjust.isPending} onClick={handleAdjust}>Apply</PrimaryButton>
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
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            {availableProducts.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Every product already has inventory. Use New Composite Items to add a product first.
              </p>
            )}
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
          <PrimaryButton loading={create.isPending} onClick={handleCreateItem}>Create</PrimaryButton>
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
          <PrimaryButton loading={createCategory.isPending} onClick={handleCreateGroup}>Create</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={compositeOpen} onClose={() => setCompositeOpen(false)} title="New Composite Item" size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Name</label>
            <input
              value={compositeForm.name}
              onChange={(e) => setCompositeForm({ ...compositeForm, name: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">SKU</label>
            <input
              value={compositeForm.sku}
              onChange={(e) => setCompositeForm({ ...compositeForm, sku: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Category</label>
            <select
              value={compositeForm.category_id}
              onChange={(e) => setCompositeForm({ ...compositeForm, category_id: Number(e.target.value) })}
              className="w-full rounded-lg border px-3 py-2"
            >
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Price</label>
            <input
              type="number"
              step="0.01"
              value={compositeForm.price}
              onChange={(e) => setCompositeForm({ ...compositeForm, price: Number(e.target.value) })}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Description</label>
            <textarea
              value={compositeForm.description}
              onChange={(e) => setCompositeForm({ ...compositeForm, description: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
              rows={2}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setCompositeOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <PrimaryButton loading={createProduct.isPending} onClick={handleCreateComposite}>Create</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Inventory Item">
        <p className="text-sm text-gray-600">Remove this item from inventory?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <DangerButton loading={remove.isPending} onClick={handleDelete}>Delete</DangerButton>
        </div>
      </Modal>
    </div>
  );
}
