"use client";

import { useEffect, useState } from "react";

export default function ForceLogoutPage() {
  const [status, setStatus] = useState("Logging out...");

  useEffect(() => {
    const forceLogout = async () => {
      try {
        // Clear all cookies client-side
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          // Also try with domain variations
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=localhost");
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.localhost");
        });
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        setStatus("Cleared local data. Calling server logout...");
        
        // Call our logout endpoint
        const response = await fetch("/api/auth/session", { 
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        
        if (response.ok) {
          setStatus("Logout successful! Clearing all auth data...");
          
          // Since Nandi doesn't have a logout endpoint, just clear everything and redirect
          setTimeout(() => {
            // Try to clear any auth.kailasa.ai cookies if possible
            document.cookie = "nandi_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.kailasa.ai";
            document.cookie = "nandi_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=auth.kailasa.ai";
            
            // Force redirect to home page
            window.location.href = "/";
          }, 1000);
        } else {
          setStatus("Logout failed. Redirecting to home anyway...");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      } catch (error) {
        console.error("Force logout error:", error);
        setStatus("Error during logout. Redirecting to home...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    };

    forceLogout();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>Force Logout</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>{status}</p>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTopColor: '#0066cc',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}