"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PlatformReport {
  platform_id: number;
  platform_name: string;
  platform_type: string;
  getlate_connected: boolean;
  getlate_username?: string;
  posts_count: number;
}

interface EcosystemReport {
  ecosystem_id: number;
  ecosystem_name: string;
  ecosystem_theme: string;
  getlate_profile_id?: string;
  getlate_profile_name?: string;
  total_platforms: number;
  getlate_connected_platforms: number;
  total_posts: number;
  platforms: PlatformReport[];
}

interface ReportData {
  success: boolean;
  summary: {
    total_ecosystems: number;
    ecosystems_with_getlate: number;
    total_platforms: number;
    getlate_connected_platforms: number;
    total_posts: number;
    date_range: {
      from: string;
      to: string;
    };
  };
  ecosystems: EcosystemReport[];
  getlate_available: boolean;
}

export default function GetlateReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [expandedEcosystems, setExpandedEcosystems] = useState<Set<number>>(new Set());

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
      
      setLoading(false);
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/dashboard");
    }
  }, [router]);

  const loadReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/getlate/reports?date_from=${dateFrom}&date_to=${dateTo}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error loading report:", error);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    if (!loading) {
      loadReport();
    }
  }, [dateFrom, dateTo, loading, loadReport]);

  const syncWithGetlate = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/getlate/sync', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        alert(`Sync completed!\nMatched: ${result.summary.total_matched}\nUnmatched Ecosystems: ${result.summary.total_unmatched_ecosystems}\nUnmatched Getlate Profiles: ${result.summary.total_unmatched_profiles}`);
        loadReport();
      } else {
        alert('Failed to sync with Getlate');
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert('Failed to sync with Getlate');
    } finally {
      setSyncing(false);
    }
  };

  const toggleEcosystem = (ecosystemId: number) => {
    setExpandedEcosystems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ecosystemId)) {
        newSet.delete(ecosystemId);
      } else {
        newSet.add(ecosystemId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>No report data available</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>
              Getlate Integration Report
            </h1>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Track social media activity across ecosystems managed through Getlate
            </p>
          </div>
          <button
            onClick={syncWithGetlate}
            disabled={syncing || !reportData.getlate_available}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: reportData.getlate_available ? '#0066cc' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: reportData.getlate_available ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: syncing ? 0.7 : 1,
            }}
          >
            {syncing ? 'Syncing...' : 'Sync with Getlate'}
          </button>
        </div>
        
        {!reportData.getlate_available && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#856404'
          }}>
            Getlate API key not configured. Add GETLATE_API_KEY to your environment variables to enable integration.
          </div>
        )}
      </div>

      {/* Date Range Selector */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '1rem' }}>Report Period</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '0.25rem' }}>
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '0.25rem' }}>
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #0066cc'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '0.25rem' }}>
            {reportData.summary.ecosystems_with_getlate} / {reportData.summary.total_ecosystems}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Ecosystems with Getlate</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '0.25rem' }}>
            {reportData.summary.getlate_connected_platforms} / {reportData.summary.total_platforms}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Connected Platforms</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '0.25rem' }}>
            {reportData.summary.total_posts}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Posts</div>
        </div>
      </div>

      {/* Ecosystems Report Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Ecosystem Details
          </h3>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '14px' }}>
                Ecosystem
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                Getlate Profile
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                Platforms
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                Connected
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                Posts
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {reportData.ecosystems.map(ecosystem => (
              <React.Fragment key={ecosystem.ecosystem_id}>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontSize: '14px', fontWeight: '500' }}>
                    <Link
                      href={`/ecosystems/${ecosystem.ecosystem_id}`}
                      style={{ textDecoration: 'none', color: '#0066cc' }}
                    >
                      {ecosystem.ecosystem_name}
                    </Link>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {ecosystem.ecosystem_theme}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                    {ecosystem.getlate_profile_name ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {ecosystem.getlate_profile_name}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                    {ecosystem.total_platforms}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px' }}>
                    <span style={{
                      color: ecosystem.getlate_connected_platforms > 0 ? '#28a745' : '#6c757d'
                    }}>
                      {ecosystem.getlate_connected_platforms}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                    {ecosystem.total_posts}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleEcosystem(ecosystem.ecosystem_id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {expandedEcosystems.has(ecosystem.ecosystem_id) ? 'Hide' : 'Show'} Platforms
                    </button>
                  </td>
                </tr>
                
                {expandedEcosystems.has(ecosystem.ecosystem_id) && (
                  <tr>
                    <td colSpan={6} style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                      <div style={{ padding: '1rem 2rem' }}>
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '13px', color: '#666' }}>
                                Platform
                              </th>
                              <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '13px', color: '#666' }}>
                                Type
                              </th>
                              <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '13px', color: '#666' }}>
                                Getlate Status
                              </th>
                              <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '13px', color: '#666' }}>
                                Posts
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ecosystem.platforms.map(platform => (
                              <tr key={platform.platform_id}>
                                <td style={{ padding: '0.5rem', fontSize: '13px' }}>
                                  {platform.platform_name}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '13px' }}>
                                  {platform.platform_type}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '13px' }}>
                                  {platform.getlate_connected ? (
                                    <span style={{ color: '#28a745' }}>✓ Connected</span>
                                  ) : (
                                    <span style={{ color: '#6c757d' }}>Not connected</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '13px', fontWeight: '500' }}>
                                  {platform.posts_count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}