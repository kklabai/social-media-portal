"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  interface UserData {
    name: string;
    email: string;
    ecitizen_id?: string;
    role: string;
  }
  interface EcosystemData {
    id?: number;
    Id?: number;
    name: string;
    theme: string;
    active_status: boolean;
  }
  const [user, setUser] = useState<UserData | null>(null);
  const [ecosystems, setEcosystems] = useState<EcosystemData[]>([]);
  const [assignedEcosystems, setAssignedEcosystems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      // Get user data
      const userRes = await fetch(`/api/users/${params.id}`);
      const userData = await userRes.json();
      setUser(userData);

      // Get assigned ecosystems
      const assignRes = await fetch(`/api/users/${params.id}/ecosystems`);
      const assignData = await assignRes.json();
      console.log("Loaded ecosystem assignments:", assignData);
      // Ensure ecosystem IDs are strings for comparison
      setAssignedEcosystems(assignData.ecosystemIds?.map((id: number) => String(id)) || []);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const loadEcosystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ecosystems");
      const data = await res.json();
      setEcosystems(data.list || []);
    } catch (error) {
      console.error("Error loading ecosystems:", error);
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) {
        router.push("/");
        return;
      }
      
      const session = await sessionRes.json();
      if (!session.user || session.user.role !== 'admin') {
        router.push("/dashboard");
        return;
      }
      
      setCheckingAuth(false);
      loadUserData();
      loadEcosystems();
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/dashboard");
    }
  }, [router, loadUserData, loadEcosystems]);

  useEffect(() => {
    checkPermissions();
  }, [params.id, checkPermissions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user basic info
      await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          ecitizen_id: user?.ecitizen_id,
          role: user?.role,
        }),
      });

      // Update ecosystem assignments
      console.log("Saving ecosystems:", assignedEcosystems);
      const ecosysRes = await fetch(`/api/users/${params.id}/ecosystems`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecosystemIds: assignedEcosystems }),
      });
      
      const result = await ecosysRes.json();
      
      if (!ecosysRes.ok) {
        console.error("Failed to save ecosystems:", result);
        throw new Error(result.error || "Failed to save ecosystem assignments");
      }
      
      // Check if manual action is required
      if (result.requiresManualAction) {
        alert(`Important: ${result.message}\n\nThe assignment needs to be completed manually in NocoDB.`);
        console.log("Manual action required:", result.instructions);
      }

      router.push("/users");
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleEcosystem = (ecosystemId: string) => {
    const idStr = String(ecosystemId);
    console.log("Toggling ecosystem:", idStr);
    setAssignedEcosystems(prev => {
      const newAssignments = prev.includes(idStr)
        ? prev.filter(id => id !== idStr)
        : [...prev, idStr];
      console.log("New assignments:", newAssignments);
      return newAssignments;
    });
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Checking permissions...</div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading user details...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/users" style={{ color: '#0066cc', textDecoration: 'none' }}>
          ← Back to users
        </Link>
        <h1 style={{ fontSize: '24px', marginTop: '1rem' }}>
          Edit User: {user.name}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* User Details */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600' }}>User Details</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                value={user.name || ''}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Ecitizen ID
              </label>
              <input
                type="text"
                value={user.ecitizen_id || ''}
                onChange={(e) => setUser({ ...user, ecitizen_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Role
              </label>
              <select
                value={user.role || 'user'}
                onChange={(e) => setUser({ ...user, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ecosystem Assignment */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600' }}>
            Assigned Ecosystems ({assignedEcosystems.length})
          </h2>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {ecosystems.map(ecosystem => (
              <div
                key={ecosystem.Id || ecosystem.id}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  border: assignedEcosystems.includes(String(ecosystem.Id || ecosystem.id)) 
                    ? '2px solid #0066cc' 
                    : '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: assignedEcosystems.includes(String(ecosystem.Id || ecosystem.id))
                    ? '#f0f8ff'
                    : 'white'
                }}
                onClick={() => toggleEcosystem(String(ecosystem.Id || ecosystem.id))}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{ecosystem.name}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{ecosystem.theme}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: ecosystem.active_status ? '#d4edda' : '#f8d7da',
                      color: ecosystem.active_status ? '#155724' : '#721c24'
                    }}>
                      {ecosystem.active_status ? 'Active' : 'Inactive'}
                    </span>
                    <input
                      type="checkbox"
                      checked={assignedEcosystems.includes(String(ecosystem.Id || ecosystem.id))}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <Link 
          href="/users" 
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
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}