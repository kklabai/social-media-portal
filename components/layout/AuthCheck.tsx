"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => {
        if (res.status === 403) {
          alert("You are not authorized to access this system. Please contact administrator.");
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.authenticated) {
          setAuthorized(true);
        } else if (data) {
          router.push("/");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Auth check failed:", err);
        router.push("/");
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Checking authorization...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}