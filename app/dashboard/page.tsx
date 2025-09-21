"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    ecosystems: 0,
    platforms: 0,
    users: 0,
    activeLinks: 0,
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((session) => {
        if (session.user) {
          setUser(session.user);
          fetchStats();
        } else {
          router.push("/");
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ecosystems');
      const data = await res.json();
      const ecosystemCount = data.list?.length || 0;
      
      setStats({
        ecosystems: ecosystemCount,
        platforms: 0, // Will be calculated from actual data
        users: 0,
        activeLinks: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>Welcome back, {user?.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #0066cc'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#0066cc', marginBottom: '0.5rem' }}>{stats.ecosystems}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Ecosystems</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#28a745', marginBottom: '0.5rem' }}>{stats.platforms}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Social Platforms</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#ffc107', marginBottom: '0.5rem' }}>{stats.users}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Active Users</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #dc3545'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#dc3545', marginBottom: '0.5rem' }}>{stats.activeLinks}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Active Links</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Recent Activity
          </div>
          <div style={{ padding: '2rem' }}>
            <p style={{ textAlign: 'center', color: '#999' }}>
              No recent activity. Start by creating an ecosystem.
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Quick Actions
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user?.role === 'admin' && (
              <Link href="/ecosystems/new" style={{
                display: 'block',
                padding: '0.75rem',
                backgroundColor: '#0066cc',
                color: 'white',
                textAlign: 'center',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Create New Ecosystem
              </Link>
            )}
            <Link href="/ecosystems" style={{
              display: 'block',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              color: '#333',
              textAlign: 'center',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              border: '1px solid #dee2e6'
            }}>
              Manage Ecosystems
            </Link>
            {user?.role === 'admin' && (
              <Link href="/users" style={{
                display: 'block',
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                color: '#333',
                textAlign: 'center',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                border: '1px solid #dee2e6'
              }}>
                Manage Users
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}