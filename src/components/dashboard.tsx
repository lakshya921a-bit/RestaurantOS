"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Armchair,
  ShoppingBag,
  ChefHat,
  Utensils,
  BarChart3,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Check,
  Clock,
  Printer,
  X,
  CreditCard,
  Trash2,
  Users,
  Eye,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  DollarSign,
  ReceiptText,
  Calendar,
  QrCode,
  Building,
  Edit,
  Save,
  Globe,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  TrendingUp
} from "lucide-react";

type User = {
  id?: string;
  name?: string;
  email: string;
  role: string;
  branchId?: string;
  restaurantName?: string;
  branchName?: string;
};

type Table = {
  id: string;
  name: string;
  capacity: number;
  zone: string;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILL_REQUESTED" | "CLEANING" | "OUT_OF_SERVICE";
  orders?: {
    id: string;
    orderNumber: number;
    totalPaise: number;
    status: string;
    items: { productName: string; quantity: number }[];
  }[];
};

type OrderItem = {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  notes?: string | null;
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  totalPaise: number;
  subtotalPaise: number;
  taxPaise: number;
  type: string;
  table?: { name: string; zone?: string } | null;
  items: OrderItem[];
  payments?: { amountPaise: number; method: string; status: string }[];
  notes?: string | null;
  createdAt: string;
  branch?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    restaurant: { name: string; gstin?: string | null; address?: string | null; currency: string };
  };
};

type Product = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  pricePaise: number;
  isAvailable: boolean;
  isVeg: boolean;
  imageUrl?: string | null;
  category?: { id: string; name: string };
};

type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  products: Product[];
};

type Reservation = {
  id: string;
  guestName: string;
  phone?: string | null;
  partySize: number;
  startsAt: string;
  status: string;
  notes?: string | null;
  table?: { name: string; zone: string } | null;
};

type RestaurantDetails = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  currency: string;
  openingHours: string;
  description: string;
};

const navItems = [
  { id: "Overview", label: "Overview", icon: LayoutDashboard },
  { id: "Tables", label: "Dining Floor", icon: Armchair },
  { id: "POS", label: "Touch POS", icon: ShoppingBag },
  { id: "Kitchen", label: "Kitchen KDS", icon: ChefHat },
  { id: "Menu", label: "Menu & Dishes", icon: Utensils },
  { id: "Bookings", label: "Table Bookings & QR", icon: Calendar },
  { id: "Settings", label: "Restaurant Details", icon: Building },
  { id: "Reports", label: "Analytics & GST", icon: BarChart3 }
] as const;

export const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(paise / 100);

export default function Dashboard({ user }: { user: User }) {
  const [currentPage, setCurrentPage] = useState<string>("Overview");
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Restaurant Settings State
  const [restaurantData, setRestaurantData] = useState<RestaurantDetails>({
    name: "Spice Symphony & Grand Bistro",
    tagline: "Artisanal Indian & Continental Fine Dining",
    address: "Ground Floor, Cyber Hub, Galleria Avenue, Gurgaon, Haryana 122002",
    phone: "+91 98765 43210",
    gstin: "27AABCS1429B1Z0",
    currency: "INR",
    openingHours: "Mon-Sun: 12:00 PM – 11:30 PM",
    description: "Experience royal culinary traditions reimagined for the modern epicurean."
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // POS State
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [posCategory, setPosCategory] = useState<string>("ALL");
  const [posSearch, setPosSearch] = useState("");
  const [posVegOnly, setPosVegOnly] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("UPI");
  const [posSuccessMsg, setPosSuccessMsg] = useState("");

  // Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Add / Edit Dish Modal State
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishCat, setDishCat] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishDesc, setDishDesc] = useState("");
  const [dishVeg, setDishVeg] = useState(true);
  const [dishImage, setDishImage] = useState("/images/dishes/paneer-tikka.jpg");

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Data
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [tRes, oRes, mRes, rRes, resvRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/orders"),
        fetch("/api/menu"),
        fetch("/api/restaurant"),
        fetch("/api/reservations")
      ]);

      if (!tRes.ok || !oRes.ok) throw new Error("Could not sync live restaurant data");

      const tData = await tRes.json();
      const oData = await oRes.json();
      setTables(tData.tables || []);
      setOrders(oData.orders || []);

      if (mRes.ok) {
        const mData = await mRes.json();
        setCategories(mData.categories || []);
        setProducts(mData.products || []);
        if (mData.categories?.[0] && !dishCat) {
          setDishCat(mData.categories[0].id);
        }
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.restaurant) setRestaurantData(rData.restaurant);
      }

      if (resvRes.ok) {
        const resvData = await resvRes.json();
        setReservations(resvData.reservations || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network sync failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const poll = setInterval(loadData, 10000);
    return () => clearInterval(poll);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // Update order status in KDS
  async function updateOrderStatus(orderId: string, nextStatus: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Order status change rejected");
        return;
      }
      loadData();
    } catch {
      alert("Failed to reach server");
    }
  }

  // Table status toggle
  async function updateTableStatus(tableId: string, status: Table["status"]) {
    try {
      const res = await fetch(`/api/tables`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tableId, status })
      });
      if (res.ok) loadData();
    } catch {
      alert("Failed to update table status");
    }
  }

  // Reservation status update
  async function updateReservationStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/reservations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) loadData();
    } catch {
      alert("Failed to update reservation status");
    }
  }

  // Toggle dish in-stock
  async function toggleProductAvailability(product: Product) {
    try {
      const res = await fetch(`/api/menu`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isAvailable: !product.isAvailable })
      });
      if (res.ok) loadData();
    } catch {
      alert("Failed to update availability");
    }
  }

  // Delete product
  async function handleDeleteDish(productId: string) {
    if (!confirm("Are you sure you want to remove this dish from the menu?")) return;
    try {
      const res = await fetch(`/api/menu?id=${productId}`, { method: "DELETE" });
      if (res.ok) loadData();
      else alert("Could not delete dish.");
    } catch {
      alert("Failed to delete dish.");
    }
  }

  // Open Edit Dish Modal
  function openEditDish(prod: Product) {
    setEditingDishId(prod.id);
    setDishName(prod.name);
    setDishCat(prod.categoryId);
    setDishPrice(String(prod.pricePaise / 100));
    setDishDesc(prod.description || "");
    setDishVeg(prod.isVeg);
    setDishImage(prod.imageUrl || "/images/dishes/paneer-tikka.jpg");
    setShowDishModal(true);
  }

  // Open Add Dish Modal
  function openAddDish() {
    setEditingDishId(null);
    setDishName("");
    if (categories[0]) setDishCat(categories[0].id);
    setDishPrice("");
    setDishDesc("");
    setDishVeg(true);
    setDishImage("/images/dishes/paneer-tikka.jpg");
    setShowDishModal(true);
  }

  // Save Dish (Add or Edit)
  async function handleSaveDish(e: React.FormEvent) {
    e.preventDefault();
    if (!dishName || !dishPrice || !dishCat) {
      alert("Please fill all required dish details.");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: dishName,
        categoryId: dishCat,
        pricePaise: Math.round(parseFloat(dishPrice) * 100),
        description: dishDesc,
        isVeg: dishVeg,
        imageUrl: dishImage || "/images/dishes/paneer-tikka.jpg"
      };

      if (editingDishId) {
        payload.id = editingDishId;
      }

      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowDishModal(false);
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save dish.");
      }
    } catch {
      alert("Failed to reach server.");
    }
  }

  // Save Restaurant Settings
  async function handleSaveRestaurantSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess("");
    try {
      const res = await fetch("/api/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: restaurantData.name,
          address: restaurantData.address,
          phone: restaurantData.phone,
          gstin: restaurantData.gstin,
          currency: restaurantData.currency
        })
      });

      if (res.ok) {
        setSettingsSuccess("Restaurant details updated and published across all systems!");
        setTimeout(() => setSettingsSuccess(""), 4000);
        loadData();
      } else {
        alert("Failed to update restaurant profile.");
      }
    } catch {
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  // Cart operations
  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }

  function updateCartQuantity(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number; notes: string }[]
    );
  }

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.pricePaise * item.quantity, 0),
    [cart]
  );
  const cartGST = useMemo(() => Math.round(cartSubtotal * 0.05), [cartSubtotal]);
  const cartTotal = cartSubtotal + cartGST;

  // Submit POS Order
  async function handleCreatePOSOrder() {
    if (cart.length === 0) {
      alert("Please add items to cart before submitting.");
      return;
    }

    const activeBranchId =
      user.branchId || (products[0] ? (products[0] as unknown as { branchId: string }).branchId : "");

    const payload = {
      branchId: activeBranchId || "branch-1",
      tableId: selectedTableId || null,
      type: selectedTableId ? "DINE_IN" : "TAKEAWAY",
      notes: orderNotes,
      idempotencyKey: `pos-order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes
      }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Order creation failed.");
        return;
      }

      if (data.order?.id) {
        await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.order.id,
            amountPaise: data.order.totalPaise,
            method: paymentMethod,
            idempotencyKey: `pay-${data.order.id}-${Date.now()}`
          })
        }).catch(() => null);
      }

      setCart([]);
      setSelectedTableId("");
      setOrderNotes("");
      setPosSuccessMsg(`Order #${data.order.orderNumber} successfully fired to Kitchen!`);
      setTimeout(() => setPosSuccessMsg(""), 5000);
      loadData();
    } catch {
      alert("Failed to submit POS order.");
    }
  }

  // KPI Calculations
  const activeOrders = orders.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "COMPLETED");
  const totalRevenuePaise = completedOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const occupiedTables = tables.filter(t => t.status === "OCCUPIED" || t.status === "BILL_REQUESTED");
  const tableOccupancyRate = tables.length ? Math.round((occupiedTables.length / tables.length) * 100) : 0;

  // POS filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = posCategory === "ALL" || p.categoryId === posCategory;
      const matchSearch =
        posSearch === "" ||
        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(posSearch.toLowerCase());
      const matchVeg = !posVegOnly || p.isVeg;
      return matchCat && matchSearch && matchVeg;
    });
  }, [products, posCategory, posSearch, posVegOnly]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] flex flex-col md:grid md:grid-cols-[250px_1fr]">
      {/* SIDEBAR NAVIGATION */}
      <aside className="bg-[#10141d] border-r border-[#1e2633] p-4 flex flex-col justify-between md:min-h-screen md:sticky md:top-0 md:h-screen z-20">
        <div>
          {/* Brand Monogram */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#10141d] rounded-[10px] flex items-center justify-center text-amber-400">
                <ChefHat size={22} />
              </div>
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white flex items-center">
                restaurant<span className="text-amber-400">OS</span>
              </div>
              <div className="text-[9px] tracking-wider text-amber-400 font-extrabold uppercase">
                Admin Control Panel
              </div>
            </div>
          </div>

          {/* Quick link to Customer Portal */}
          <div className="mb-4 px-1">
            <Link
              href="/"
              target="_blank"
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 rounded-xl p-2.5 text-xs font-bold flex items-center justify-between transition group"
            >
              <span className="flex items-center gap-2">
                <Globe size={14} className="text-amber-400" />
                <span>Open Customer Portal</span>
              </span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="text-[10px] tracking-widest text-slate-500 font-bold px-3 mb-2 uppercase">
            Workspaces
          </div>

          {/* Navigation Items */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-3 text-left whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white hover:bg-[#181f2c]"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-slate-950" : "text-slate-400"} />
                  <span>{item.label}</span>
                  {item.id === "Kitchen" && activeOrders.length > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-black/30 text-black" : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {activeOrders.length}
                    </span>
                  )}
                  {item.id === "Bookings" && reservations.length > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-black/30 text-black" : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {reservations.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="pt-4 border-t border-[#1e2633] mt-auto">
          <div className="bg-[#141a24] rounded-2xl p-3 border border-[#212b3a] mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 text-slate-950 font-black text-xs flex items-center justify-center">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{user.name || user.email}</div>
                <div className="text-[10px] font-semibold text-amber-400 tracking-wide uppercase">
                  {user.role}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {restaurantData.name.split("&")[0]}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 py-2.5 rounded-xl transition"
          >
            <LogOut size={15} /> Sign Out Workspace
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="p-4 md:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
        {/* Top Header Bar */}
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b border-[#1c2330]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles size={13} /> ADMIN DESK • {restaurantData.name}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
              {currentPage}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="bg-[#141822] hover:bg-[#1d2332] text-amber-300 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Globe size={14} />
              <span>Customer Portal</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 bg-[#121620] border border-[#212a38] px-3.5 py-2 rounded-xl text-xs text-slate-300">
              <Clock size={14} className="text-amber-400" />
              <span className="font-mono font-semibold">{currentTime}</span>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="bg-[#141822] hover:bg-[#1b212f] text-slate-300 border border-[#232c3c] rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl p-4 mb-6 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {posSuccessMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl p-4 mb-6 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {posSuccessMsg}
          </div>
        )}

        {/* ===================== TAB: OVERVIEW ===================== */}
        {currentPage === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121622] border border-[#202836] rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Gross Sales</span>
                  <DollarSign size={15} className="text-emerald-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mt-2">
                  {formatINR(totalRevenuePaise)}
                </div>
                <div className="text-[11px] text-emerald-400 mt-2 font-semibold">
                  {completedOrders.length} Completed Orders
                </div>
              </div>

              <div className="bg-[#121622] border border-[#202836] rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Live Kitchen Queue</span>
                  <Flame size={15} className="text-amber-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mt-2">
                  {activeOrders.length}
                </div>
                <div className="text-[11px] text-amber-400 mt-2 font-semibold">
                  Orders in Preparation
                </div>
              </div>

              <div className="bg-[#121622] border border-[#202836] rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Table Occupancy</span>
                  <Armchair size={15} className="text-blue-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mt-2">
                  {tableOccupancyRate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {occupiedTables.length} of {tables.length} tables seated
                </div>
              </div>

              <div className="bg-[#121622] border border-[#202836] rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Upcoming Bookings</span>
                  <Calendar size={15} className="text-purple-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mt-2">
                  {reservations.length}
                </div>
                <div className="text-[11px] text-purple-400 mt-2 font-semibold">
                  Active Table Bookings
                </div>
              </div>
            </div>

            {/* Split: Tables & Recent Orders */}
            <div className="grid xl:grid-cols-2 gap-6">
              <section className="bg-[#121622] border border-[#202836] rounded-3xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-base text-white">Live Floor Status</h3>
                  <button
                    onClick={() => setCurrentPage("Tables")}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    View All Floor
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tables.slice(0, 9).map(t => (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border ${
                        t.status === "OCCUPIED"
                          ? "bg-amber-500/10 border-amber-500/30 text-white"
                          : t.status === "BILL_REQUESTED"
                          ? "bg-blue-500/10 border-blue-500/30 text-white"
                          : "bg-[#161c28] border-[#222c3c] text-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-black text-sm text-white">{t.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{t.capacity} Seats • {t.zone}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#121622] border border-[#202836] rounded-3xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-base text-white">Recent Orders</h3>
                  <button
                    onClick={() => setCurrentPage("POS")}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Open Touch POS
                  </button>
                </div>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(o => (
                    <div
                      key={o.id}
                      className="bg-[#161c28] border border-[#222c3c] rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">#{o.orderNumber}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {o.table?.name || o.type}
                          </span>
                          <span className="text-[9px] font-bold text-amber-400">{o.status}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">
                          {o.items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-white">{formatINR(o.totalPaise)}</div>
                        <button
                          onClick={() => setReceiptOrder(o)}
                          className="text-[11px] text-amber-400 hover:underline"
                        >
                          Print Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ===================== TAB: DINING FLOOR & TABLES ===================== */}
        {currentPage === "Tables" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(t => (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between ${
                    t.status === "OCCUPIED"
                      ? "bg-[#181d28] border-amber-500/40"
                      : t.status === "BILL_REQUESTED"
                      ? "bg-[#161c28] border-blue-500/40"
                      : "bg-[#131722] border-[#222c3c]"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-2xl font-black text-white">{t.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{t.capacity} Seats • {t.zone}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-400">
                        {t.status}
                      </span>
                    </div>

                    {t.orders?.[0] && (
                      <div className="mt-3 p-2.5 bg-black/40 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-amber-300">
                          <span>Order #{t.orders[0].orderNumber}</span>
                          <span>{formatINR(t.orders[0].totalPaise)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {t.orders[0].items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
                    {t.status === "AVAILABLE" ? (
                      <button
                        onClick={() => {
                          setSelectedTableId(t.id);
                          setCurrentPage("POS");
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition"
                      >
                        Start Order
                      </button>
                    ) : (
                      <button
                        onClick={() => updateTableStatus(t.id, "AVAILABLE")}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition"
                      >
                        Mark Available / Clean
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: TOUCH POS ===================== */}
        {currentPage === "POS" && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
            <div className="space-y-4">
              <div className="bg-[#121622] border border-[#202836] rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search dish or ingredients..."
                      value={posSearch}
                      onChange={e => setPosSearch(e.target.value)}
                      className="w-full bg-[#181f2c] border border-[#263244] rounded-xl pl-10 pr-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setPosVegOnly(!posVegOnly)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      posVegOnly ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : "bg-[#181f2c] text-slate-400 border-[#263244]"
                    }`}
                  >
                    Veg Only
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setPosCategory("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      posCategory === "ALL" ? "bg-amber-500 text-slate-950" : "bg-[#181f2c] text-slate-300"
                    }`}
                  >
                    All Dishes
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setPosCategory(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        posCategory === c.id ? "bg-amber-500 text-slate-950" : "bg-[#181f2c] text-slate-300"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(p => {
                  const inCart = cart.find(i => i.product.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className="bg-[#121622] border border-[#202836] rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative h-36 w-full bg-[#181e2b]">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Utensils size={32} />
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-black text-amber-300">
                          {formatINR(p.pricePaise)}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-sm text-white">{p.name}</div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-black">{formatINR(p.pricePaise)}</span>
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-amber-500 text-slate-950 rounded-xl px-2 py-1 font-bold text-xs">
                              <button onClick={() => updateCartQuantity(p.id, -1)}>-</button>
                              <span>{inCart.quantity}</span>
                              <button onClick={() => updateCartQuantity(p.id, 1)}>+</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(p)}
                              className="bg-[#1c2331] hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl border border-white/10 transition"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="bg-[#121622] border border-[#202836] rounded-3xl p-5 sticky top-8 space-y-4">
              <h3 className="font-black text-base text-white">POS Terminal Checkout</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Assign to Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-2.5 text-xs outline-none"
                >
                  <option value="">Counter / Takeaway</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.name} ({t.capacity} seats • {t.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">Cart is empty.</div>
                ) : (
                  cart.map(i => (
                    <div
                      key={i.product.id}
                      className="bg-[#181f2c] p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{i.product.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {i.quantity} × {formatINR(i.product.pricePaise)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{formatINR(i.product.pricePaise * i.quantity)}</span>
                        <button onClick={() => removeFromCart(i.product.id)} className="text-rose-400 ml-1">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatINR(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>5% GST (CGST + SGST)</span>
                  <span>{formatINR(cartGST)}</span>
                </div>
                <div className="flex justify-between font-black text-white text-sm pt-2 border-t border-white/10">
                  <span>Total Due</span>
                  <span className="text-amber-400">{formatINR(cartTotal)}</span>
                </div>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleCreatePOSOrder}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl py-3 text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-40"
              >
                Fire Order to Kitchen
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB: KITCHEN DISPLAY SYSTEM (KDS) ===================== */}
        {currentPage === "Kitchen" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#121622] border border-[#202836] rounded-2xl p-4">
              <div>
                <h2 className="font-bold text-lg text-white">Live Kitchen Display (KDS)</h2>
                <p className="text-xs text-slate-400">Active kitchen prep stream and station routing</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                {activeOrders.length} Tickets Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeOrders.map(o => (
                <div
                  key={o.id}
                  className="bg-[#131722] border border-[#222c3c] rounded-3xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start pb-3 border-b border-white/10">
                      <div>
                        <div className="text-xl font-black text-white">#{o.orderNumber}</div>
                        <div className="text-xs font-bold text-amber-400">
                          {o.table ? `Table ${o.table.name}` : o.type}
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-500 text-slate-950">
                        {o.status}
                      </span>
                    </div>

                    <div className="py-4 space-y-2 text-xs">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between font-bold text-white">
                          <span>{i.quantity}× {i.productName}</span>
                        </div>
                      ))}
                    </div>

                    {o.notes && (
                      <div className="bg-amber-500/10 text-amber-300 text-[11px] p-2 rounded-xl mb-3">
                        <span className="font-bold uppercase text-[9px]">Note:</span> {o.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    {o.status === "PENDING" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "ACCEPTED")}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition"
                      >
                        Accept Ticket
                      </button>
                    )}
                    {o.status === "ACCEPTED" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "PREPARING")}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition"
                      >
                        Start Cooking
                      </button>
                    )}
                    {o.status === "PREPARING" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "READY")}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition"
                      >
                        Mark Ready
                      </button>
                    )}
                    {o.status === "READY" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "SERVED")}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition"
                      >
                        Mark Served
                      </button>
                    )}
                    {o.status === "SERVED" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "COMPLETED")}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs py-2 rounded-xl transition"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: MENU & DISHES (ADD / EDIT / DELETE DISHES) ===================== */}
        {currentPage === "Menu" && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-[#121622] border border-[#202836] rounded-2xl p-4">
              <div>
                <h2 className="font-bold text-lg text-white">Menu & Dish Management</h2>
                <p className="text-xs text-slate-400">
                  Add new recipes, edit pricing, upload images, and control 86-item availability
                </p>
              </div>
              <button
                onClick={openAddDish}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20"
              >
                <Plus size={16} /> Add New Dish
              </button>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map(p => (
                <div
                  key={p.id}
                  className="bg-[#121622] border border-[#202836] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-600 transition"
                >
                  <div className="relative h-44 w-full bg-[#161c28]">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Utensils size={36} />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-black text-amber-300">
                      {formatINR(p.pricePaise)}
                    </span>
                    <span className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      {p.isVeg ? "🟢 Pure Veg" : "🔴 Non-Veg"}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-amber-400 uppercase">
                        {p.category?.name || "Specialty"}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-0.5">{p.name}</h4>
                      {p.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1e2634] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold">
                          {p.isAvailable ? "In Stock" : "86 / Sold Out"}
                        </span>
                        <button
                          onClick={() => toggleProductAvailability(p)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                            p.isAvailable
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {p.isAvailable ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openEditDish(p)}
                          className="flex-1 bg-[#1a212e] hover:bg-[#252f42] text-slate-300 font-bold text-xs py-1.5 rounded-lg border border-white/10 flex items-center justify-center gap-1 transition"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDish(p.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-rose-500/20 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: TABLE BOOKINGS & QR STANDS ===================== */}
        {currentPage === "Bookings" && (
          <div className="space-y-6">
            {/* Table Bookings List */}
            <div className="bg-[#121622] border border-[#202836] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-base text-white">Guest Table Reservations</h3>
                  <p className="text-xs text-slate-400">
                    Live customer table bookings made online through the customer booking portal
                  </p>
                </div>
                <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full">
                  {reservations.length} Bookings
                </span>
              </div>

              {reservations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active reservations yet. Guest bookings from the customer portal will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#212b3a] text-slate-400 uppercase text-[10px]">
                        <th className="pb-3">Guest Name</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Guests</th>
                        <th className="pb-3">Date & Time</th>
                        <th className="pb-3">Assigned Table</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2634]">
                      {reservations.map(r => (
                        <tr key={r.id} className="hover:bg-white/5 transition">
                          <td className="py-3 font-bold text-white">{r.guestName}</td>
                          <td className="py-3 text-slate-300">{r.phone || "—"}</td>
                          <td className="py-3 text-slate-300 font-bold">{r.partySize} Guests</td>
                          <td className="py-3 text-slate-300">
                            {new Date(r.startsAt).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="py-3 text-amber-300 font-bold">
                            {r.table ? `Table ${r.table.name} (${r.table.zone})` : "Any Table"}
                          </td>
                          <td className="py-3">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                r.status === "SEATED"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : r.status === "ARRIVED"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : r.status === "CANCELLED"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              {r.status === "BOOKED" && (
                                <button
                                  onClick={() => updateReservationStatus(r.id, "ARRIVED")}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2 py-1 rounded"
                                >
                                  Arrived
                                </button>
                              )}
                              {r.status === "ARRIVED" && (
                                <button
                                  onClick={() => updateReservationStatus(r.id, "SEATED")}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded"
                                >
                                  Seat Guest
                                </button>
                              )}
                              {r.status !== "CANCELLED" && (
                                <button
                                  onClick={() => updateReservationStatus(r.id, "CANCELLED")}
                                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-[10px] px-2 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Table QR Standees Generator */}
            <div className="bg-[#121622] border border-[#202836] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-base text-white">Table QR Standee Cards</h3>
                  <p className="text-xs text-slate-400">
                    High-resolution QR code stands for tables. Guests scan with their phone camera to open the menu and order.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tables.map(t => {
                  const tableQrUrl = `http://localhost:3000/?table=${t.id}`;
                  return (
                    <div
                      key={t.id}
                      className="bg-white text-slate-900 rounded-3xl p-5 text-center shadow-2xl border-4 border-amber-500 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                          {restaurantData.name}
                        </div>
                        <div className="text-2xl font-black mt-1">Table {t.name}</div>
                        <div className="text-[11px] text-slate-600 font-bold">{t.capacity} Seats • {t.zone}</div>

                        {/* Scannable QR Code */}
                        <div className="w-36 h-36 bg-slate-50 p-2 rounded-2xl mx-auto my-3 border border-slate-200 shadow-sm flex items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tableQrUrl)}`}
                            alt={`QR for Table ${t.name}`}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="text-[11px] font-extrabold text-slate-800">
                          Scan to View Menu & Order
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Direct kitchen link • No app required
                        </div>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="mt-4 bg-slate-900 hover:bg-black text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Printer size={13} /> Print Table Stand
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: RESTAURANT DETAILS & SETTINGS ===================== */}
        {currentPage === "Settings" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#121622] border border-[#202836] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <h2 className="text-xl font-black text-white">Restaurant Profile & Details</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your brand identity, address, contact numbers, and GST credentials across customer menus and invoices.
                </p>
              </div>

              {settingsSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  {settingsSuccess}
                </div>
              )}

              <form onSubmit={handleSaveRestaurantSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Restaurant Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={restaurantData.name}
                      onChange={e => setRestaurantData({ ...restaurantData, name: e.target.value })}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Tagline / Culinary Slogan
                    </label>
                    <input
                      type="text"
                      value={restaurantData.tagline}
                      onChange={e => setRestaurantData({ ...restaurantData, tagline: e.target.value })}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Contact Phone *
                    </label>
                    <input
                      required
                      type="text"
                      value={restaurantData.phone}
                      onChange={e => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      GSTIN (Goods & Services Tax) *
                    </label>
                    <input
                      required
                      type="text"
                      value={restaurantData.gstin}
                      onChange={e => setRestaurantData({ ...restaurantData, gstin: e.target.value })}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Full Physical Address *
                  </label>
                  <input
                    required
                    type="text"
                    value={restaurantData.address}
                    onChange={e => setRestaurantData({ ...restaurantData, address: e.target.value })}
                    className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Dining Operating Hours
                    </label>
                    <input
                      type="text"
                      value={restaurantData.openingHours}
                      onChange={e => setRestaurantData({ ...restaurantData, openingHours: e.target.value })}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Default Currency
                    </label>
                    <input
                      type="text"
                      value={restaurantData.currency}
                      onChange={e => setRestaurantData({ ...restaurantData, currency: e.target.value })}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl py-3 px-6 text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>{savingSettings ? "Updating..." : "Save & Publish Restaurant Profile"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB: REPORTS & GST ===================== */}
        {currentPage === "Reports" && (
          <div className="space-y-6">
            <div className="bg-[#121622] border border-[#202836] rounded-2xl p-6">
              <h2 className="text-xl font-black text-white">GST Compliance & Revenue Analytics</h2>
              <p className="text-xs text-slate-400 mt-1">
                Audited transactional summary for GST filing (GSTR-1 & GSTR-3B)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-[#171d28] border border-[#242e3d] rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-semibold">Gross Sales (Completed)</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {formatINR(totalRevenuePaise)}
                  </div>
                </div>
                <div className="bg-[#171d28] border border-[#242e3d] rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-semibold">Collected GST (5%)</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {formatINR(Math.round(totalRevenuePaise * 0.0476))}
                  </div>
                </div>
                <div className="bg-[#171d28] border border-[#242e3d] rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-semibold">Average Order Value (AOV)</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {completedOrders.length
                      ? formatINR(Math.round(totalRevenuePaise / completedOrders.length))
                      : "₹0"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#121622] border border-[#202836] rounded-2xl p-6">
              <h3 className="font-bold text-base text-white mb-4">Completed Sales History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#212b3a] text-slate-400 uppercase text-[10px]">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Table/Type</th>
                      <th className="pb-3">Items Summary</th>
                      <th className="pb-3">Subtotal</th>
                      <th className="pb-3">GST (5%)</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2634]">
                    {completedOrders.map(o => (
                      <tr key={o.id} className="hover:bg-white/5 transition">
                        <td className="py-3 font-bold text-white">#{o.orderNumber}</td>
                        <td className="py-3 text-slate-300">{o.table?.name || o.type}</td>
                        <td className="py-3 text-slate-400 max-w-xs truncate">
                          {o.items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                        </td>
                        <td className="py-3 text-slate-300">{formatINR(o.subtotalPaise)}</td>
                        <td className="py-3 text-emerald-400">{formatINR(o.taxPaise)}</td>
                        <td className="py-3 font-black text-white">{formatINR(o.totalPaise)}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setReceiptOrder(o)}
                            className="bg-[#1c2331] hover:bg-amber-500 hover:text-slate-950 text-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-500/20 transition"
                          >
                            Print Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== ADD / EDIT DISH MODAL ===================== */}
      {showDishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131722] border border-[#232c3c] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDishModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              {editingDishId ? "Edit Dish Recipe" : "Add Dish to Menu"}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Configure culinary details for digital menu, touch POS and guest ordering
            </p>

            <form onSubmit={handleSaveDish} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Dish Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Kashmiri Rogan Josh"
                  value={dishName}
                  onChange={e => setDishName(e.target.value)}
                  className="w-full bg-[#181f2c] border border-[#263244] rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={dishCat}
                    onChange={e => setDishCat(e.target.value)}
                    className="w-full bg-[#181f2c] border border-[#263244] rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Price in ₹ (INR) *
                  </label>
                  <input
                    required
                    type="number"
                    step="1"
                    placeholder="350"
                    value={dishPrice}
                    onChange={e => setDishPrice(e.target.value)}
                    className="w-full bg-[#181f2c] border border-[#263244] rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Herbs, marinades, spices and cooking style..."
                  value={dishDesc}
                  onChange={e => setDishDesc(e.target.value)}
                  className="w-full bg-[#181f2c] border border-[#263244] rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Dish Photograph
                </label>
                <select
                  value={dishImage}
                  onChange={e => setDishImage(e.target.value)}
                  className="w-full bg-[#181f2c] border border-[#263244] rounded-xl p-2 text-xs text-white outline-none focus:border-amber-400 mb-2"
                >
                  <option value="/images/dishes/paneer-tikka.jpg">Paneer Tikka (Tandoor)</option>
                  <option value="/images/dishes/dal-makhani.jpg">Dal Makhani (Curry)</option>
                  <option value="/images/dishes/veg-biryani.jpg">Dum Veg Biryani (Rice)</option>
                  <option value="/images/dishes/butter-naan.jpg">Butter Garlic Naan (Breads)</option>
                  <option value="/images/dishes/chicken-tikka.jpg">Chicken Tikka Skewers (Non-Veg)</option>
                  <option value="/images/dishes/masala-dosa.jpg">Mysore Masala Dosa (South Indian)</option>
                  <option value="/images/dishes/truffle-pasta.jpg">Wild Truffle Pasta (Continental)</option>
                  <option value="/images/dishes/margherita-pizza.jpg">Margherita Pizza (Wood-Fired)</option>
                  <option value="/images/dishes/burger.jpg">Gourmet Burger (Quick Bites)</option>
                  <option value="/images/dishes/samosa-chaat.jpg">Delhi Samosa Chaat (Street Food)</option>
                  <option value="/images/dishes/mango-lassi.jpg">Alphonso Mango Lassi (Beverage)</option>
                  <option value="/images/dishes/cold-brew.jpg">Nitro Cold Brew Coffee (Beverage)</option>
                  <option value="/images/dishes/mojito.jpg">Fresh Mint Mojito (Mocktail)</option>
                  <option value="/images/dishes/gulab-jamun.jpg">Shahi Gulab Jamun (Dessert)</option>
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom URL: /images/dishes/..."
                  value={dishImage}
                  onChange={e => setDishImage(e.target.value)}
                  className="w-full bg-[#181f2c] border border-[#263244] rounded-xl p-2 text-[11px] text-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dishVegToggle"
                  checked={dishVeg}
                  onChange={e => setDishVeg(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <label htmlFor="dishVegToggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Pure Vegetarian Dish (Green Tag)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl py-3 text-xs shadow-lg shadow-amber-500/20 transition mt-2"
              >
                {editingDishId ? "Update Dish Changes" : "Save & Publish to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== RECEIPT PREVIEW MODAL ===================== */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setReceiptOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-black"
            >
              <X size={18} />
            </button>

            <div id="printable-receipt" className="font-mono text-center text-xs space-y-2">
              <div className="font-black text-base uppercase">{restaurantData.name}</div>
              <div className="text-[10px] text-slate-600">{restaurantData.address}</div>
              <div className="text-[10px] text-slate-600">GSTIN: {restaurantData.gstin}</div>
              <div className="border-b border-dashed border-slate-300 my-2" />

              <div className="flex justify-between text-[11px]">
                <span>Invoice: #{receiptOrder.orderNumber}</span>
                <span>{new Date(receiptOrder.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              <div className="text-left text-[11px]">
                Table: {receiptOrder.table?.name || receiptOrder.type}
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              <div className="space-y-1.5 text-left text-[11px]">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}× {item.productName}</span>
                    <span>{formatINR(item.lineTotalPaise)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              <div className="space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(receiptOrder.subtotalPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>{formatINR(Math.round(receiptOrder.taxPaise / 2))}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>{formatINR(Math.round(receiptOrder.taxPaise / 2))}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                  <span>Total Due</span>
                  <span>{formatINR(receiptOrder.totalPaise)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />
              <div className="text-[10px] text-slate-500 py-1">
                Thank you for dining with us! Please visit again.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer size={15} /> Print Slip
              </button>
              <button
                onClick={() => setReceiptOrder(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
