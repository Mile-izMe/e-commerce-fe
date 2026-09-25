"use client";

import { AuthModal, useLogout } from "@/src/features/auth";
import type { AuthMode } from "@/src/features/auth/components/AuthModal";
import { useAuthStore } from "@/store";
import {
  Briefcase,
  Clock,
  Computer,
  LayoutGrid,
  Mars,
  TrendingUp,
  User,
  Venus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AccountMenu from "./AccountMenu";

export default function NavBar() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [isAuthOpen, setAuthOpen] = useState(false);
  const { mutate: logout, isPending: isSigningOut } = useLogout();
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(en|vi)/, "") || "/";

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  const navLinks = [
    { icon: TrendingUp, name: "new", path: "/new" },
    { icon: Mars, name: "Man", path: "/man" },
    { icon: Venus, name: "Women", path: "/woman" },
    { icon: Briefcase, name: "accessories", path: "/accessory" },
    { icon: Computer, name: "technical", path: "/technical" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold tracking-tighter text-neutral-950"
            aria-label="Atelier Home"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />
            ATELIER
          </Link>

          {/* Minimalist Center Nav: Store / Booking History / Profile */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = normalizedPath === link.path;
              const Icon = link.icon;

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-neutral-950 text-white font-semibold shadow-2xs"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80"
                  }`}
                >
                  <Icon
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="capitalize leading-none">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {status === "restoring" ? (
              <div
                role="status"
                aria-label="Đang khôi phục phiên đăng nhập"
                className="h-9 w-24 animate-pulse rounded-full bg-neutral-100"
              />
            ) : status === "restoreFailed" ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 sm:text-sm"
              >
                Thử kết nối lại
              </button>
            ) : user ? (
              <AccountMenu
                user={user}
                onSignOut={() => logout()}
                isSigningOut={isSigningOut}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className="rounded-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 sm:text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-neutral-950 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800 sm:text-sm"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
}
