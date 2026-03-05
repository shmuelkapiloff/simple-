import { useParams, Link, useOutletContext } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useGetProductQuery, useAddToCartMutation } from "../api";
import { useAuth } from "../hooks";
import StarRating from "../components/StarRating";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useGetProductQuery(id!);
  const { isAuthenticated } = useAuth();
  const authModal = useOutletContext<{ openLogin: (msg?: string) => void }>();
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  // Server returns product directly in data
  const product = data?.data?.product;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">המוצר לא נמצא</h1>
        <Link to="/" className="text-primary-600 hover:underline">
          חזרה לחנות
        </Link>
      </div>
    );
  }

  const handleAdd = async () => {
    if (!isAuthenticated) {
      authModal?.openLogin("יש להתחבר כדי להוסיף לעגלה");
      return;
    }
    try {
      await addToCart({ productId: product._id, quantity: qty }).unwrap();
      setAdded(true);
      addedTimer.current = setTimeout(() => setAdded(false), 2000);
    } catch {
      //
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">
          מוצרים
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.image.startsWith("http") ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              {product.image}
            </div>
          )}
        </div>

        <div>
          <span className="text-sm text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-1 mb-4">
            <StarRating rating={product.rating} size="md" />
          </div>

          <p className="text-3xl font-bold text-gray-900 mb-4">
            ₪{product.price.toLocaleString()}
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>

          <p
            className={`text-sm mb-6 ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {product.stock > 0
              ? `✓ במלאי (${product.stock} יח')`
              : "✗ אזל מהמלאי"}
          </p>

          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              >
                {added ? "✓ נוסף לעגלה!" : adding ? "מוסיף..." : "הוסף לעגלה"}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-6">מק"ט: {product.sku}</p>
        </div>
      </div>
    </div>
  );
}
