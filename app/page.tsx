"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) {
          router.push("/dashboard");
        }
      })
      .catch(console.error);
  }, [router]);

  const handleLogin = () => {
    console.log('Login button clicked');
    console.log('ENV AUTH_URL:', process.env.NEXT_PUBLIC_AUTH_URL);
    console.log('ENV CLIENT_ID:', process.env.NEXT_PUBLIC_AUTH_CLIENT_ID);
    console.log('ENV BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.kailasa.ai';
    const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '9283-1346-1927-1029';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${baseUrl}/api/auth/callback`,
    });
    
    // Use the correct endpoint that works in your other portal
    const fullAuthUrl = `${authUrl}/auth/sign-in?${params.toString()}`;
    console.log('Redirecting to:', fullAuthUrl);
    
    window.location.href = fullAuthUrl;
  };

  const features = [
    {
      icon: "🌐",
      title: "Ecosystem Management",
      description: "Organize platforms into themed ecosystems"
    },
    {
      icon: "🛡️",
      title: "Secure Storage",
      description: "AES-256 encryption for all credentials"
    },
    {
      icon: "🔑",
      title: "TOTP Support",
      description: "Two-factor authentication for enhanced security"
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Side - Login Form */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'white',
        padding: '2rem' 
      }}>
        <div style={{ maxWidth: '28rem', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              margin: '0 auto',
              height: '5rem',
              width: '5rem',
              backgroundColor: '#e0e7ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '2rem' }}>🛡️</span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '300', color: '#111827', marginBottom: '0.5rem' }}>Welcome Back</h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Sign in to access your social media management portal
            </p>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Sign in with SSO
            </button>
            
            <p style={{
              fontSize: '12px',
              textAlign: 'center',
              color: '#6b7280',
              marginTop: '1.5rem'
            }}>
              By signing in, you agree to our terms of service and privacy policy.
              Your data is encrypted and secure.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Features */}
      <div style={{ 
        flex: 1,
        background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '36rem' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '300', color: 'white', marginBottom: '2rem' }}>
            Social Media Manager Portal
          </h2>
          <p style={{ fontSize: '18px', color: '#bfdbfe', marginBottom: '3rem' }}>
            Manage your social media accounts across multiple ecosystems with enterprise-grade security.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {features.map((feature, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '24px'
                }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'white', marginBottom: '0.25rem' }}>{feature.title}</h3>
                  <p style={{ color: '#bfdbfe', fontSize: '14px' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <p style={{ fontSize: '14px', color: '#bfdbfe' }}>
              Trusted by organizations worldwide to manage their social media presence securely and efficiently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}