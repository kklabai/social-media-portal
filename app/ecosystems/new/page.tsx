"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEcosystemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    active_status: true,
  });

  useEffect(() => {
    // Check user role
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(session => {
        if (session.user) {
          setUser(session.user);
          // Redirect non-admin users
          if (session.user.role !== 'admin') {
            router.push("/ecosystems");
          }
        } else {
          router.push("/");
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Checking permissions...</div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>You do not have permission to access this page.</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/ecosystems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const ecosystem = await response.json();
        router.push(`/ecosystems/${ecosystem.Id || ecosystem.id}`);
      } else {
        const error = await response.text();
        alert(`Failed to create ecosystem: ${error}`);
      }
    } catch (error) {
      console.error("Error creating ecosystem:", error);
      alert("Failed to create ecosystem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Link href="/ecosystems" style={{ color: '#0066cc', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to ecosystems
      </Link>
      
      <h1 style={{ fontSize: '24px', marginBottom: '2rem' }}>Create New Ecosystem</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Ecosystem Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Theme *
          </label>
          <input
            type="text"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.active_status}
              onChange={(e) => setFormData({ ...formData, active_status: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '500' }}>Active</span>
          </label>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem', marginLeft: '24px' }}>
            Enable this ecosystem immediately after creation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/ecosystems"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              textDecoration: 'none',
              color: '#333'
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Creating..." : "Create Ecosystem"}
          </button>
        </div>
      </form>
    </div>
  );
}