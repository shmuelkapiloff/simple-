import { useState, useEffect } from "react";
import type { Address, AddressRequest } from "../types";

interface Props {
  address?: Address; // If provided, edit mode
  onSubmit: (data: AddressRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AddressForm({
  address,
  onSubmit,
  onCancel,
  isLoading,
}: Props) {
  // פרטי איש קשר - חובה!
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // פרטי כתובת
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Israel");

  useEffect(() => {
    if (address) {
      setFullName(address.fullName);
      setPhone(address.phone);
      setStreet(address.street);
      setCity(address.city);
      setPostalCode(address.postalCode);
      setCountry(address.country);
    }
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ fullName, phone, street, city, postalCode, country });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* פרטי מקבל החבילה */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">
          👤 פרטי מקבל החבילה
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="ישראל ישראלי"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טלפון
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              dir="ltr"
              pattern="^(\+972|0)([23489]|5[0-9])[0-9]{7}$"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="0501234567"
            />
            <p className="text-xs text-gray-500 mt-1">
              טלפון נייד ישראלי (למשל 0501234567)
            </p>
          </div>
        </div>
      </div>

      {/* פרטי כתובת */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          רחוב
        </label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="שם הרחוב ומספר"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            עיר
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="עיר"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מיקוד
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            dir="ltr"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="0000000"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          מדינה
        </label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
        >
          {isLoading ? "שומר..." : address ? "עדכן" : "שמור כתובת"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
