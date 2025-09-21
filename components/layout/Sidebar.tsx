"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Globe, 
  Users, 
  Shield, 
  Settings,
  Key,
  Mail,
  LogOut,
  ChevronDown,
  User
} from "lucide-react";
import { useState, useEffect } from "react";

interface MenuItem {
  href?: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch real user data
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const menuItems: MenuItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/ecosystems", label: "Ecosystems", icon: Globe },
    ...(user?.role === 'admin' ? [
      { href: "/users", label: "User Management", icon: Users },
      { href: "/emails", label: "Email Settings", icon: Mail },
    ] : [])
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
    window.location.href = "/";
  };

  return (
    <div className="sidebar">
      {/* Logo/Brand Section */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Social Media Portal</h2>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-3">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <User className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full sidebar-item ${
                      expandedItems.includes(item.label) ? "text-primary" : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${
                        expandedItems.includes(item.label) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedItems.includes(item.label) && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href!}
                            className={`sidebar-item pl-8 ${
                              isActive(child.href) ? "active" : ""
                            }`}
                          >
                            <child.icon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={`sidebar-item ${
                    isActive(item.href) ? "active" : ""
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full sidebar-item hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}