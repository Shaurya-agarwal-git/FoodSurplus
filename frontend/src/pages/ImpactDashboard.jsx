import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { analyticsAPI, listingsAPI } from "../services/api";
import { useSocket } from "../context/SocketContext";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const barHeights = [55, 80, 65, 90, 70, 45, 60];

const statusColor = {
  Claimed: "bg-primary/20 text-primary",
  Active: "bg-blue-500/20 text-blue-400",
  Completed: "bg-gray-600/20 text-gray-400",
  Expired: "bg-red-500/20 text-red-400",
};

const sidebarItems = [
  {
    section: "OVERVIEW",
    items: [
      { label: "Impact dashboard", dot: "bg-primary" },
      { label: "All listings", dot: "bg-gray-600" },
      { label: "Users & NGOs", dot: "bg-gray-600" },
    ],
  },
  {
    section: "MODERATION",
    items: [
      { label: "Flagged listings", dot: "bg-red-500" },
      { label: "Pending verifications", dot: "bg-yellow-500" },
    ],
  },
  {
    section: "REPORTS",
    items: [
      { label: "Monthly report", dot: "bg-gray-600" },
      { label: "Export data", dot: "bg-gray-600" },
    ],
  },
];

const fallbackListings = [
  {
    title: "Paneer biryani",
    donor: { name: "Hotel" },
    quantity: "38 portions",
    status: "claimed",
  },
  {
    title: "Mixed curry",
    donor: { name: "Restaurant" },
    quantity: "25 portions",
    status: "active",
  },
  {
    title: "Dal + rice",
    donor: { name: "Household" },
    quantity: "15 portions",
    status: "completed",
  },
  {
    title: "Veg pulao",
    donor: { name: "Caterer" },
    quantity: "20 portions",
    status: "expired",
  },
];

export default function ImpactDashboard() {
  const { socket } = useSocket();
  const [activeItem, setActiveItem] = useState("Impact dashboard");
  const [stats, setStats] = useState({
    mealsSaved: 12480,
    foodDistributed: 3240,
    co2Avoided: 8.1,
    activeDonors: 340,
  });
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([analyticsAPI.getImpact(), listingsAPI.getAll({})])
      .then(([impactRes, listingsRes]) => {
        if (impactRes.status === "fulfilled" && impactRes.value?.data) {
          const d = impactRes.value.data;
          setStats({
            mealsSaved: d.mealsSaved || 12480,
            foodDistributed: d.foodDistributed || 3240,
            co2Avoided: d.co2Avoided || 8.1,
            activeDonors: d.activeDonors || 340,
          });
        }
        if (listingsRes.status === "fulfilled") {
          const data = listingsRes.value?.data || [];
          setRecentListings(
            data.length > 0 ? data.slice(0, 8) : fallbackListings
          );
        } else {
          setRecentListings(fallbackListings);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("impact-updated", (data) =>
      setStats((prev) => ({ ...prev, ...data }))
    );
    return () => socket.off("impact-updated");
  }, [socket]);

  const statCards = [
    {
      label: "Total meals saved",
      value: stats.mealsSaved.toLocaleString(),
      change: "+18% vs last month",
      color: "text-primary",
    },
    {
      label: "Food redistributed",
      value: stats.foodDistributed.toLocaleString(),
      unit: "kg",
      change: "+12% vs last month",
      color: "text-accent-orange",
    },
    {
      label: "CO₂ avoided",
      value: String(stats.co2Avoided),
      unit: "t",
      change: "+15% vs last month",
      color: "text-primary",
    },
    {
      label: "Active donors",
      value: String(stats.activeDonors),
      change: "+24 new this month",
      color: "text-purple-400",
    },
  ];

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-dark-card border-r border-dark-border min-h-[calc(100vh-4rem)] p-6 flex-shrink-0">
          {sidebarItems.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveItem(item.label)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm ${
                      activeItem === item.label
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-gray-400 hover:bg-dark-hover hover:text-gray-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`}
                    ></span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 overflow-auto">
          <h1 className="text-2xl font-bold mb-8">
            {activeItem === "Impact dashboard"
              ? `Impact dashboard — ${new Date().toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}`
              : activeItem}
          </h1>

          {activeItem === "Impact dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => (
                  <div key={i} className="card">
                    <div className={`text-4xl font-bold mb-1 ${s.color}`}>
                      {s.value}
                      {s.unit && (
                        <span className="text-2xl ml-1">{s.unit}</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm mb-2">{s.label}</div>
                    <div className="text-primary text-xs">{s.change}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar Chart */}
                <div className="card">
                  <h3 className="font-semibold mb-6">
                    Daily listings — last 7 days
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {days.map((day, i) => (
                      <div
                        key={day}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div
                          className="w-full bg-primary/30 hover:bg-primary/50 rounded-t transition-colors cursor-pointer"
                          style={{ height: `${barHeights[i]}%` }}
                        />
                        <span className="text-xs text-gray-500">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="card">
                  <h3 className="font-semibold mb-6">
                    Claims by receiver type
                  </h3>
                  <div className="flex items-center justify-center gap-8">
                    <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#2a2a2a"
                        strokeWidth="18"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="18"
                        strokeDasharray="119.4 238.8"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="18"
                        strokeDasharray="71.6 238.8"
                        strokeDashoffset="-119.4"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#4b5563"
                        strokeWidth="18"
                        strokeDasharray="47.8 238.8"
                        strokeDashoffset="-191"
                      />
                    </svg>
                    <div className="space-y-3">
                      {[
                        { color: "bg-primary", label: "NGOs", pct: "50%" },
                        {
                          color: "bg-primary-light",
                          label: "Individuals",
                          pct: "30%",
                        },
                        {
                          color: "bg-gray-600",
                          label: "Food banks",
                          pct: "20%",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span
                            className={`w-3 h-3 rounded-full ${item.color}`}
                          ></span>
                          <span className="text-gray-300">
                            {item.label} — {item.pct}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Listings Table */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent listings</h3>
                  <span className="text-sm text-gray-400">
                    {recentListings.length} shown
                  </span>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-dark-hover rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            Food item
                          </th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            Donor
                          </th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            Portions
                          </th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentListings.map((row, i) => {
                          const statusKey = capitalize(row.status);
                          return (
                            <tr
                              key={i}
                              className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
                            >
                              <td className="py-3 px-4 font-medium">
                                {row.title}
                              </td>
                              <td className="py-3 px-4 text-gray-400">
                                {row.donor?.name || row.donor || "Donor"}
                              </td>
                              <td className="py-3 px-4 text-gray-400">
                                {row.quantity}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    statusColor[statusKey] ||
                                    "bg-gray-600/20 text-gray-400"
                                  }`}
                                >
                                  {statusKey}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeItem === "All listings" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">All listings</h2>
                <span className="text-sm text-gray-400">{recentListings.length} total</span>
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Food item</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Donor</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Quantity</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentListings.map((row, i) => {
                      const statusKey = capitalize(row.status);
                      return (
                        <tr key={i} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                          <td className="py-3 px-4 font-medium">{row.title}</td>
                          <td className="py-3 px-4 text-gray-400">{row.donor?.name || 'Donor'}</td>
                          <td className="py-3 px-4 text-gray-400">{row.quantity}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[statusKey] || 'bg-gray-600/20 text-gray-400'}`}>
                              {statusKey}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">
                            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeItem === "Users & NGOs" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Users & NGOs</h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total donors', value: stats.activeDonors, color: 'text-primary' },
                  { label: 'Total receivers', value: Math.round(stats.activeDonors * 1.4), color: 'text-accent-orange' },
                  { label: 'Verified NGOs', value: 12, color: 'text-purple-400' }
                ].map((s, i) => (
                  <div key={i} className="card text-center">
                    <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                    <div className="text-gray-400 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <p className="text-gray-400 text-sm text-center py-8">User management requires backend connection.</p>
              </div>
            </div>
          )}

          {activeItem === "Flagged listings" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Flagged listings</h2>
              <div className="card text-center py-16">
                <div className="text-4xl mb-3">🚩</div>
                <p className="text-gray-400">No flagged listings at this time.</p>
              </div>
            </div>
          )}

          {activeItem === "Pending verifications" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Pending NGO verifications</h2>
              <div className="card text-center py-16">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-400">No pending verifications.</p>
                <p className="text-gray-500 text-sm mt-2">NGO applications will appear here for review.</p>
              </div>
            </div>
          )}

          {activeItem === "Monthly report" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Monthly report — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Listings created', value: stats.activeDonors * 3, color: 'text-primary' },
                  { label: 'Listings claimed', value: Math.round(stats.activeDonors * 2.1), color: 'text-accent-orange' },
                  { label: 'Meals saved', value: stats.mealsSaved, color: 'text-blue-400' },
                  { label: 'CO₂ avoided (kg)', value: Math.round(stats.co2Avoided * 1000), color: 'text-purple-400' }
                ].map((s, i) => (
                  <div key={i} className="card">
                    <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeItem === "Export data" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Export data</h2>
              <div className="card space-y-4">
                {[
                  { label: 'Export all listings (CSV)', icon: '📋' },
                  { label: 'Export user data (CSV)', icon: '👥' },
                  { label: 'Export impact report (PDF)', icon: '📊' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      const data = JSON.stringify(recentListings, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'food-surplus-export.json'; a.click();
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-dark-hover rounded-xl hover:bg-dark-border transition-colors text-left"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="ml-auto text-gray-500 text-xs">↓ Download</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
