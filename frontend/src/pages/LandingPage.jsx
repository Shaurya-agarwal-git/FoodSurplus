import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { analyticsAPI } from "../services/api";

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) {
        setVal(target);
        clearInterval(t);
      } else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [target, duration]);
  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Food category chips ───────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: 'Curry & Rice',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  },
  {
    label: 'Bread & Roti',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
  },
  {
    label: 'Salads',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  },
  {
    label: 'Tiffin',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  },
  {
    label: 'Sweets',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
  },
  {
    label: 'Dal & Sabzi',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  },
  {
    label: 'Noodles',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  },
  {
    label: 'Snacks',
    svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  },
]

// ── Mock live listings ────────────────────────────────────────────────────────
const MOCK_LISTINGS = [
  {
    id: 1,
    title: "Paneer Biryani",
    qty: "38 portions",
    donor: "Hotel Radiance",
    area: "Sector 18, Noida",
    tag: "veg",
    mins: 8,
    img: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&q=80",
  },
  {
    id: 2,
    title: "Dal Makhani + Rice",
    qty: "50 plates",
    donor: "Ananya Restaurant",
    area: "Indirapuram",
    tag: "veg",
    mins: 22,
    img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
  },
  {
    id: 3,
    title: "Chicken Curry",
    qty: "25 portions",
    donor: "Sharma Caterers",
    area: "Rajnagar",
    tag: "non-veg",
    mins: 35,
    img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80",
  },
  {
    id: 4,
    title: "Mixed Sabzi + Roti",
    qty: "60 plates",
    donor: "Gupta Household",
    area: "Vaishali",
    tag: "veg",
    mins: 12,
    img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "NGO Coordinator",
    text: "Food Surplus helped us feed 200 families last month. The real-time notifications are a game changer.",
    avatar: "PS",
  },
  {
    name: "Rahul Mehta",
    role: "Restaurant Owner",
    text: "We used to throw away 30kg of food daily. Now it reaches people who need it within minutes.",
    avatar: "RM",
  },
  {
    name: "Anita Verma",
    role: "Receiver",
    text: "As a single mother, this platform has been a blessing. Fresh food, no cost, delivered with dignity.",
    avatar: "AV",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    mealsSaved: 12480,
    foodDistributed: 3240,
    co2Avoided: 8.1,
    activeDonors: 340,
  });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    analyticsAPI
      .getImpact()
      .then((r) => {
        if (r?.data) setStats((s) => ({ ...s, ...r.data }));
      })
      .catch(() => {});
    const t = setInterval(() => setTicker((p) => p + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const dashLink = user
    ? user.role === "admin"
      ? "/admin/dashboard"
      : user.role === "donor"
      ? "/donor/dashboard"
      : "/receiver/dashboard"
    : null;

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/map");
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-100 overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tight">
            <span className="text-[#10b981]">Food</span>
            <span className="text-[#f59e0b]">Surplus</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#impact" className="hover:text-white transition-colors">
              Impact
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Join as
            </a>
            <a
              href="#testimonials"
              className="hover:text-white transition-colors"
            >
              Testimonials
            </a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={dashLink}
                className="bg-[#10b981] text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-[#059669] transition-colors"
              >
                My Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-[#10b981] text-white text-sm px-5 py-2 rounded-full font-semibold hover:bg-[#059669] transition-colors"
                >
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center px-6">
        {/* Food image background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=90"
            alt="Food background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/80 via-[#0d0d0d]/60 to-[#0d0d0d]" />
        </div>

        {/* Gradient blobs on top of video */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
         
          

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-none tracking-tight drop-shadow-2xl">
            Feed someone.<br />
            <span className="text-[#10b981]">Waste nothing.</span><br />
            <span className="text-[#f59e0b]">Change everything.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Surplus food from restaurants, homes and caterers — claimed by NGOs, shelters and families in need. Real time. Free. Across India.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/60 p-1.5 gap-2">
              <div className="flex items-center gap-2 px-4 py-2.5 border-r border-gray-200 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[#10b981]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-gray-500 text-sm font-medium whitespace-nowrap">
                  Your location
                </span>
              </div>
              <input
                type="text"
                placeholder="Search for food, area, or donor..."
                className="flex-1 px-3 py-2.5 text-gray-800 text-sm outline-none bg-transparent placeholder-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#162d25] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#059669] transition-colors flex-shrink-0"
              >
                Find Food
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link
                to={dashLink}
                className="bg-[#10b981] text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-[#059669] transition-colors"
              >
                Go to my dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register?role=donor" className="bg-white text-gray-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post surplus food
                </Link>
                <Link to="/register?role=receiver" className="bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/15 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Find food near me
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ticker bar ── */}
      <section className="bg-[#10b981] py-4 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { val: stats.mealsSaved, suffix: "+", label: "Meals saved" },
            {
              val: stats.foodDistributed,
              suffix: " kg",
              label: "Food redistributed",
            },
            {
              val: Math.round(stats.co2Avoided * 1000),
              suffix: " kg",
              label: "CO₂ avoided",
            },
            { val: stats.activeDonors, suffix: "+", label: "Active donors" },
          ].map((s, i) => (
            <div key={i} className="text-white">
              <div className="text-2xl font-black">
                <Counter target={s.val} suffix={s.suffix} />
              </div>
              <div className="text-green-100 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Food categories ── */}
      <section className="py-14 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[#10b981] text-xs font-bold tracking-widest uppercase mb-1">
                Explore
              </p>
              <h2 className="text-2xl font-black text-white">
                Browse food by type
              </h2>
            </div>
            <Link
              to="/map"
              className="text-sm text-[#10b981] font-semibold hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                onClick={() => { setActiveCategory(c.label); navigate("/map"); }}
                className={`flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl border transition-all hover:scale-105 ${
                  activeCategory === c.label
                    ? "bg-[#10b981]/20 border-[#10b981] text-[#10b981]"
                    : "bg-[#1a1a1a] border-white/8 text-gray-400 hover:bg-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {c.svg}
                </svg>
                <span className="text-xs font-semibold text-center leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how"
        className="py-20 px-6 bg-[#111] border-y border-white/5"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">How Food Surplus works</h2>
            <p className="text-gray-400">
              From kitchen to community in minutes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#10b981]/50 to-[#10b981]/50" />
            {[
              {
                n: "01",
                title: "Post in 2 minutes",
                desc: "Upload a photo. Our AI auto-detects food type, quantity and dietary tags. Set pickup location and expiry.",
                icon: (
                  <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              {
                n: "02",
                title: "Instant notifications",
                desc: "Nearby receivers get real-time alerts via the live map. Color-coded pins show veg, non-veg and urgent listings.",
                icon: (
                  <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                )
              },
              {
                n: "03",
                title: "Coordinate pickup",
                desc: "Chat in real-time, get turn-by-turn directions, and complete the handoff before food expires.",
                icon: (
                  <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                )
              },
            ].map((s) => (
              <div key={s.n} className="text-center relative">
                <div className="w-20 h-20 bg-[#10b981]/10 border border-[#10b981]/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  {s.icon}
                </div>
                <div className="text-[#10b981] text-xs font-black tracking-widest mb-2">{s.n}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join as ── */}
      <section id="roles" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">Join as</h2>
            <p className="text-gray-400">
              Pick your role and start making an impact today
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                iconSvg: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                ),
                role: "Donor", color: "#10b981", bg: "bg-[#10b981]/10", border: "border-[#10b981]/20",
                desc: "Restaurants, hotels, households with surplus food",
                features: ["AI photo analysis", "Set pickup radius", "Real-time claim alerts", "Track meals donated", "CO₂ impact stats"],
                cta: "Register as Donor", link: "/register?role=donor", ctaStyle: "bg-[#10b981] text-white hover:bg-[#059669]",
              },
              {
                iconSvg: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                role: "Receiver", color: "#f59e0b", bg: "bg-[#f59e0b]/10", border: "border-[#f59e0b]/20",
                desc: "Individuals, families, shelters needing food",
                features: ["Live map with food pins", "Filter veg / non-veg", "One-click claim", "Turn-by-turn directions", "Real-time donor chat"],
                cta: "Register as Receiver", link: "/register?role=receiver", ctaStyle: "bg-[#f59e0b] text-white hover:bg-[#d97706]",
              },
              {
                iconSvg: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                role: "NGO", color: "#a78bfa", bg: "bg-purple-500/10", border: "border-purple-500/20",
                desc: "Verified organizations with priority access",
                features: ["Priority notifications", "Bulk claim access", "Impact dashboard", "Export reports", "Admin moderation tools"],
                cta: "Register as NGO", link: "/register?role=ngo", ctaStyle: "bg-purple-500 text-white hover:bg-purple-600",
              },
            ].map((r) => (
              <div key={r.role} className={`${r.bg} border ${r.border} rounded-3xl p-7 flex flex-col hover:scale-[1.02] transition-transform`}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${r.color}20`, color: r.color }}>
                  {r.iconSvg}
                </div>
                <h3 className="text-xl font-black mb-1" style={{ color: r.color }}>{r.role}</h3>
                <p className="text-gray-400 text-sm mb-5">{r.desc}</p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: r.color }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={r.link} className={`${r.ctaStyle} text-center py-3 rounded-xl font-bold text-sm transition-colors`}>{r.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact section ── */}
      <section
        id="impact"
        className="py-20 px-6 bg-[#111] border-y border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#10b981] text-xs font-black tracking-widest uppercase mb-3">
                Real impact
              </p>
              <h2 className="text-4xl font-black mb-5 leading-tight">
                Every meal saved is a<br />
                <span className="text-[#10b981]">life touched.</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                Food waste is one of India's biggest challenges. Food Surplus
                connects the dots — turning restaurant leftovers into community
                meals, reducing CO₂, and building a more equitable food system.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    val: stats.mealsSaved,
                    suffix: "+",
                    label: "Meals saved",
                    color: "text-[#10b981]",
                  },
                  {
                    val: stats.activeDonors,
                    suffix: "+",
                    label: "Active donors",
                    color: "text-[#f59e0b]",
                  },
                  {
                    val: Math.round(stats.co2Avoided * 1000),
                    suffix: " kg",
                    label: "CO₂ avoided",
                    color: "text-blue-400",
                  },
                  {
                    val: stats.foodDistributed,
                    suffix: " kg",
                    label: "Food redistributed",
                    color: "text-purple-400",
                  },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4">
                    <div className={`text-3xl font-black ${s.color}`}>
                      <Counter target={s.val} suffix={s.suffix} />
                    </div>
                    <div className="text-gray-400 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-white/5 border border-white/8 rounded-2xl p-5"
                >
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 flex items-center justify-center text-xs font-bold text-[#10b981]">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="testimonials"
        className="py-20 px-6 bg-[#111] border-y border-white/5"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#10b981] text-xs font-black tracking-widest uppercase mb-3">
              What people say
            </p>
            <h2 className="text-3xl font-black mb-3">
              Stories from our community
            </h2>
            <p className="text-gray-400">
              Real impact, real people, real change
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white/5 border border-white/8 rounded-2xl p-6 flex flex-col"
              >
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className="w-4 h-4 text-[#f59e0b]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5 flex-1">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 flex items-center justify-center text-xs font-bold text-[#10b981]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#10b981]/5 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Ready to bridge the gap?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join thousands of donors and receivers across India reducing food
            waste every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to={dashLink}
                className="bg-[#10b981] text-white px-10 py-4 rounded-full font-black text-base hover:bg-[#059669] transition-colors shadow-lg shadow-[#10b981]/25"
              >
                Go to my dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-[#10b981] text-white px-10 py-4 rounded-full font-black text-base hover:bg-[#059669] transition-colors shadow-lg shadow-[#10b981]/25"
                >
                  Get started — it's free
                </Link>
                <Link
                  to="/login"
                  className="bg-white/10 border border-white/20 text-white px-10 py-4 rounded-full font-bold text-base hover:bg-white/15 transition-colors"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-black">
            <span className="text-[#10b981]">Food</span>
            <span className="text-[#f59e0b]">Surplus</span>
          </div>
          <p className="text-gray-500 text-sm">
            Reducing food waste across India, one meal at a time.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            {!user && (
              <Link
                to="/register"
                className="hover:text-white transition-colors"
              >
                Register
              </Link>
            )}
            {!user && (
              <Link to="/login" className="hover:text-white transition-colors">
                Login
              </Link>
            )}
            <Link to="/map" className="hover:text-white transition-colors">
              Live Map
            </Link>
            <a
              href="#testimonials"
              className="hover:text-white transition-colors"
            >
              Testimonials
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
