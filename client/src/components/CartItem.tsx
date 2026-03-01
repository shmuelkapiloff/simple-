import { useUpdateCartItemMutation, useRemoveFromCartMutation } from "../api";
import type { CartItem as CartItemType } from "../types";

interface Props {
  item: CartItemType;
  compact?: boolean; // For checkout summary (no quantity controls)
}

export default function CartItem({ item, compact }: Props) {
  const [updateQty, { isLoading: updating }] = useUpdateCartItemMutation();
  const [remove, { isLoading: removing }] = useRemoveFromCartMutation();
  const isLoading = updating || removing;

  const product = item.product;
  const price = item.lockedPrice ?? product.price;

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Image */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {product.image.startsWith("http") ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {product.image}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500">
          ₪{price.toLocaleString()} ליחידה
        </p>

        {!compact && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => {
                if (item.quantity <= 1) remove({ productId: product._id });
                else
                  updateQty({
                    productId: product._id,
                    quantity: item.quantity - 1,
                  });
              }}
              disabled={isLoading}
              className="w-7 h-7 rounded-md border text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
            >
              −
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() =>
                updateQty({
                  productId: product._id,
                  quantity: item.quantity + 1,
                })
              }
              disabled={isLoading || item.quantity >= product.stock}
              className="w-7 h-7 rounded-md border text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50"
            >
              +
            </button>
            <button
              onClick={() => remove({ productId: product._id })}
              disabled={isLoading}
              className="mr-auto text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              הסר
            </button>
          </div>
        )}
        {compact && (
          <p className="text-sm text-gray-500 mt-1">כמות: {item.quantity}</p>
        )}
      </div>

      {/* Subtotal */}
      <div className="text-left font-bold text-gray-900 flex-shrink-0">
        ₪{(price * item.quantity).toLocaleString()}
      </div>
    </div>
  );
}
