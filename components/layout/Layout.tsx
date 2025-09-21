"use client";

import SimpleSidebar from "./SimpleSidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <SimpleSidebar />
      <main style={{ 
        flex: 1,
        marginLeft: isCollapsed ? '60px' : '250px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease'
      }}>
        <div style={{ 
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}