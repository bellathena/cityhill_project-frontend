import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Home,
  Gauge,
  CreditCard,
  LogOut as LogOutIcon,
  FileText,
  Users,
  Menu,
  X,
} from "lucide-react";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mock data
  const currentUser = {
    name: "ไฟท์",
    role: "Admin",
  };

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    navigate("/login");
  };

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "แผงควบคุม" },
    { path: "/rooms", icon: Home, label: "จัดการห้องพัก" },
    { path: "/meter", icon: Gauge, label: "จดมิเตอร์/ออกบิล" },
    { path: "/payments", icon: CreditCard, label: "บันทึกการชำระเงิน" },
    { path: "/moveout", icon: LogOutIcon, label: "สรุปย้ายออก" },
    { path: "/reports", icon: FileText, label: "รายงาน" },
    { path: "/users", icon: Users, label: "จัดการผู้ใช้" },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${
            isMobile
              ? sidebarOpen
                ? "translate-x-0 w-64"
                : "-translate-x-full w-0"
              : sidebarOpen
                ? "w-64"
                : "w-20"
          } 
          fixed md:relative z-30 bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl h-full overflow-hidden
        `}
      >
        {/* Header - No toggle button here anymore */}
        <div
          className={`p-6 border-b border-blue-700/50 flex items-center ${!sidebarOpen && !isMobile ? "justify-center px-2" : "justify-start"}`}
        >
          <div
            className={`${!sidebarOpen && !isMobile ? "hidden" : "block"} transition-all duration-300`}
          >
            <h1 className="text-xl font-bold whitespace-nowrap">City Hill</h1>
            <p className="text-blue-200 text-sm mt-1 whitespace-nowrap">
              Management
            </p>
          </div>
          {/* Logo placeholder for collapsed state */}
          {!sidebarOpen && !isMobile && (
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-blue-200">
              CH
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                title={!sidebarOpen ? item.label : ""}
                className={`flex items-center transition-all duration-200 group rounded-xl ${
                  sidebarOpen || isMobile
                    ? "px-4 py-3 gap-3"
                    : "justify-center py-3"
                } ${
                  isActive
                    ? "bg-white text-blue-900 shadow-lg"
                    : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span
                  className={`${
                    !sidebarOpen && !isMobile ? "hidden" : "block"
                  } font-medium whitespace-nowrap transition-opacity duration-300`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Info */}
        <div
          className={`
      p-4 border-t border-blue-700/50 text-blue-300 text-xs
      flex items-center
      ${!sidebarOpen && !isMobile ? "justify-center" : "justify-between"}
  `}
        >
          {(sidebarOpen || isMobile) && (
            <span className="whitespace-nowrap transition-opacity duration-300">
              © {new Date().getFullYear()} Thanaporn Jindarat
            </span>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {/* Switch between Menu and X icon based on state */}
                {sidebarOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>

              {/* Page Title */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {menuItems.find((item) => item.path === location.pathname)
                    ?.label || "แผงควบคุม"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* User Avatar & Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-gray-800 text-sm">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentUser.role === "Admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <LogOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
