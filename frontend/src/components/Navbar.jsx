import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ user: userProp }) => {
  const location = useLocation();
  const { user: ctxUser, logout } = useAuth();
  const user = userProp || ctxUser;

  const publicLinks = [
    { to: "/#how", label: "How it works" },
    { to: "/map", label: "Live map" },
    { to: "/impact", label: "Impact" },
    { to: "/#testimonials", label: "Testimonials" },
  ];

  const authLinks = [
    { to: "/map", label: "Live map" },
    { to: "/impact", label: "Impact" },
    { to: "/claim-pickup", label: "Claim & Pickup" },
    { to: "/#testimonials", label: "Testimonials" },
  ];

  const navLinks = user ? authLinks : publicLinks;
  const isActive = (path) => location.pathname === path;

  const dashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "donor") return "/donor/dashboard";
    return "/receiver/dashboard";
  };

  return (
    <nav className="bg-dark-bg border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-black tracking-tight">
              <span className="text-primary">Food</span>
              <span className="text-accent-orange">Surplus</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  isActive(link.to)
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to={dashboardLink()}
                  className="text-sm text-gray-400 border border-dark-border px-3 py-1.5 rounded-lg hover:bg-dark-hover transition-colors capitalize"
                >
                  {user.role}
                </Link>
                <Link
                  to={dashboardLink()}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold hover:bg-primary-dark transition-colors"
                >
                  {user.name?.slice(0, 2).toUpperCase()}
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-4 py-2">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
