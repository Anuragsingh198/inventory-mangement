import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, ErrorState, FilterSelect, LoadingSkeleton, Modal, Pagination, SearchInput, Table, TableArea } from '../components';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useCategories, useProductMutations, useProducts } from '../hooks/useProducts';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import type { Product, ProductCreate } from '../types';

const emptyForm: ProductCreate = {
  name: '',
  sku: '',
  category_id: 0,
  price: 0,
  description: '',
  image_url: '',
};

export function ProductsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductCreate>(emptyForm);

  const { pageSize } = usePageSize();
  const debouncedSearch = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [debouncedSearch, categoryFilter, pageSize]);

  const { data, isLoading, isFetching, error } = useProducts(debouncedSearch, categoryFilter, 'name', { page, pageSize });
  const { data: categories } = useCategories();
  const { create, update, remove } = useProductMutations();

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const showTableSkeleton = isLoading && !data;
  const tableLoading = isFetching && !showTableSkeleton;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category_id: categories?.[0]?.id ?? 0 });
    setModalOpen(true);
  };

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
        showToast('Product updated', 'success');
      } else {
        await create.mutateAsync(form);
        showToast('Product created', 'success');
      }
      setModalOpen(false);
    } catch {
      showToast('Failed to save product', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      showToast('Product deleted', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  if (error && !data) return <ErrorState message="Failed to load products" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SearchInput
          label="Search products"
          value={search}
          onChange={setSearch}
          placeholder="ID, name, SKU, or description..."
        />
        <FilterSelect
          label="Category"
          value={categoryFilter ? String(categoryFilter) : ''}
          onChange={(value) => setCategoryFilter(value ? Number(value) : undefined)}
          placeholder="All categories"
          options={categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []}
        />
      </div>

      <TableArea loading={tableLoading}>
        {showTableSkeleton ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <>
      <Table headers={['Name', 'SKU', 'Category', 'Price', 'Actions']}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
            <td className="px-4 py-3">
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">{product.sku}</code>
            </td>
            <td className="px-4 py-3 text-sm">
              <Badge>{product.category?.name ?? '—'}</Badge>
            </td>
            <td className="px-4 py-3 text-sm">${Number(product.price).toFixed(2)}</td>
            <td className="px-4 py-3">
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(product)} className="text-blue-600 hover:text-blue-800">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(product.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pagination
        page={page}
        total={pages}
        onChange={setPage}
        totalItems={total}
      />
          </>
        )}
      </TableArea>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm">SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Category</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2">
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Price</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Save</button>
        </div>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-sm text-gray-600">Are you sure you want to delete this product?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button>
          <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
