import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ChannelLink,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  Modal,
  PageCard,
  PageHeader,
  Pagination,
  PrimaryButton,
  RowActions,
  SortSelect,
  Table,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useInventory } from '../hooks/useInventory';
import { useCategories, useProductMutations, useProducts } from '../hooks/useProducts';
import { usePagination } from '../hooks/usePagination';
import {
  formatOrderId,
  getProductChannels,
  PAGE_SIZE,
  PRODUCT_PLACEHOLDER,
} from '../lib/utils';
import { getFavorites, isFavorite, toggleFavorite } from '../lib/favorites';
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
  const [sort, setSort] = useState('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductCreate>(emptyForm);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getFavorites());

  const { data: products, isLoading, error } = useProducts(search || undefined);
  const { data: categories } = useCategories();
  const { data: inventory } = useInventory();
  const { create, update, remove } = useProductMutations();

  const qtyMap = useMemo(() => {
    const map = new Map<number, number>();
    inventory?.forEach((item) => map.set(item.product_id, item.quantity));
    return map;
  }, [inventory]);

  const sorted = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      if (sort === 'sku') return a.sku.localeCompare(b.sku);
      if (sort === 'price') return Number(a.price) - Number(b.price);
      return a.name.localeCompare(b.name);
    });
  }, [products, sort]);

  const { page, pages, paged, setPage, total } = usePagination(sorted, `${search}-${sort}`);

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

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load listings" />;

  return (
    <div>
      <PageHeader
        title="Listings"
        action={isAdmin && <PrimaryButton onClick={openCreate}>Create Draft</PrimaryButton>}
      />

      <PageCard>
        <Table
          headers={['ID', '', 'Product Name', 'QTY', 'Active Listings', 'Action']}
          filterRow={
            <>
              <td className="px-3 py-2" />
              <td className="px-3 py-2" />
              <td className="px-3 py-2">
                <FilterInput value={search} onChange={setSearch} placeholder="Filter name..." />
              </td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2" />
              <td className="px-3 py-2">
                <SortSelect
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'name', label: 'Sort: Name' },
                    { value: 'sku', label: 'Sort: SKU' },
                    { value: 'price', label: 'Sort: Price' },
                  ]}
                />
              </td>
            </>
          }
        >
          {paged.map((product) => {
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

        <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
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
          <PrimaryButton onClick={handleSubmit}>Save</PrimaryButton>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Listing">
        <p className="text-sm text-gray-600">Are you sure you want to delete this listing?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
