"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function EmailsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
  });
  
  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);

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
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Checking permissions...</div>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setSaving(true);
    // TODO: Implement save functionality
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }
    // TODO: Implement test email functionality
    alert(`Test email sent to ${testEmail}`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '0.5rem' }}>Email Settings</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Configure email notifications and templates
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* SMTP Configuration */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600' }}>
            SMTP Configuration
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
                SMTP Host
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
                SMTP Port
              </label>
              <input
                type="text"
                placeholder="587"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
                SMTP Username
              </label>
              <input
                type="text"
                placeholder="your-email@gmail.com"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
                SMTP Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
                From Email
              </label>
              <input
                type="email"
                placeholder="noreply@example.com"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
                From Name
              </label>
              <input
                type="text"
                placeholder="Social Media Portal"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                padding: '0.75rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                fontWeight: '500',
                marginTop: '0.5rem'
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Email Templates */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
              Email Templates
            </h2>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              Add Template
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Welcome Email</h4>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Sent to new users when they join
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Password Reset</h4>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Sent when users request password reset
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Credential Update</h4>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Notification for credential changes
              </p>
            </div>

            <div style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Weekly Report</h4>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Weekly summary of platform activities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Section */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '1.5rem', fontWeight: '600' }}>
          Test Email Configuration
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '1rem' }}>
          Send a test email to verify your SMTP settings are working correctly
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '14px' }}>
              Test Email Address
            </label>
            <input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={handleSendTest}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>📧</span>
            Send Test Email
          </button>
        </div>
      </div>
    </div>
  );
}