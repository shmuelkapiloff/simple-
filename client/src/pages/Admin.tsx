import { useState } from "react";
import {
  useGetAdminStatsQuery,
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../api";
import type { Product, AdminProductRequest, User, Order } from "../types";

type Tab = "stats" | "products" | "orders" | "users";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("stats");

  const tabs: { key: Tab; label: string }[] = [
    { key: "stats", label: "סטטיסטיקות" },
    { key: "products", label: "מוצרים" },
    { key: "orders", label: "הזמנות" },
    { key: "users", label: "משתמשים" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">לוח ניהול</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8 max-w-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              tab === t.key
                ? "bg-white shadow text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "users" && <UsersTab />}
    </div>
  );
}

// ==== Stats ====
function StatsTab() {
  const { data, isLoading } = useGetAdminStatsQuery();
  // Server returns { data: { stats: { sales, orders, inventory, users } } }
  const stats = data?.data?.stats;

  if (isLoading)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "מכירות",
            value: `₪${(stats?.sales?.total ?? 0).toLocaleString()}`,
            emoji: "💰",
          },
          { label: "הזמנות פתוחות", value: stats?.orders?.open ?? 0, emoji: "📦" },
          { label: "משתמשים", value: stats?.users?.total ?? 0, emoji: "👥" },
          { label: "מוצרים", value: stats?.inventory?.activeProducts ?? 0, emoji: "🏷️" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-6">
            <p className="text-3xl mb-1">{card.emoji}</p>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {stats?.inventory?.lowStockProducts && stats.inventory.lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-800 mb-3">⚠️ מלאי נמוך</h3>
          <div className="space-y-2">
            {stats.inventory.lowStockProducts.map((p: { _id: string; name: string; stock: number }) => (
              <div key={p._id} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="font-bold text-yellow-700">{p.stock} יח'</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==== Products ====
function ProductsTab() {
  const { data, isLoading } = useGetAdminProductsQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updatingProd }] =
    useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  // Server returns { data: { products: [...] } }
  const products = data?.data?.products ?? [];
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyProduct: AdminProductRequest = {
    name: "",
    sku: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    stock: 0,
  };
  const [form, setForm] = useState<AdminProductRequest>(emptyProduct);

  const startEdit = (p: Product) => {
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description,
      price: p.price,
      category: p.category,
      image: p.image,
      stock: p.stock,
      featured: p.featured,
    });
    setEditing(p);
    setShowForm(true);
  };

  const startCreate = () => {
    setForm(emptyProduct);
    setEditing(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateProduct({ id: editing._id, data: form }).unwrap();
      } else {
        await createProduct(form).unwrap();
      }
      setShowForm(false);
      setEditing(null);
    } catch {
      /* */
    }
  };

  const F = (key: keyof AdminProductRequest, label: string, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[key] as string | number}
        onChange={(e) =>
          setForm({
            ...form,
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          })
        }
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
      />
    </div>
  );

  if (isLoading)
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500">{products.length} מוצרים</p>
        <button
          onClick={startCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          + מוצר חדש
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border p-6 mb-6 space-y-3"
        >
          <h3 className="font-bold text-lg">
            {editing ? "עריכת מוצר" : "מוצר חדש"}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {F("name", "שם")}
            {F("sku", 'מק"ט')}
            {F("category", "קטגוריה")}
            {F("price", "מחיר", "number")}
            {F("stock", "מלאי", "number")}
            {F("image", "תמונה (URL או emoji)")}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תיאור
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating || updatingProd}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {creating || updatingProd ? "שומר..." : "שמור"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">מוצר</th>
              <th className="text-right px-4 py-3 font-medium">מחיר</th>
              <th className="text-right px-4 py-3 font-medium">מלאי</th>
              <th className="text-right px-4 py-3 font-medium">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p._id}
                className="border-b last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">₪{p.price.toLocaleString()}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {p.isActive ? "פעיל" : "לא פעיל"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-primary-600 hover:underline"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => deleteProduct(p._id)}
                      className="text-red-500 hover:underline"
                    >
                      מחק
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==== Orders ====
function OrdersTab() {
  const { data, isLoading } = useGetAdminOrdersQuery();
  const [updateStatus, { isLoading: updatingStatus }] =
    useUpdateOrderStatusMutation();
  // Server returns { data: { orders: [...] } }
  const orders = data?.data?.orders ?? [];
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const statuses = [
    "pending",
    "pending_payment",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const statusLabels: Record<string, string> = {
    pending: "ממתין",
    pending_payment: "ממתין לתשלום",
    confirmed: "אושר",
    processing: "בטיפול",
    shipped: "נשלח",
    delivered: "נמסר",
    cancelled: "בוטל",
  };

  const handleUpdate = async (orderId: string) => {
    try {
      await updateStatus({ id: orderId, status: newStatus }).unwrap();
      setEditingOrder(null);
    } catch {
      /* */
    }
  };

  if (isLoading)
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-right px-4 py-3 font-medium">מס' הזמנה</th>
            <th className="text-right px-4 py-3 font-medium">תאריך</th>
            <th className="text-right px-4 py-3 font-medium">סכום</th>
            <th className="text-right px-4 py-3 font-medium">סטטוס</th>
            <th className="text-right px-4 py-3 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: Order) => (
            <tr
              key={o._id}
              className="border-b last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(o.createdAt).toLocaleDateString("he-IL")}
              </td>
              <td className="px-4 py-3">₪{o.totalAmount.toLocaleString()}</td>
              <td className="px-4 py-3">
                {editingOrder === o._id ? (
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-medium">
                    {statusLabels[o.status] ?? o.status}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingOrder === o._id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(o._id)}
                      disabled={updatingStatus}
                      className="text-green-600 hover:underline text-xs"
                    >
                      שמור
                    </button>
                    <button
                      onClick={() => setEditingOrder(null)}
                      className="text-gray-500 hover:underline text-xs"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingOrder(o._id);
                      setNewStatus(o.status);
                    }}
                    className="text-primary-600 hover:underline text-xs"
                  >
                    שנה סטטוס
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==== Users ====
function UsersTab() {
  const { data, isLoading } = useGetAdminUsersQuery();
  const [updateRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation();
  // Server returns users directly in data (no wrapper)
  const users = Array.isArray(data?.data)
    ? data.data
    : (data?.data?.users ?? []);

  if (isLoading)
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-right px-4 py-3 font-medium">שם</th>
            <th className="text-right px-4 py-3 font-medium">אימייל</th>
            <th className="text-right px-4 py-3 font-medium">תפקיד</th>
            <th className="text-right px-4 py-3 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: User) => (
            <tr
              key={u._id}
              className="border-b last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-gray-500" dir="ltr">
                {u.email}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {u.role === "admin" ? "מנהל" : "משתמש"}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() =>
                    updateRole({
                      id: u._id,
                      role: u.role === "admin" ? "user" : "admin",
                    })
                  }
                  disabled={updatingRole}
                  className="text-primary-600 hover:underline text-xs disabled:opacity-50"
                >
                  {u.role === "admin" ? "הורד למשתמש" : "הפוך למנהל"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
