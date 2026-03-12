import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Home,
  FileText,
  Users,
  Menu,
  X,
  Clock,
  ClipboardList,
  Grid3x3,
  BarChart3,
  Receipt,
  Droplets,
  ChevronDown,
  Database,
  UserCog,
  DoorOpen,
} from "lucide-react";

interface MenuItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dataGroupOpen, setDataGroupOpen] = useState(false);
  const location = useLocation();

  const storedUser = (() => {
    try { const u = localStorage.getItem('currentUser'); return u ? JSON.parse(u) : null; } catch { return null; }
  })();
  const currentUser = {
    name: storedUser?.fullName || 'ผู้ใช้',
    role: storedUser?.role || 'STAFF',
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

  const topMenuItems: MenuItem[] = [
    { icon: BarChart3, label: "หน้าหลัก", path: "/" },
  ];

  const dataMenuItems: MenuItem[] = [
    { icon: Grid3x3, label: "จัดการประเภทห้องพัก", path: "/room-types" },
    { icon: Home, label: "จัดการห้องพัก", path: "/room-management" },
    { icon: Users, label: "จัดการลูกค้า", path: "/customers" },
    { icon: Droplets, label: "ค่าสาธารณูปโภค", path: "/utility-management" },
  ];

  const menuItems: MenuItem[] = [
    { icon: BarChart3, label: "หน้าหลัก", path: "/" },
    { icon: Clock, label: "จัดการเช่ารายวัน", path: "/daily-rental" },
    { icon: FileText, label: "จัดการสัญญา", path: "/contracts" },
    { icon: ClipboardList, label: "จัดการการใช้สาธารณูปโภค", path: "/utility-usage" },
    { icon: Receipt, label: "ออกบิล", path: "/billing" },
    { icon: DoorOpen, label: "จัดการการย้ายออก", path: "/move-out-settlements" },
    // { icon: UserCog, label: "จัดการผู้ใช้งาน", path: "/users" },
    ...dataMenuItems,
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {/* Top items */}
          {topMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                title={!sidebarOpen ? item.label : ""}
                className={`flex items-center transition-all duration-200 group rounded-xl ${
                  sidebarOpen || isMobile ? "px-4 py-3 gap-3" : "justify-center py-3"
                } ${
                  isActive ? "bg-white text-blue-900 shadow-lg" : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
                }`}
              >
                <Icon size={20} className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span className={`${!sidebarOpen && !isMobile ? "hidden" : "block"} font-medium whitespace-nowrap`}>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapsible: จัดการข้อมูล */}
          <div>
            <button
              onClick={() => (sidebarOpen || isMobile) && setDataGroupOpen((o) => !o)}
              title={!sidebarOpen ? "จัดการข้อมูล" : ""}
              className={`w-full flex items-center transition-all duration-200 rounded-xl ${
                sidebarOpen || isMobile ? "px-4 py-3 gap-3" : "justify-center py-3"
              } ${
                dataMenuItems.some((i) => i.path === location.pathname)
                  ? "bg-blue-700/60 text-white"
                  : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
              }`}
            >
              <Database size={20} className="w-5 h-5 shrink-0" />
              <span className={`${!sidebarOpen && !isMobile ? "hidden" : "flex-1 text-left"} font-medium whitespace-nowrap`}>
                จัดการข้อมูล
              </span>
              {(sidebarOpen || isMobile) && (
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${dataGroupOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {/* Dropdown items */}
            {(dataGroupOpen && (sidebarOpen || isMobile)) && (
              <div className="mt-1 ml-3 pl-3 border-l border-blue-700/50 space-y-1">
                {dataMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive ? "bg-white text-blue-900 shadow-lg" : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
                      }`}
                    >
                      <Icon size={16} className={`w-4 h-4 shrink-0 ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
                      <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remaining items */}
          {[{ icon: Clock, label: "จัดการเช่ารายวัน", path: "/daily-rental" },
            { icon: FileText, label: "จัดการสัญญา", path: "/contracts" },
            { icon: ClipboardList, label: "จัดการการใช้สาธารณูปโภค", path: "/utility-usage" },
            { icon: Receipt, label: "ออกบิล", path: "/billing" },
            { icon: DoorOpen, label: "จัดการการย้ายออก", path: "/move-out-settlements" },
            // { icon: UserCog, label: "จัดการผู้ใช้งาน", path: "/users" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                title={!sidebarOpen ? item.label : ""}
                className={`flex items-center transition-all duration-200 group rounded-xl ${
                  sidebarOpen || isMobile ? "px-4 py-3 gap-3" : "justify-center py-3"
                } ${
                  isActive ? "bg-white text-blue-900 shadow-lg" : "hover:bg-blue-700/50 text-blue-100 hover:text-white"
                }`}
              >
                <Icon size={20} className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span className={`${!sidebarOpen && !isMobile ? "hidden" : "block"} font-medium whitespace-nowrap`}>{item.label}</span>
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
           
                
              </div>


            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
