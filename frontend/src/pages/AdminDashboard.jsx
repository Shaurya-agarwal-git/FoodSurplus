import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const stats = [
    {
      label: "Total meals saved",
      value: "12,480",
      change: "+18% vs last month",
      color: "text-primary",
    },
    {
      label: "Food redistributed",
      value: "3,240 kg",
      change: "+12% vs last month",
      color: "text-accent-orange",
    },
    {
      label: "CO₂ avoided",
      value: "8.1 t",
      change: "+15% vs last month",
      color: "text-primary",
    },
    {
      label: "Active donors",
      value: "340",
      change: "+24 new this month",
      color: "text-purple-400",
    },
  ];

  const recentListings = [
    { food: "Paneer biryani", donor: "Hotel", portions: 38, status: "Claimed" },
    {
      food: "Mixed curry",
      donor: "Restaurant",
      portions: 25,
      status: "Active",
    },
    {
      food: "Dal + rice",
      donor: "Household",
      portions: 15,
      status: "Completed",
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
        <div className="max-w-full px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            <span className="text-primary">Food</span><span className="text-accent-orange">Surplus</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 border border-dark-border px-3 py-1.5 rounded-lg">🏛️ Admin</span>
            <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <button onClick={() => { logout(); navigate('/') }} className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 border border-dark-border rounded-lg">
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-dark-card border-r border-dark-border min-h-screen p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Overview
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg bg-primary/20 text-primary font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Impact dashboard
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-dark-hover transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  All listings
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-dark-hover transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  Users & NGOs
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Moderation
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-dark-hover transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-red rounded-full"></div>
                  Flagged listings
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-dark-hover transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-orange rounded-full"></div>
                  Pending verifications
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Reports
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-dark-hover transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  Monthly report
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-gray-400 hover:bg-dark-hover transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  Export data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8">
            Impact dashboard — April 2026
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className={`text-4xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-gray-400 mb-1">{stat.label}</div>
                <div className="text-sm text-primary">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                Daily listings — last 7 days
              </h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, i) => (
                    <div
                      key={day}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full bg-primary/20 rounded-t"
                        style={{ height: `${Math.random() * 100 + 50}px` }}
                      ></div>
                      <span className="text-xs text-gray-500">{day}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                Claims by receiver type
              </h3>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2a2a2a"
                      strokeWidth="20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray="125 251"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="20"
                      strokeDasharray="75 251"
                      strokeDashoffset="-125"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="20"
                      strokeDasharray="50 251"
                      strokeDashoffset="-200"
                    />
                  </svg>
                </div>
                <div className="ml-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm">NGOs — 50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-light rounded-full"></div>
                    <span className="text-sm">Individuals — 30%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                    <span className="text-sm">Food banks — 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Listings Table */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent listings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Food item
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Donor
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Portions
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((listing, index) => (
                    <tr
                      key={index}
                      className="border-b border-dark-border hover:bg-dark-hover transition-colors"
                    >
                      <td className="py-3 px-4">{listing.food}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {listing.donor}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {listing.portions}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            listing.status === "Claimed"
                              ? "bg-primary/20 text-primary"
                              : listing.status === "Active"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-600/20 text-gray-400"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
