import { Link } from "react-router-dom";
import { useAddToCartMutation } from "../api";
import { useAuth, useCart } from "../hooks";
import { useOutletContext } from "react-router-dom";
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
  const [addToCart, { isLoading }] = useAddToCartMutation();

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
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${star <= Math.round(product.rating) ? "text-yellow-400" : "text-gray-200"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-gray-400 mr-1">
            {product.rating.toFixed(1)}
          </span>
        </div>

        {/* Price + Button */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t">
          <span className="text-lg font-bold text-gray-900">
            ₪{product.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            {quantityInCart > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {quantityInCart} בעגלה
              </span>
            )}
            <button
              onClick={handleAdd}
              disabled={isLoading || !inStock}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                inStock
                  ? "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {!inStock
                ? "אזל"
                : isLoading
                  ? "..."
                  : quantityInCart > 0
                    ? "+"
                    : "הוסף לעגלה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
