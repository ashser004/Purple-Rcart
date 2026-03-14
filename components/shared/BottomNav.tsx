"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/sell", label: "Sell", icon: PlusCircle, isSell: true },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        if (item.isSell) {
          return (
            <Link key={item.href} href={item.href} className="nav-item nav-item-sell">
              <Icon size={22} />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
