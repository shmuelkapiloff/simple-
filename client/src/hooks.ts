import { useDispatch, useSelector } from "react-redux";
import { useMemo, useCallback, useState } from "react";
import type { RootState, AppDispatch } from "./store";
import { useVerifyQuery, useGetCartQuery } from "./api";

// ---------- Typed hooks ----------
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// ---------- Auth hook ----------
export function useAuth() {
  const token = localStorage.getItem("token");
  const { data, isLoading } = useVerifyQuery(undefined, { skip: !token });
  // Server returns { data: { user: ... } } for verify endpoint
  const user = data?.data?.user ?? null;

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      isLoading,
    }),
    [user, isLoading],
  );
}

// ---------- Cart hook ----------
export function useCart() {
  const { user } = useAuth();
  const { data, isLoading } = useGetCartQuery(undefined, { skip: !user });
  // Server returns cart directly in data
  const cart = data?.data;

  return useMemo(() => {
    const items = cart?.items ?? [];
    return {
      items,
      total: cart?.total ?? 0,
      itemCount: items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
      isLoading,
      isEmpty: items.length === 0,
    };
  }, [cart, isLoading]);
}

// ---------- Auth Modal hook ----------
export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");

  const openLogin = useCallback((msg = "") => {
    setView("login");
    setMessage(msg);
    setIsOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setView("register");
    setMessage("");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMessage("");
  }, []);

  return { isOpen, view, message, openLogin, openRegister, close, setView };
}
