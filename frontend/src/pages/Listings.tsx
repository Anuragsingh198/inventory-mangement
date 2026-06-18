import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { ProductSort } from '../api/products';
import {
  ChannelLink,
  DangerButton,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  Modal,
  PageCard,
  PageHeader,
  Pagination,
  HeaderButton,
  PrimaryButton,
  RowActions,
  SortSelect,
  Table,
  TableArea,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInventory } from '../hooks/useInventory';
import { useCategories, useProductMutations, useProducts } from '../hooks/useProducts';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { getFavorites, isFavorite, toggleFavorite } from '../lib/favorites';
import {
  formatOrderId,
  getProductChannels,
  PRODUCT_PLACEHOLDER,
} from '../lib/utils';
import type { Product, ProductCreate } from '../types';

const emptyForm: ProductCreate = {
  name: '',
  sku: '',
  category_id: 0,
  price: 0,
  description: '',
  image_url: '',
};

export function ListingsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [sort, setSort] = useState<ProductSort>('name');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductCreate>(emptyForm);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getFavorites());

  const { pageSize } = usePageSize();
  const debouncedSearch = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [debouncedSearch, sort, pageSize]);

  const { data, isLoading, isFetching, error } = useProducts(debouncedSearch, undefined, sort, { page, pageSize });
  const { data: categories } = useCategories();
  const { data: inventoryData } = useInventory(undefined, { all: true });
  const { create, update, remove } = useProductMutations();

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const qtyMap = useMemo(() => {
    const map = new Map<number, number>();
    inventoryData?.items.forEach((item) => map.set(item.product_id, item.quantity));
    return map;
  }, [inventoryData]);

  const showTableSkeleton = isLoading && !data;
  const tableLoading = isFetching && !showTableSkeleton;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category_id: categories?.[0]?.id ?? 0 });
    setModalOpen(true);
  };

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null;
    if (state?.openCreate && isAdmin) {
      openCreate();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isAdmin, categories]);

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      price: product.price,
      description: product.description ?? '',
      image_url: product.image_url ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: form });
        showToast('Listing updated', 'success');
      } else {
        await create.mutateAsync(form);
        showToast('Draft created', 'success');
      }
      setModalOpen(false);
    } catch {
      showToast('Failed to save listing', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      showToast('Listing deleted', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleStar = (productId: number) => {
    const starred = toggleFavorite(productId);
    setFavoriteIds(getFavorites());
    showToast(starred ? 'Added to favorites' : 'Removed from favorites', 'success');
  };

  if (error && !data) return <ErrorState message="Failed to load listings" />;

  return (
    <div>
      <PageHeader
        title="Listings"
        description={PAGE_DESCRIPTIONS.listings}
        action={isAdmin && <HeaderButton onClick={openCreate}>Create Draft</HeaderButton>}
      />

      <PageCard>
        <TableArea loading={tableLoading}>
          {showTableSkeleton ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="ID, name, SKU, or description..."
            className="w-full sm:w-72"
          />
          <SortSelect
            value={sort}
            onChange={(value) => setSort(value as ProductSort)}
            defaultValue="name"
            className="shrink-0"
            options={[
              { value: 'name', label: 'Sort: Name' },
              { value: 'price', label: 'Sort: Price' },
              { value: 'quantity', label: 'Sort: Qty' },
            ]}
          />
        </div>
        <Table headers={['ID', '', 'Product Name', 'QTY', 'Active Listings', 'Action']}>
          {products.map((product) => {
            const channels = getProductChannels(product.id);
            return (
              <tr key={product.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-4 text-sm text-gray-500">{formatOrderId(product.id)}</td>
                <td className="px-4 py-4">
                  <img
                    src={product.image_url || PRODUCT_PLACEHOLDER}
                    alt={product.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                </td>
                <td className="px-4 py-4">
                  <Link to={`/listings/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-brand hover:underline">
                    {product.name}
                  </Link>
                  <p className="text-xs text-gray-400">{product.category?.name}</p>
                </td>
                <td className="px-4 py-4 text-sm font-medium">{qtyMap.get(product.id) ?? 0}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {channels.map((ch, i) => (
                      <span key={ch}>
                        <ChannelLink name={ch} />
                        {i < channels.length - 1 && <span className="text-gray-300"> · </span>}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {isAdmin && (
                    <RowActions
                      onEdit={() => openEdit(product)}
                      onDelete={() => setDeleteId(product.id)}
                      onStar={() => handleStar(product.id)}
                      starred={isFavorite(product.id) || favoriteIds.includes(product.id)}
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
      </PageCard>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Listing' : 'Create Draft'} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm">SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2">
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Price</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <PrimaryButton loading={create.isPending || update.isPending} onClick={handleSubmit}>Save</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Listing">
        <p className="text-sm text-gray-600">Are you sure you want to delete this listing?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <DangerButton loading={remove.isPending} onClick={handleDelete}>Delete</DangerButton>
        </div>
      </Modal>
    </div>
  );
}
