import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import MobileNav from "./MobileNav.jsx";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-surface-900 relative">
      {/* Decorative background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Sidebar (desktop only) */}
      <Sidebar />

      {/* Main content area */}
      <div className="lg:ml-[260px] flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto page-content">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
