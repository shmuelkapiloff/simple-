import { useState } from "react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from "../api";
import AddressForm from "../components/AddressForm";
import type { Address, AddressRequest } from "../types";

type Tab = "profile" | "addresses";

export default function Profile() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">החשבון שלי</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8">
        {(
          [
            ["profile", "פרופיל"],
            ["addresses", "כתובות"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              tab === key
                ? "bg-white shadow text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" ? <ProfileTab /> : <AddressesTab />}
    </div>
  );
}

// ---- Profile Tab ----
function ProfileTab() {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPw }] =
    useChangePasswordMutation();

  // Server returns { data: { user } }
  const user = data?.data?.user;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  // Password
  const [showPw, setShowPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const startEdit = () => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setEditing(true);
    setMsg("");
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name, phone }).unwrap();
      setMsg("הפרופיל עודכן בהצלחה");
      setEditing(false);
    } catch {
      setMsg("שגיאה בעדכון");
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    try {
      await changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
      }).unwrap();
      setPwMsg("הסיסמה שונתה בהצלחה");
      setCurrentPw("");
      setNewPw("");
      setShowPw(false);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setPwMsg(apiErr.data?.message || "שגיאה בשינוי סיסמה");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      {/* Info */}
      <div>
        <h2 className="font-bold text-lg mb-4">פרטים אישיים</h2>
        {!editing ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">שם</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">אימייל</p>
              <p className="font-medium" dir="ltr">
                {user?.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">טלפון</p>
              <p className="font-medium">{user?.phone || "לא הוגדר"}</p>
            </div>
            <button
              onClick={startEdit}
              className="text-primary-600 text-sm font-medium hover:underline"
            >
              ערוך פרטים
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={updating}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {updating ? "שומר..." : "שמור"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
        {msg && <p className="text-sm text-green-600 mt-2">{msg}</p>}
      </div>

      <hr />

      {/* Password */}
      <div>
        {!showPw ? (
          <button
            onClick={() => setShowPw(true)}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            שנה סיסמה
          </button>
        ) : (
          <form onSubmit={handleChangePw} className="space-y-3">
            <h3 className="font-bold">שינוי סיסמה</h3>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              dir="ltr"
              placeholder="סיסמה נוכחית"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              dir="ltr"
              minLength={6}
              placeholder="סיסמה חדשה"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={changingPw}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {changingPw ? "משנה..." : "שנה סיסמה"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPw(false);
                  setPwMsg("");
                }}
                className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
            {pwMsg && (
              <p
                className={`text-sm ${pwMsg.includes("שגיאה") ? "text-red-600" : "text-green-600"}`}
              >
                {pwMsg}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Addresses Tab ----
function AddressesTab() {
  const { data, isLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: updatingAddr }] =
    useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();

  // Server returns addresses array directly
  const addresses = Array.isArray(data?.data) ? data.data : [];
  const [showForm, setShowForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);

  const handleCreate = async (d: AddressRequest) => {
    try {
      await createAddress(d).unwrap();
      setShowForm(false);
    } catch {
      /* */
    }
  };

  const handleUpdate = async (d: AddressRequest) => {
    if (!editingAddr) return;
    try {
      await updateAddress({ id: editingAddr._id, data: d }).unwrap();
      setEditingAddr(null);
    } catch {
      /* */
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((addr) =>
        editingAddr?._id === addr._id ? (
          <div key={addr._id} className="bg-white rounded-xl border p-6">
            <h3 className="font-bold mb-3">עריכת כתובת</h3>
            <AddressForm
              address={addr}
              onSubmit={handleUpdate}
              onCancel={() => setEditingAddr(null)}
              isLoading={updatingAddr}
            />
          </div>
        ) : (
          <div
            key={addr._id}
            className="bg-white rounded-xl border p-6 flex items-start justify-between"
          >
            <div>
              <p className="font-medium">
                {addr.street}, {addr.city}
              </p>
              <p className="text-sm text-gray-500">
                {addr.postalCode}, {addr.country}
              </p>
              {addr.isDefault && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                  ברירת מחדל
                </span>
              )}
            </div>
            <div className="flex gap-2 text-sm">
              {!addr.isDefault && (
                <button
                  onClick={() => setDefault(addr._id)}
                  className="text-primary-600 hover:underline"
                >
                  קבע כברירת מחדל
                </button>
              )}
              <button
                onClick={() => setEditingAddr(addr)}
                className="text-gray-600 hover:underline"
              >
                ערוך
              </button>
              <button
                onClick={() => deleteAddress(addr._id)}
                className="text-red-500 hover:underline"
              >
                מחק
              </button>
            </div>
          </div>
        ),
      )}

      {showForm ? (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold mb-3">כתובת חדשה</h3>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={creating}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition"
        >
          + הוסף כתובת חדשה
        </button>
      )}
    </div>
  );
}
