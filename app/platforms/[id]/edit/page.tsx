"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  const [totpQRCode, setTOTPQRCode] = useState("");
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

  const setupTOTP = async () => {
    try {
      const res = await fetch(`/api/platforms/${params.id}/totp/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: currentUser?.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTOTPSecret(data.secret);
        setTOTPQRCode(data.qrCode);
        setShowTOTPSetup(true);
      }
    } catch (error) {
      console.error("Error setting up TOTP:", error);
      alert("Failed to setup TOTP");
    }
  };

  const verifyAndEnableTOTP = async () => {
    try {
      const res = await fetch(`/api/platforms/${params.id}/totp/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: totpToken }),
      });

      if (res.ok) {
        alert("TOTP enabled successfully!");
        setShowTOTPSetup(false);
        if (currentUser) {
          loadPlatformData(currentUser);
        }
      } else {
        alert("Invalid token. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying TOTP:", error);
      alert("Failed to verify TOTP");
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
            Two-Factor Authentication (TOTP)
          </h2>
          
          {platform?.totp_enabled ? (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#d4edda', 
              borderRadius: '4px',
              color: '#155724'
            }}>
              ✓ TOTP is enabled for this platform
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Enable two-factor authentication for additional security
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
                Enable TOTP
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
              <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Setup Two-Factor Authentication</h3>
              
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Image src={totpQRCode} alt="TOTP QR Code" width={200} height={200} style={{ maxWidth: '200px', height: 'auto' }} />
              </div>
              
              <p style={{ fontSize: '14px', marginBottom: '0.5rem' }}>
                Manual entry code:
              </p>
              <code style={{ 
                display: 'block', 
                padding: '0.5rem', 
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '12px',
                wordBreak: 'break-all'
              }}>
                {totpSecret}
              </code>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Enter verification code
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
                  Verify & Enable
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