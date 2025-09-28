"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PlatformEditPage() {
  const params = useParams();
  const router = useRouter();
  interface PlatformData {
    id: number;
    platform_name: string;
    platform_type: string;
    profile_id?: string;
    username?: string;
    password?: string;
    profile_url?: string;
    totp_enabled?: boolean;
    ecosystem_id?: number;
  }
  const [platform, setPlatform] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ dbId: number; email: string; role: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [formData, setFormData] = useState({
    platform_name: "",
    platform_type: "",
    profile_id: "",
    username: "",
    password: "",
    profile_url: "",
  });
  
  // TOTP states
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [totpSecret, setTOTPSecret] = useState("");
  const [totpToken, setTOTPToken] = useState("");

  const loadPlatformData = useCallback(async (userData: { dbId: number; role: string }) => {
    try {
      console.log("Loading platform with ID:", params.id);
      const res = await fetch(`/api/platforms/${params.id}`);
      console.log("Platform API response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to load platform:", errorText);
        router.push("/ecosystems");
        return;
      }
      const platformData = await res.json();
      console.log("Platform data loaded:", platformData);
      
      if (!platformData) {
        console.log("No platform data returned");
        router.push("/ecosystems");
        return;
      }
      
      console.log("User role:", userData.role);
      console.log("User is admin?", userData.role === 'admin');
      
      // Check if user has access to this platform
      if (userData.role !== 'admin') {
        // For regular users, check if they have access to this ecosystem
        const ecosystemRes = await fetch(`/api/ecosystems?userId=${userData.dbId}`);
        const ecosystemData = await ecosystemRes.json();
        const userEcosystems = ecosystemData.list || [];
        
        const hasEcosystemAccess = userEcosystems.some(
          (ue: { id: number }) => ue.id === platformData.ecosystem_id
        );
        
        if (!hasEcosystemAccess) {
          console.log("User doesn't have access to ecosystem", platformData.ecosystem_id);
          router.push("/ecosystems");
          return;
        }
      }
      
      setHasAccess(true);
      setPlatform(platformData);
      setFormData({
        platform_name: platformData.platform_name || "",
        platform_type: platformData.platform_type || "",
        profile_id: platformData.profile_id || "",
        username: platformData.username || "",
        password: platformData.password || "",
        profile_url: platformData.profile_url || "",
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading platform:", error);
      setLoading(false);
      router.push("/ecosystems");
    }
  }, [params.id, router]);

  const checkPermissions = useCallback(async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) {
        router.push("/");
        return;
      }
      
      const session = await sessionRes.json();
      if (!session.user) {
        router.push("/");
        return;
      }
      
      setCurrentUser(session.user);
      setCheckingAuth(false);
      
      // Load platform data and check access
      await loadPlatformData(session.user);
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/");
    }
  }, [router, loadPlatformData]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/platforms/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          changed_by: currentUser?.dbId,
        }),
      });

      if (res.ok) {
        router.push(`/ecosystems/${platform?.ecosystem_id}`);
      } else {
        alert("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving platform:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const setupTOTP = () => {
    // Clear any previous values
    setTOTPSecret("");
    setTOTPToken("");
    setShowTOTPSetup(true);
  };

  const verifyAndEnableTOTP = async () => {
    if (!totpSecret.trim()) {
      alert("Please enter the 2FA secret key");
      return;
    }

    try {
      const res = await fetch(`/api/platforms/${params.id}/totp/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          secret: totpSecret,
          token: totpToken 
        }),
      });

      if (res.ok) {
        alert("2FA secret stored successfully!");
        setShowTOTPSetup(false);
        setTOTPSecret("");
        setTOTPToken("");
        if (currentUser) {
          loadPlatformData(currentUser);
        }
      } else {
        const error = await res.text();
        alert(error || "Failed to store 2FA secret. Please check the secret and try again.");
      }
    } catch (error) {
      console.error("Error storing TOTP secret:", error);
      alert("Failed to store 2FA secret");
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Checking permissions...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading platform details...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>You do not have access to edit this platform.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link 
        href={`/ecosystems/${platform?.ecosystem_id}`} 
        style={{ color: '#0066cc', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}
      >
        ← Back to ecosystem
      </Link>
      
      <h1 style={{ fontSize: '24px', marginBottom: '2rem' }}>
        Edit Platform: {platform?.platform_name}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600' }}>Platform Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Platform Name
              </label>
              <input
                type="text"
                value={formData.platform_name}
                readOnly
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Platform Type
              </label>
              <input
                type="text"
                value={formData.platform_type}
                readOnly
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Profile ID
              </label>
              <input
                type="text"
                value={formData.profile_id}
                onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
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
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                Profile URL
              </label>
              <input
                type="url"
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* TOTP Section */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600' }}>
            Platform 2FA Secret
          </h2>
          
          {platform?.totp_enabled ? (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#d4edda', 
              borderRadius: '4px',
              color: '#155724'
            }}>
              ✓ 2FA secret is stored for this platform
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Store the platform&apos;s 2FA secret to generate codes
              </p>
              <button
                type="button"
                onClick={setupTOTP}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add 2FA Secret
              </button>
            </div>
          )}
        </div>

        {/* TOTP Setup Modal */}
        {showTOTPSetup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Store Platform&apos;s 2FA Secret</h3>
              
              <p style={{ fontSize: '14px', marginBottom: '1rem', color: '#666' }}>
                Enter the 2FA secret key from {platform?.platform_name || 'the platform'}. This is usually shown when you enable 2FA on the platform.
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  2FA Secret Key
                </label>
                <input
                  type="text"
                  value={totpSecret}
                  onChange={(e) => setTOTPSecret(e.target.value)}
                  placeholder="Enter the secret key (e.g., JBSWY3DPEHPK3PXP)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Test with current code (optional)
                </label>
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTOTPToken(e.target.value)}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    textAlign: 'center',
                    letterSpacing: '0.2em'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowTOTPSetup(false)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={verifyAndEnableTOTP}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Save Secret
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link
            href={`/ecosystems/${platform?.ecosystem_id}`}
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}