"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";

export default function SimpleSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/ecosystems", label: "Ecosystems", icon: "🌐" },
    ...(user?.role === 'admin' ? [
      { href: "/users", label: "Users", icon: "👥" },
      { href: "/import", label: "Import Data", icon: "📥" },
      { href: "/emails", label: "Email Settings", icon: "📧" },
    ] : [])
  ];

  const handleLogout = async () => {
    try {
      // Clear any client-side cookies/storage
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      const response = await fetch("/api/auth/session", { 
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      
      if (response.ok) {
        // Force a hard refresh to clear all client-side state
        window.location.href = "/";
      } else {
        console.error("Logout failed");
        // Still redirect even if logout fails
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      window.location.href = "/";
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: isCollapsed ? '60px' : '250px',
        height: '100vh',
        backgroundColor: '#1e293b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'width 0.3s ease'
      }}>
      <div style={{
        padding: isCollapsed ? '1rem 0.5rem' : '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!isCollapsed && <div style={{ fontSize: '18px', fontWeight: '600' }}>Social Media Portal</div>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      {user && !isCollapsed && (
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'white', fontWeight: '500' }}>{user.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{user.email}</div>
          <div style={{ 
            marginTop: '4px', 
            display: 'inline-block',
            padding: '2px 8px', 
            backgroundColor: user.role === 'admin' ? '#10B981' : '#3B82F6',
            color: 'white',
            fontSize: '11px',
            fontWeight: '600',
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}>
            {user.role || 'User'}
          </div>
        </div>
      )}
      
      {user && isCollapsed && (
        <div style={{ 
          padding: '0.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            backgroundColor: user.role === 'admin' ? '#10B981' : '#3B82F6',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? '0' : '0.75rem',
              padding: isCollapsed ? '0.75rem 0' : '0.75rem 1.5rem',
              color: pathname === item.href || pathname.startsWith(item.href + "/") ? 'white' : 'rgba(255,255,255,0.7)',
              backgroundColor: pathname === item.href || pathname.startsWith(item.href + "/") ? 'rgba(99,102,241,0.1)' : 'transparent',
              borderLeft: pathname === item.href || pathname.startsWith(item.href + "/") ? '3px solid #6366f1' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              position: 'relative'
            }}
            title={isCollapsed ? item.label : ''}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {!isCollapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div style={{ padding: isCollapsed ? '0.5rem' : '1rem' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? '0' : '0.75rem',
            padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
            width: '100%',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span style={{ fontSize: '18px' }}>🚪</span>
          {!isCollapsed && 'Logout'}
        </button>
      </div>
    </div>
    </>
  );
}