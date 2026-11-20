"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChefHat,
  Utensils,
  Calendar,
  ShoppingBag,
  Info,
  Search,
  Users,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Star,
  QrCode,
  Flame,
  Plus,
  Minus,
  Trash2,
  X,
  Lock,
  ArrowRight
} from "lucide-react";

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

type Table = {
  id: string;
  name: string;
  capacity: number;
  zone: string;
  status: string;
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
  branchName: string;
};

const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(paise / 100);

export default function CustomerPanel({ initialTable }: { initialTable?: string }) {
  const [activeTab, setActiveTab] = useState<"menu" | "book" | "order" | "about">("menu");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantDetails>({
    name: "Spice Symphony & Grand Bistro",
    tagline: "Artisanal Indian & Continental Fine Dining",
    address: "Ground Floor, Cyber Hub, Galleria Avenue, DLF Phase 2, Gurgaon, Haryana 122002",
    phone: "+91 98765 43210",
    gstin: "27AABCS1429B1Z0",
    currency: "INR",
    openingHours: "Mon – Sun: 12:00 PM – 11:30 PM",
    description: "Experience royal culinary traditions reimagined for the modern epicurean. From slow-simmered charcoal dals to artisanal wood-fired pizzas, Spice Symphony crafts each plate with local provenance and global technique.",
    branchName: "Flagship Cyber Hub"
  });

  // Filters
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  // Cart for Table Ordering
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTable || "");
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeGuestOrder, setActiveGuestOrder] = useState<{
    id: string;
    orderNumber: number;
    status: string;
    totalPaise: number;
    items: { productName: string; quantity: number }[];
  } | null>(null);

  // Table Booking Form State
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState("19:30");
  const [selectedZone, setSelectedZone] = useState("Terrace Garden");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<{
    reference: string;
    guestName: string;
    partySize: number;
    date: string;
    time: string;
    zone: string;
  } | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Fetch initial data
  async function loadData() {
    try {
      const [mRes, tRes, rRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/tables"),
        fetch("/api/restaurant")
      ]);

      if (mRes.ok) {
        const m = await mRes.json();
        setCategories(m.categories || []);
        setProducts(m.products || []);
      }
      if (tRes.ok) {
        const t = await tRes.json();
        setTables(t.tables || []);
        if (!selectedTableId && t.tables?.length > 0) {
          setSelectedTableId(t.tables[0].id);
        }
      }
      if (rRes.ok) {
        const r = await rRes.json();
        if (r.restaurant) setRestaurant(r.restaurant);
      }
    } catch {
      // Keep defaults
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Poll for active order status if we have an active order or selected table
  useEffect(() => {
    if (!selectedTableId) return;
    async function checkOrderStatus() {
      try {
        const res = await fetch(`/api/guest-order?tableId=${selectedTableId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setActiveGuestOrder(data.order);
          } else {
            setActiveGuestOrder(null);
          }
        }
      } catch {
        // silent
      }
    }
    checkOrderStatus();
    const timer = setInterval(checkOrderStatus, 6000);
    return () => clearInterval(timer);
  }, [selectedTableId]);

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

  function updateQuantity(productId: string, delta: number) {
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

  // Submit Order from Table
  async function handleGuestOrder() {
    if (!selectedTableId) {
      alert("Please select your Table number first.");
      return;
    }
    if (cart.length === 0) {
      alert("Please add at least one dish to your order.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await fetch("/api/guest-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTableId,
          notes: customerNotes,
          items: cart.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            notes: i.notes
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Order placement failed.");
        return;
      }

      setActiveGuestOrder(data.order);
      setCart([]);
      setCustomerNotes("");
      alert(`🎉 Order #${data.order.orderNumber} sent directly to the Kitchen! We are preparing your food.`);
      setActiveTab("order");
    } catch {
      alert("Failed to submit order. Please check network connection.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  // Handle Table Booking
  async function handleTableBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      alert("Please enter your name and phone number.");
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const startsAtISO = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
      const matchedTable = tables.find(t => t.zone.includes(selectedZone) && t.status === "AVAILABLE");

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          phone: guestPhone,
          partySize: Number(partySize),
          startsAt: startsAtISO,
          tableId: matchedTable?.id || null,
          notes: `Zone: ${selectedZone}. ${bookingNotes}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not reserve table.");
        return;
      }

      setBookingSuccess({
        reference: data.reservation.id.slice(-6).toUpperCase(),
        guestName,
        partySize,
        date: bookingDate,
        time: bookingTime,
        zone: selectedZone
      });
    } catch {
      alert("Booking failed. Please try again.");
    } finally {
      setIsBookingSubmitting(false);
    }
  }

  // Filtered dishes
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCat === "ALL" || p.categoryId === selectedCat;
      const matchSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVeg = !vegOnly || p.isVeg;
      return matchCat && matchSearch && matchVeg;
    });
  }, [products, selectedCat, searchQuery, vegOnly]);

  const selectedTableObj = tables.find(t => t.id === selectedTableId);

  return (
    <div className="min-h-screen bg-[#090b0e] text-[#f1f5f9] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0d1017]/90 backdrop-blur-md border-b border-[#1e2533]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo & Restaurant Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1017] rounded-[14px] flex items-center justify-center text-amber-400">
                <ChefHat size={22} />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                {restaurant.name}
              </div>
              <div className="text-[10px] tracking-widest text-amber-400 font-bold uppercase truncate max-w-[200px] sm:max-w-xs">
                {restaurant.tagline}
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-[#131722] p-1 rounded-2xl border border-[#232c3d]">
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "menu"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Utensils size={14} /> Digital Menu
            </button>
            <button
              onClick={() => setActiveTab("book")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "book"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar size={14} /> Book a Table
            </button>
            <button
              onClick={() => setActiveTab("order")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
                activeTab === "order"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingBag size={14} /> My Table Order
              {cart.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "about"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Info size={14} /> Restaurant Details
            </button>
          </nav>

          {/* Admin / Staff Access Link */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="bg-[#181f2c] hover:bg-[#222b3d] text-slate-300 hover:text-white border border-[#2b364a] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Lock size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Staff / Admin</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden border-t border-[#1e2533] bg-[#0b0e14] overflow-x-auto px-2 py-1.5">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 min-w-[90px] py-2 text-[11px] font-bold rounded-lg text-center flex flex-col items-center gap-1 ${
              activeTab === "menu" ? "text-amber-400 bg-amber-500/10" : "text-slate-400"
            }`}
          >
            <Utensils size={15} /> Menu
          </button>
          <button
            onClick={() => setActiveTab("book")}
            className={`flex-1 min-w-[90px] py-2 text-[11px] font-bold rounded-lg text-center flex flex-col items-center gap-1 ${
              activeTab === "book" ? "text-amber-400 bg-amber-500/10" : "text-slate-400"
            }`}
          >
            <Calendar size={15} /> Book Table
          </button>
          <button
            onClick={() => setActiveTab("order")}
            className={`flex-1 min-w-[90px] py-2 text-[11px] font-bold rounded-lg text-center flex flex-col items-center gap-1 relative ${
              activeTab === "order" ? "text-amber-400 bg-amber-500/10" : "text-slate-400"
            }`}
          >
            <ShoppingBag size={15} /> Order {cart.length > 0 && `(${cart.length})`}
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 min-w-[90px] py-2 text-[11px] font-bold rounded-lg text-center flex flex-col items-center gap-1 ${
              activeTab === "about" ? "text-amber-400 bg-amber-500/10" : "text-slate-400"
            }`}
          >
            <Info size={15} /> About
          </button>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative overflow-hidden border-b border-[#1c2331] bg-gradient-to-b from-[#111622] via-[#0d1017] to-[#090b0e] py-8 sm:py-12">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src="/images/restaurant-interior.jpg"
            alt="Interior Ambiance"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b0e] via-transparent to-[#090b0e]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 px-3.5 py-1 rounded-full text-xs font-semibold text-amber-300">
              <Sparkles size={13} /> {restaurant.branchName} • Michelin-Inspired Kitchen
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {restaurant.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {restaurant.description}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-400" /> {restaurant.address.split(",")[0]}, Cyber Hub
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-amber-400" /> {restaurant.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" /> Open: {restaurant.openingHours.split("–")[0]}
              </span>
            </div>
          </div>

          {/* Quick Table Ordering Pill */}
          <div className="bg-[#141924]/90 border border-[#232b3c] backdrop-blur-md rounded-3xl p-5 w-full md:w-80 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <QrCode size={15} /> Instant Table Ordering
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400">
                Seated at a table? Select your table number to browse, order, and send dishes directly to the chef.
              </p>

              <div className="mt-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Your Table Number:
                </label>
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="w-full bg-[#1b2230] border border-[#293548] text-white font-bold rounded-xl p-2.5 text-xs outline-none focus:border-amber-400"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.name} ({t.capacity} seats • {t.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <button
                onClick={() => setActiveTab("menu")}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 rounded-xl transition"
              >
                Order Food
              </button>
              <button
                onClick={() => setActiveTab("book")}
                className="flex-1 bg-[#202838] hover:bg-[#283246] text-white font-bold text-xs py-2 rounded-xl border border-white/10 transition"
              >
                Book Table
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ===================== TAB 1: DIGITAL MENU ===================== */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            {/* Filter controls */}
            <div className="bg-[#121622] border border-[#202836] rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search dishes (e.g. Biryani, Naan, Pasta)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#181f2c] border border-[#263244] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                      vegOnly
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-[#181f2c] text-slate-400 border-[#263244]"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Pure Vegetarian Only
                  </button>
                </div>
              </div>

              {/* Categories horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCat("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCat === "ALL"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "bg-[#181f2c] text-slate-300 hover:bg-[#20293a]"
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCat === c.id
                        ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                        : "bg-[#181f2c] text-slate-300 hover:bg-[#20293a]"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map(p => {
                const inCart = cart.find(i => i.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-[#121622] border border-[#202836] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition group shadow-xl"
                  >
                    {/* Dish Photo */}
                    <div className="relative h-44 w-full bg-[#181e2b] overflow-hidden">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Utensils size={36} />
                        </div>
                      )}
                      {/* Dietary Tag */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`inline-block p-1 rounded-md bg-black/60 backdrop-blur-md border ${
                            p.isVeg ? "border-emerald-500" : "border-rose-500"
                          }`}
                        >
                          <span
                            className={`block w-2.5 h-2.5 rounded-full ${
                              p.isVeg ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black text-amber-300">
                        {formatINR(p.pricePaise)}
                      </div>
                    </div>

                    {/* Dish Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {p.category?.name || "Specialty"}
                        </div>
                        <h4 className="font-bold text-sm text-white mt-0.5 group-hover:text-amber-400 transition">
                          {p.name}
                        </h4>
                        {p.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                      </div>

                      {/* Add Action */}
                      <div className="mt-4 pt-3 border-t border-[#1e2634] flex items-center justify-between">
                        <span className="text-xs font-black text-white">
                          {formatINR(p.pricePaise)}
                        </span>

                        {inCart ? (
                          <div className="flex items-center gap-2 bg-amber-500 text-slate-950 rounded-xl px-2 py-1 font-black text-xs">
                            <button
                              onClick={() => updateQuantity(p.id, -1)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded"
                            >
                              -
                            </button>
                            <span>{inCart.quantity}</span>
                            <button
                              onClick={() => updateQuantity(p.id, 1)}
                              className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(p)}
                            className="bg-[#1c2331] hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl border border-[#2b3648] hover:border-amber-400 transition flex items-center gap-1"
                          >
                            <Plus size={14} /> Add to Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: QR TABLE BOOKING & RESERVATION ===================== */}
        {activeTab === "book" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full uppercase tracking-wider">
                <Calendar size={13} /> Official Table Reservation Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Reserve Your Dining Table
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Secure your table in advance for birthdays, anniversaries, corporate dining, or weekend celebrations at {restaurant.name}.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="bg-[#121622] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Reservation Confirmed!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your digital table pass has been created. Show this QR code to the restaurant host upon arrival.
                  </p>
                </div>

                {/* Digital Booking Pass */}
                <div className="bg-[#181f2c] border border-[#273447] rounded-3xl p-6 max-w-sm mx-auto text-left space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div>
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                        {restaurant.name}
                      </div>
                      <div className="text-lg font-black text-white mt-0.5">
                        {bookingSuccess.guestName}
                      </div>
                    </div>
                    <span className="font-mono font-black text-amber-400 text-xs bg-amber-500/10 px-2 py-1 rounded-lg">
                      #{bookingSuccess.reference}
                    </span>
                  </div>

                  {/* QR Code representation */}
                  <div className="w-40 h-40 bg-white p-2 rounded-2xl mx-auto my-3 flex items-center justify-center shadow-lg">
                    {/* Public QR Code Server */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=RestaurantOS-Booking-${bookingSuccess.reference}-${bookingSuccess.guestName}`}
                      alt="Booking QR Pass"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Date & Time</div>
                      <div className="font-bold text-white">{bookingSuccess.date} • {bookingSuccess.time}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Party Size</div>
                      <div className="font-bold text-white">{bookingSuccess.partySize} Guests</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Seating Zone</div>
                      <div className="font-bold text-white">{bookingSuccess.zone}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Status</div>
                      <div className="font-bold text-emerald-400">Guaranteed Booked</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Print / Save Pass
                  </button>
                  <button
                    onClick={() => setBookingSuccess(null)}
                    className="bg-[#1c2331] hover:bg-[#252f42] text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl border border-white/10 transition"
                  >
                    Make Another Booking
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleTableBooking}
                className="bg-[#121622] border border-[#202836] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Guest Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ananya Sharma"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Party Size (Guests) *
                    </label>
                    <select
                      value={partySize}
                      onChange={e => setPartySize(Number(e.target.value))}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "Person" : "Persons"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Reservation Date *
                    </label>
                    <input
                      required
                      type="date"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-2.5 text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                      Dining Time Slot *
                    </label>
                    <select
                      value={bookingTime}
                      onChange={e => setBookingTime(e.target.value)}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                    >
                      <optgroup label="Lunch Service">
                        <option value="12:30">12:30 PM</option>
                        <option value="13:30">01:30 PM</option>
                        <option value="14:30">02:30 PM</option>
                      </optgroup>
                      <optgroup label="Dinner Service">
                        <option value="19:00">07:00 PM</option>
                        <option value="19:30">07:30 PM</option>
                        <option value="20:30">08:30 PM</option>
                        <option value="21:30">09:30 PM</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                    Preferred Dining Zone
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {["Main Dining", "Terrace Garden", "Private Lounge", "Bar Lounge"].map(zone => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setSelectedZone(zone)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                          selectedZone === zone
                            ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20"
                            : "bg-[#181f2c] text-slate-300 border-[#263244] hover:bg-[#20293a]"
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Special Requests / Dietary Preferences
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Table with city view, celebrating 5th anniversary, high chair needed..."
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBookingSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl py-3.5 text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  <span>{isBookingSubmitting ? "Confirming Table..." : "Confirm Table Reservation"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ===================== TAB 3: MY TABLE ORDER & LIVE TRACKER ===================== */}
        {activeTab === "order" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121622] border border-[#202836] rounded-2xl p-4">
              <div>
                <h2 className="font-bold text-lg text-white">Your Table Session</h2>
                <p className="text-xs text-slate-400">
                  {selectedTableObj ? `Connected to Table ${selectedTableObj.name} (${selectedTableObj.zone})` : "Select your table below to place or track your order"}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold uppercase">Change Table:</span>
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="bg-[#181f2c] border border-[#263244] text-white rounded-xl px-3 py-1.5 text-xs outline-none"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LIVE ORDER TRACKER (if order exists on this table) */}
            {activeGuestOrder && (
              <div className="bg-[#131722] border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <Flame size={12} /> Live Kitchen Tracking
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">
                      Order #{activeGuestOrder.orderNumber}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                      activeGuestOrder.status === "READY"
                        ? "bg-emerald-500 text-slate-950"
                        : activeGuestOrder.status === "PREPARING"
                        ? "bg-amber-500 text-slate-950 animate-pulse"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {activeGuestOrder.status}
                  </span>
                </div>

                {/* Progress Timeline */}
                <div className="py-6">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { label: "Received", step: "PENDING" },
                      { label: "Accepted", step: "ACCEPTED" },
                      { label: "Cooking", step: "PREPARING" },
                      { label: "Ready to Serve", step: "READY" }
                    ].map((s, idx) => {
                      const stages = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED"];
                      const currentIdx = stages.indexOf(activeGuestOrder.status);
                      const stepIdx = stages.indexOf(s.step);
                      const isDone = currentIdx >= stepIdx;
                      return (
                        <div key={s.label} className="space-y-2">
                          <div
                            className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                              isDone
                                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
                                : "bg-[#1f2736] text-slate-500"
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-bold block ${
                              isDone ? "text-amber-300" : "text-slate-500"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Items */}
                <div className="bg-[#181f2c] rounded-2xl p-4 border border-white/5 space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Ordered Dishes</div>
                  {activeGuestOrder.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-white">
                      <span>{i.quantity}× {i.productName}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-black text-sm text-amber-300">
                    <span>Total Amount</span>
                    <span>{formatINR(activeGuestOrder.totalPaise)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CART & CHECKOUT FORM */}
            <div className="bg-[#121622] border border-[#202836] rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#1e2634]">
                <div>
                  <h3 className="font-black text-base text-white">Add Dishes to Table Order</h3>
                  <p className="text-xs text-slate-400">Order from your phone directly to the kitchen</p>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-3">
                  <Utensils size={32} className="mx-auto text-slate-600" />
                  <div>No new items in your cart.</div>
                  <button
                    onClick={() => setActiveTab("menu")}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
                  >
                    Browse Digital Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="bg-[#171d29] border border-[#222a38] rounded-2xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="overflow-hidden flex-1">
                          <div className="font-bold text-xs text-white">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {formatINR(item.product.pricePaise)} each
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#10141d] border border-[#263040] rounded-xl">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-1 text-xs font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-black text-xs text-white min-w-[55px] text-right">
                            {formatINR(item.product.pricePaise * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Notes */}
                  <div>
                    <input
                      type="text"
                      placeholder="Special instructions for kitchen (e.g. less spicy, allergy notes)..."
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      className="w-full bg-[#181f2c] border border-[#263244] text-white rounded-xl p-3 text-xs placeholder-slate-500 outline-none"
                    />
                  </div>

                  {/* Calculation summary */}
                  <div className="pt-3 border-t border-[#1e2634] space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>{formatINR(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST (5% CGST + SGST)</span>
                      <span>{formatINR(cartGST)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#1e2634]">
                      <span>Estimated Total</span>
                      <span className="text-amber-400">{formatINR(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    disabled={isSubmittingOrder}
                    onClick={handleGuestOrder}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl py-3.5 text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={15} />
                    <span>{isSubmittingOrder ? "Firing Order to Kitchen..." : "Fire Order to Kitchen"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: RESTAURANT DETAILS & STORY ===================== */}
        {activeTab === "about" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#121622] border border-[#202836] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full uppercase tracking-wider mb-2">
                  <Star size={13} /> Verified Flagship Establishment
                </div>
                <h2 className="text-3xl font-black text-white">{restaurant.name}</h2>
                <p className="text-xs text-amber-300 font-semibold mt-0.5">{restaurant.tagline}</p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {restaurant.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="bg-[#181f2c] border border-[#263244] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-400" /> Physical Location
                  </div>
                  <div className="text-xs text-white font-medium leading-relaxed mt-1">
                    {restaurant.address}
                  </div>
                </div>

                <div className="bg-[#181f2c] border border-[#263244] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-400" /> Concierge & Table Enquiries
                  </div>
                  <div className="text-xs text-white font-bold mt-1">
                    {restaurant.phone}
                  </div>
                  <div className="text-[11px] text-slate-400">reservations@spicesymphony.com</div>
                </div>

                <div className="bg-[#181f2c] border border-[#263244] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-400" /> Operating Dining Hours
                  </div>
                  <div className="text-xs text-white font-medium mt-1">
                    {restaurant.openingHours}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">Kitchen Open 7 Days a Week</div>
                </div>

                <div className="bg-[#181f2c] border border-[#263244] rounded-2xl p-4 space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-purple-400" /> Legal & Tax Compliance
                  </div>
                  <div className="text-xs text-white font-mono mt-1">
                    GSTIN: {restaurant.gstin}
                  </div>
                  <div className="text-[11px] text-slate-400">FSSAI Lic. #10020051000192 • 5% GST Included</div>
                </div>
              </div>

              {/* Hospitality Highlights */}
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Dining Amenities & Services
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    "Complimentary Valet Parking",
                    "High-Speed Guest Wi-Fi",
                    "Private Dining Booths",
                    "Terrace Garden Seating",
                    "Contactless QR Ordering",
                    "Curated Craft Mocktails",
                    "Pure Veg Preparation Area",
                    "Wheelchair Accessible"
                  ].map((amenity, idx) => (
                    <div
                      key={idx}
                      className="bg-[#151b27] border border-[#202938] rounded-xl p-2.5 text-xs text-slate-300 font-medium flex items-center gap-2"
                    >
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span className="truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1e2533] bg-[#0b0e14] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-white text-sm">
              {restaurant.name}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {restaurant.address} • GSTIN: {restaurant.gstin}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-amber-400 hover:underline font-bold">
              Staff Portal Access
            </Link>
            <span>•</span>
            <span className="font-mono text-slate-600">RestaurantOS v1.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
