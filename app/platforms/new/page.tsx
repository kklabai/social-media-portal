"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewPlatformPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ecosystemId = searchParams.get('ecosystemId');
  
  const [ecosystem, setEcosystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    platform_name: "",
    platform_type: "",
    profile_id: "",
    username: "",
    password: "",
    profile_url: "",
    totp_enabled: false
  });
  const [useCustomPlatform, setUseCustomPlatform] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, [ecosystemId]);

  const checkPermissions = async () => {
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
      
      // Load ecosystem data
      if (ecosystemId) {
        await loadEcosystem(session.user);
      } else {
        router.push("/ecosystems");
      }
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/");
    }
  };

  const loadEcosystem = async (user: any) => {
    try {
      const res = await fetch(`/api/ecosystems/${ecosystemId}`);
      if (!res.ok) {
        router.push("/ecosystems");
        return;
      }
      const ecosystemData = await res.json();
      
      // Check if user has access to this ecosystem
      if (user.role !== 'admin') {
        const userEcoRes = await fetch(`/api/ecosystems?userId=${user.dbId}`);
        const userEcoData = await userEcoRes.json();
        const userEcosystems = userEcoData.list || [];
        
        const hasAccess = userEcosystems.some(
          (ue: any) => ue.id === ecosystemData.id
        );
        
        if (!hasAccess) {
          router.push("/ecosystems");
          return;
        }
      }
      
      setEcosystem(ecosystemData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading ecosystem:", error);
      router.push("/ecosystems");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ecosystem_id: parseInt(ecosystemId!),
        }),
      });

      if (res.ok) {
        router.push(`/ecosystems/${ecosystemId}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create platform");
      }
    } catch (error) {
      console.error("Error creating platform:", error);
      alert("Failed to create platform");
    } finally {
      setSaving(false);
    }
  };

  const standardPlatforms = [
    { name: "YouTube", category: "Video", urlFormat: "https://youtube.com/@{username}", requiresPrefix: "@" },
    { name: "Facebook", category: "Social Network", urlFormat: "https://facebook.com/{username}" },
    { name: "Instagram", category: "Photo Sharing", urlFormat: "https://instagram.com/{username}" },
    { name: "Twitter/X", category: "Microblogging", urlFormat: "https://x.com/{username}" },
    { name: "TikTok", category: "Short Video", urlFormat: "https://tiktok.com/@{username}", requiresPrefix: "@" },
    { name: "Pinterest", category: "Visual Discovery", urlFormat: "https://pinterest.com/{username}" },
    { name: "LinkedIn", category: "Professional Network", urlFormat: "https://linkedin.com/company/{username}" },
    { name: "Bluesky", category: "Decentralized Social", urlFormat: "https://bsky.app/profile/{username}.bsky.social", note: "Use format: username.bsky.social" },
    { name: "Threads", category: "Text Updates", urlFormat: "https://threads.net/@{username}", requiresPrefix: "@" },
    { name: "Reddit", category: "Community Forum", urlFormat: "https://reddit.com/user/{username}" },
    { name: "Blogspot", category: "Blogging", urlFormat: "https://{username}.blogspot.com" },
    { name: "Mastodon", category: "Federated Social", urlFormat: "https://mastodon.social/@{username}", note: "For other instances: https://{instance}/@{username}" },
    { name: "Telegram", category: "Messaging", urlFormat: "https://t.me/{username}" },
    { name: "Nostr", category: "Decentralized Protocol", urlFormat: "nostr:{npub}", note: "Use npub public key" },
    { name: "Lemmy", category: "Link Aggregator", urlFormat: "https://lemmy.ml/u/{username}", note: "For other instances: https://{instance}/u/{username}" },
    { name: "Warpcast", category: "Web3 Social", urlFormat: "https://warpcast.com/{username}" },
    { name: "Twitch", category: "Live Streaming", urlFormat: "https://twitch.tv/{username}" },
    { name: "DLive", category: "Blockchain Streaming", urlFormat: "https://dlive.tv/{username}" },
    { name: "Trovo", category: "Gaming Stream", urlFormat: "https://trovo.live/{username}" },
    { name: "Kick", category: "Streaming Platform", urlFormat: "https://kick.com/{username}" },
    { name: "Rumble", category: "Video Platform", urlFormat: "https://rumble.com/c/{username}" },
    { name: "WhatsApp Channel", category: "Messaging Channel", urlFormat: "https://whatsapp.com/channel/{channel_id}", note: "Use channel ID, not username" },
    { name: "Medium", category: "Publishing", urlFormat: "https://medium.com/@{username}", requiresPrefix: "@" },
    { name: "Quora", category: "Q&A Platform", urlFormat: "https://quora.com/profile/{username}" },
    { name: "Discord", category: "Community Chat", urlFormat: "https://discord.gg/{invite_code}", note: "Use invite code, not username" }
  ];

  const handlePlatformSelect = (platformName: string) => {
    const platform = standardPlatforms.find(p => p.name === platformName);
    if (platform) {
      setFormData({
        ...formData,
        platform_name: `${ecosystem?.name} ${platform.name}`,
        platform_type: platform.name
      });
      // Auto-generate URL if username is provided
      if (formData.username && platform.urlFormat) {
        generateProfileUrl(formData.username, platform);
      }
    }
  };

  const generateProfileUrl = (username?: string, platformOverride?: typeof standardPlatforms[0]) => {
    const platform = platformOverride || standardPlatforms.find(p => p.name === formData.platform_type);
    const usernameToUse = username || formData.username;
    
    if (platform && usernameToUse && platform.urlFormat) {
      let url = platform.urlFormat;
      
      // Handle special cases
      if (platform.urlFormat.includes('{channel_id}') || platform.urlFormat.includes('{invite_code}') || platform.urlFormat.includes('{npub}')) {
        // For Discord, WhatsApp Channel, and Nostr, use profile_id
        url = url
          .replace('{channel_id}', formData.profile_id || '')
          .replace('{invite_code}', formData.profile_id || '')
          .replace('{npub}', formData.profile_id || '');
      } else {
        // For regular platforms, use username
        url = url.replace('{username}', usernameToUse);
      }
      
      setFormData(prev => ({ ...prev, profile_url: url }));
    }
  };

  if (checkingAuth || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link 
        href={`/ecosystems/${ecosystemId}`} 
        style={{ color: '#0066cc', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}
      >
        ← Back to {ecosystem?.name}
      </Link>
      
      <h1 style={{ fontSize: '24px', marginBottom: '2rem' }}>
        Add New Platform
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
          
          {/* Platform Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Choose Platform Type
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={!useCustomPlatform}
                  onChange={() => setUseCustomPlatform(false)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Standard Platform</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={useCustomPlatform}
                  onChange={() => {
                    setUseCustomPlatform(true);
                    setFormData({ ...formData, platform_type: '', platform_name: '', profile_url: '' });
                  }}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Custom Platform</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {!useCustomPlatform ? (
              <>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Select Platform <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={formData.platform_type}
                    onChange={(e) => {
                      const platformName = e.target.value;
                      const platform = standardPlatforms.find(p => p.name === platformName);
                      if (platform) {
                        setFormData({
                          ...formData,
                          platform_name: `${ecosystem?.name} ${platform.name}`,
                          platform_type: platform.name
                        });
                        // Auto-generate URL if username or profile_id is already provided
                        if (formData.username || (formData.profile_id && (platform.name === 'Discord' || platform.name === 'WhatsApp Channel' || platform.name === 'Nostr'))) {
                          setTimeout(() => generateProfileUrl(formData.username, platform), 0);
                        }
                      }
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a platform</option>
                    {standardPlatforms.map(platform => (
                      <option key={platform.name} value={platform.name}>
                        {platform.name} - {platform.category}
                      </option>
                    ))}
                  </select>
                  {formData.platform_type && (
                    <>
                      <p style={{ fontSize: '13px', color: '#666', marginTop: '0.5rem' }}>
                        Platform name will be: "{ecosystem?.name} {formData.platform_type}"
                      </p>
                      {standardPlatforms.find(p => p.name === formData.platform_type)?.note && (
                        <p style={{ fontSize: '12px', color: '#0066cc', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          ℹ️ {standardPlatforms.find(p => p.name === formData.platform_type)?.note}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Platform Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.platform_name}
                    onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                    required
                    placeholder="e.g., Company Blog"
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
                    Platform Type <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.platform_type}
                    onChange={(e) => setFormData({ ...formData, platform_type: e.target.value })}
                    required
                    placeholder="e.g., Blog, Forum, Custom"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                {!useCustomPlatform && formData.platform_type === 'Discord' ? 'Invite Code' : 
                 !useCustomPlatform && formData.platform_type === 'WhatsApp Channel' ? 'Channel ID' :
                 !useCustomPlatform && formData.platform_type === 'Nostr' ? 'npub Public Key' :
                 'Profile ID'}
              </label>
              <input
                type="text"
                value={formData.profile_id}
                onChange={(e) => {
                  setFormData({ ...formData, profile_id: e.target.value });
                  if (!useCustomPlatform && 
                      (formData.platform_type === 'Discord' || 
                       formData.platform_type === 'WhatsApp Channel' || 
                       formData.platform_type === 'Nostr')) {
                    generateProfileUrl();
                  }
                }}
                placeholder={
                  !useCustomPlatform && formData.platform_type === 'Discord' ? 'e.g., abc123xyz' :
                  !useCustomPlatform && formData.platform_type === 'WhatsApp Channel' ? 'e.g., 0029Va7ksfR3FOmm5CUqqe18' :
                  !useCustomPlatform && formData.platform_type === 'Nostr' ? 'e.g., npub1a2b3c4d...' :
                  'e.g., 1234567890'
                }
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
                {!useCustomPlatform && (formData.platform_type === 'Discord' || formData.platform_type === 'WhatsApp Channel' || formData.platform_type === 'Nostr') ? 'Username/Display Name' : 'Username'}
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (!useCustomPlatform && formData.platform_type) {
                    generateProfileUrl(e.target.value);
                  }
                }}
                placeholder={!useCustomPlatform && standardPlatforms.find(p => p.name === formData.platform_type)?.requiresPrefix ? 
                  `Without ${standardPlatforms.find(p => p.name === formData.platform_type)?.requiresPrefix} prefix` : 
                  "Account username"}
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
                placeholder="Account password"
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
                placeholder="https://twitter.com/username"
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

          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.totp_enabled}
                onChange={(e) => setFormData({ ...formData, totp_enabled: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '500' }}>Enable Two-Factor Authentication (TOTP)</span>
            </label>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
              You can configure TOTP after creating the platform
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link
            href={`/ecosystems/${ecosystemId}`}
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
            {saving ? "Creating..." : "Create Platform"}
          </button>
        </div>
      </form>
    </div>
  );
}