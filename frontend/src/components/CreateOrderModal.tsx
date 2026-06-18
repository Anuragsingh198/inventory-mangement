import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal, PrimaryButton } from './index';
import { useOrderMutations } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../context/ToastContext';
import type { OrderCreate, OrderItemCreate } from '../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const { showToast } = useToast();
  const { data: products } = useProducts();
  const { create } = useOrderMutations();
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemCreate[]>([{ product_id: 0, quantity: 1, unit_price: 0 }]);

  const reset = () => {
    setSupplier('');
    setNotes('');
    setItems([{ product_id: 0, quantity: 1, unit_price: 0 }]);
  };

  const updateLine = (idx: number, field: keyof OrderItemCreate, value: number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'product_id') {
      const product = products?.find((p) => p.id === value);
      if (product) updated[idx].unit_price = product.price;
    }
    setItems(updated);
  };

  const handleCreate = async () => {
    if (!supplier || items.some((i) => !i.product_id)) {
      showToast('Fill all required fields', 'error');
      return;
    }
    try {
      await create.mutateAsync({ supplier, notes, items } satisfies OrderCreate);
      showToast('Order created', 'success');
      reset();
      onClose();
      onSuccess?.();
    } catch {
      showToast('Failed to create order', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Order" size="lg">
      <div className="space-y-4">
        <input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier / Customer"
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
          rows={2}
        />
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              value={item.product_id}
              onChange={(e) => updateLine(idx, 'product_id', Number(e.target.value))}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value={0}>Select product</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
              className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              value={item.unit_price}
              onChange={(e) => updateLine(idx, 'unit_price', Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, { product_id: 0, quantity: 1, unit_price: 0 }])}
          className="text-sm text-brand hover:underline"
        >
          + Add line
        </button>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button>
        <PrimaryButton onClick={handleCreate}>Create</PrimaryButton>
      </div>
    </Modal>
  );
}
