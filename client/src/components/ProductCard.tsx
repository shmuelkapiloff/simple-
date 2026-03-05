import { Link } from "react-router-dom";
import {
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
} from "../api";
import { useAuth, useCart } from "../hooks";
import { useOutletContext } from "react-router-dom";
import StarRating from "./StarRating";
import type { Product, CartItem } from "../types";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { isAuthenticated } = useAuth();
  const { items } = useCart();
  const authModal = useOutletContext<
    { openLogin: (msg?: string) => void } | undefined
  >();
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [updateQty, { isLoading: updating }] = useUpdateCartItemMutation();
  const [remove, { isLoading: removing }] = useRemoveFromCartMutation();
  const isLoading = adding || updating || removing;

  // Check if product is already in cart
  const cartItem = items.find(
    (item: CartItem) => item.product?._id === product._id,
  );
  const quantityInCart = cartItem?.quantity ?? 0;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      authModal?.openLogin("יש להתחבר כדי להוסיף לעגלה");
      return;
    }
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
    } catch {
      // silent — RTK Query will show error state
    }
  };

  const handleDecrease = async () => {
    if (quantityInCart <= 1) {
      await remove({ productId: product._id }).unwrap();
    } else {
      await updateQty({
        productId: product._id,
        quantity: quantityInCart - 1,
      }).unwrap();
    }
  };

  const inStock = product.stock > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition group overflow-hidden flex flex-col">
      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        className="block aspect-square overflow-hidden bg-gray-100"
      >
        {product.image.startsWith("http") ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {product.image}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full self-start mb-2">
          {product.category}
        </span>
        <Link
          to={`/products/${product._id}`}
          className="font-semibold text-gray-900 hover:text-primary-600 transition line-clamp-2 mb-1"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <StarRating rating={product.rating} />

        {/* Price + Button */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t">
          <span className="text-lg font-bold text-gray-900">
            ₪{product.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {quantityInCart > 0 ? (
              /* Quantity controls when item is in cart */
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDecrease}
                  disabled={isLoading}
                  className="w-8 h-8 rounded-lg border text-gray-600 hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 transition"
                >
                  {quantityInCart === 1 ? "🗑️" : "−"}
                </button>
                <span className="w-8 text-center font-medium text-sm">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleAdd}
                  disabled={isLoading || quantityInCart >= product.stock}
                  className="w-8 h-8 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center disabled:opacity-50 transition"
                >
                  +
                </button>
              </div>
            ) : (
              /* Add to cart button when not in cart */
              <button
                onClick={handleAdd}
                disabled={isLoading || !inStock}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  inStock
                    ? "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {!inStock ? "אזל" : isLoading ? "..." : "הוסף לעגלה"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
