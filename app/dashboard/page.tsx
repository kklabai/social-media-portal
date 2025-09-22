"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<{
    summary: {
      totalUsers: number;
      totalEcosystems: number;
      activeEcosystems: number;
      totalPlatforms: number;
      platformsWithCredentials: number;
      totpEnabledPlatforms: number;
    };
    themes: Array<{ name: string; count: number }>;
    platformTypes: Array<{ type: string; count: number }>;
    activeStandardPlatforms: Array<{ platform: string; count: number }>;
    standardPlatformTypes: string[];
    matrix: Array<{
      ecosystemId: number;
      ecosystemName: string;
      ecosystemTheme: string;
      activeStatus: boolean;
      platforms: Record<string, {
        configured: boolean;
        hasCredentials: boolean;
        totpEnabled: boolean;
        count: number;
      }>;
      totalConfigured: number;
    }>;
  } | null>(null);
  const [ecosystems, setEcosystems] = useState<Array<{ id: number; name: string; theme: string; platform_count: number; user_count: number; active_status?: boolean }>>([]);
  const [platforms, setPlatforms] = useState<Array<{ 
    id: number; 
    platform_name: string; 
    platform_type: string; 
    ecosystem_id?: number; 
    ecosystem?: { name: string }; 
    username?: string; 
    password?: string; 
    totp_enabled?: boolean;
  }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; ecosystem_count: number; role?: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixThemeFilter, setMatrixThemeFilter] = useState('all');
  const [matrixPlatformFilter, setMatrixPlatformFilter] = useState('all');
  const [showOnlyConfigured, setShowOnlyConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((session) => {
        if (session.user) {
          setUser(session.user);
          if (session.user.role === 'admin') {
            fetchStats();
          } else {
            setLoading(false);
          }
        } else {
          router.push("/");
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        console.log('Stats loaded:', data);
        setStats(data);
      } else {
        const errorData = await res.json();
        console.error('Failed to fetch stats:', res.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });

      if (activeTab === 'ecosystems' && selectedTheme !== 'all') {
        queryParams.append('theme', selectedTheme);
      }

      let endpoint = '';
      switch (activeTab) {
        case 'ecosystems':
          endpoint = `/api/ecosystems?${queryParams}`;
          break;
        case 'platforms':
          endpoint = `/api/platforms?${queryParams}`;
          break;
        case 'users':
          endpoint = `/api/users?${queryParams}`;
          break;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          switch (activeTab) {
            case 'ecosystems':
              setEcosystems(data.list || []);
              break;
            case 'platforms':
              setPlatforms(data.list || []);
              break;
            case 'users':
              setUsers(data.list || []);
              break;
          }
          setPagination(data.pagination || {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [activeTab, searchTerm, selectedTheme, currentPage]);

  useEffect(() => {
    if (user && activeTab !== 'overview') {
      loadData();
    }
  }, [activeTab, searchTerm, selectedTheme, currentPage, user, loadData]);

  // Refresh stats when switching to overview tab
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'overview' && stats === null) {
      fetchStats();
    }
  }, [activeTab, user, stats]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Welcome back, {user?.name}</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <p>Access your ecosystems from the navigation menu.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>System Overview and Management</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' }}>
        {['overview', 'ecosystems', 'platforms', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
              setSearchTerm('');
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #0066cc' : '2px solid transparent',
              color: activeTab === tab ? '#0066cc' : '#666',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              textTransform: 'capitalize',
              marginBottom: '-2px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        !stats ? (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '4rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center' 
          }}>
            <div style={{ color: '#666' }}>Loading statistics...</div>
          </div>
        ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #0066cc'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#0066cc', marginBottom: '0.25rem' }}>
                {stats.summary.totalEcosystems}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Ecosystems</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '0.25rem' }}>
                {stats.summary.activeEcosystems} active
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #28a745'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#28a745', marginBottom: '0.25rem' }}>
                {stats.summary.totalPlatforms}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Platforms</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '0.25rem' }}>
                {stats.summary.platformsWithCredentials} with credentials
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ffc107'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#ffc107', marginBottom: '0.25rem' }}>
                {stats.summary.totalUsers}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Total Users</div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #17a2b8'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#17a2b8', marginBottom: '0.25rem' }}>
                {stats.summary.totpEnabledPlatforms}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>TOTP Enabled</div>
            </div>

          </div>


          {/* Platform-Ecosystem Matrix */}
          {stats.matrix && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginTop: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    Platform Coverage Matrix
                  </h3>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {stats.matrix.filter((eco) => 
                      eco.ecosystemName.toLowerCase().includes(matrixSearch.toLowerCase()) &&
                      (matrixThemeFilter === 'all' || eco.ecosystemTheme === matrixThemeFilter) &&
                      (matrixPlatformFilter === 'all' || eco.platforms[matrixPlatformFilter]?.configured) &&
                      (!showOnlyConfigured || eco.totalConfigured > 0)
                    ).length} ecosystems shown
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search ecosystems..."
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <select
                    value={matrixPlatformFilter}
                    onChange={(e) => setMatrixPlatformFilter(e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="all">All Platforms</option>
                    {stats.standardPlatformTypes.map((platform: string) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                  
                  <select
                    value={matrixThemeFilter}
                    onChange={(e) => setMatrixThemeFilter(e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="all">All Themes</option>
                    {stats.themes.map((theme) => (
                      <option key={theme.name} value={theme.name}>{theme.name}</option>
                    ))}
                  </select>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={showOnlyConfigured}
                      onChange={(e) => setShowOnlyConfigured(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Has platforms</span>
                  </label>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ 
                        padding: '0.75rem',
                        textAlign: 'left',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #dee2e6',
                        minWidth: '150px',
                        zIndex: 10
                      }}>
                        Ecosystem
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '2px solid #dee2e6',
                        minWidth: '60px',
                        fontWeight: '600'
                      }}>
                        Total
                      </th>
                      {stats.standardPlatformTypes.map((platform: string) => (
                        <th
                          key={platform}
                          style={{
                            padding: '0.5rem',
                            textAlign: 'center',
                            borderBottom: '2px solid #dee2e6',
                            minWidth: '40px',
                            fontSize: '10px',
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            height: '120px'
                          }}
                        >
                          {platform}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.matrix
                      .filter((eco) => {
                        // Apply search filter
                        if (matrixSearch && !eco.ecosystemName.toLowerCase().includes(matrixSearch.toLowerCase())) {
                          return false;
                        }
                        // Apply theme filter
                        if (matrixThemeFilter !== 'all' && eco.ecosystemTheme !== matrixThemeFilter) {
                          return false;
                        }
                        // Apply platform filter - show only ecosystems that have the selected platform configured
                        if (matrixPlatformFilter !== 'all' && !eco.platforms[matrixPlatformFilter]?.configured) {
                          return false;
                        }
                        // Apply configured filter
                        if (showOnlyConfigured && eco.totalConfigured === 0) {
                          return false;
                        }
                        return true;
                      })
                      .map((ecosystem) => (
                      <tr key={ecosystem.ecosystemId} style={{ borderBottom: '1px solid #e9ecef' }}>
                        <td style={{
                          padding: '0.75rem',
                          fontWeight: '500',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'white',
                          borderRight: '1px solid #e9ecef'
                        }}>
                          <Link 
                            href={`/ecosystems/${ecosystem.ecosystemId}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'block'
                            }}
                          >
                            <div>
                              {ecosystem.ecosystemName}
                              <span style={{
                                display: 'block',
                                fontSize: '10px',
                                color: '#666',
                                fontWeight: '400'
                              }}>
                                {ecosystem.ecosystemTheme}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td style={{
                          padding: '0.5rem',
                          textAlign: 'center',
                          fontWeight: '600'
                        }}>
                          <Link
                            href={`/ecosystems/${ecosystem.ecosystemId}`}
                            style={{
                              textDecoration: 'none',
                              color: ecosystem.totalConfigured > 15 ? '#28a745' : 
                                     ecosystem.totalConfigured > 8 ? '#ffc107' : '#6c757d',
                              display: 'block',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            {ecosystem.totalConfigured}
                          </Link>
                        </td>
                        {stats.standardPlatformTypes.map((platformType: string) => {
                          const platform = ecosystem.platforms[platformType];
                          return (
                            <td
                              key={platformType}
                              style={{
                                padding: '0.25rem',
                                textAlign: 'center',
                                backgroundColor: platform.configured ? 
                                  (platform.hasCredentials ? '#d4edda' : '#fff3cd') : 
                                  '#f8f9fa',
                                cursor: platform.configured ? 'pointer' : 'default'
                              }}
                            >
                              {platform.configured ? (
                                <Link
                                  href={`/ecosystems/${ecosystem.ecosystemId}?platform=${encodeURIComponent(platformType)}`}
                                  style={{
                                    textDecoration: 'none',
                                    display: 'block',
                                    padding: '0.25rem',
                                    borderRadius: '4px',
                                    transition: 'opacity 0.2s'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{
                                      fontSize: '16px',
                                      color: platform.hasCredentials ? '#28a745' : '#ffc107'
                                    }}>
                                      {platform.hasCredentials ? '✓' : '○'}
                                    </span>
                                    {platform.totpEnabled && (
                                      <span style={{
                                        fontSize: '10px',
                                        color: '#17a2b8',
                                        fontWeight: '600'
                                      }}>
                                        2FA
                                      </span>
                                    )}
                                    {platform.count > 1 && (
                                      <span style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        backgroundColor: '#e9ecef',
                                        padding: '1px 4px',
                                        borderRadius: '8px'
                                      }}>
                                        {platform.count}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              ) : (
                                <span style={{ color: '#dee2e6', fontSize: '14px' }}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {stats.matrix.filter((eco) => {
                      if (matrixSearch && !eco.ecosystemName.toLowerCase().includes(matrixSearch.toLowerCase())) {
                        return false;
                      }
                      if (matrixThemeFilter !== 'all' && eco.ecosystemTheme !== matrixThemeFilter) {
                        return false;
                      }
                      if (matrixPlatformFilter !== 'all' && !eco.platforms[matrixPlatformFilter]?.configured) {
                        return false;
                      }
                      if (showOnlyConfigured && eco.totalConfigured === 0) {
                        return false;
                      }
                      return true;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={stats.standardPlatformTypes.length + 2} style={{
                          padding: '2rem',
                          textAlign: 'center',
                          color: '#666',
                          fontStyle: 'italic'
                        }}>
                          No ecosystems match your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}>
                      <td style={{
                        padding: '0.75rem',
                        fontWeight: '600',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#f8f9fa'
                      }}>
                        Platform Totals
                      </td>
                      <td style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        {stats.activeStandardPlatforms.length}
                      </td>
                      {stats.standardPlatformTypes.map((platformType: string) => {
                        const platformData = stats.activeStandardPlatforms.find((p) => p.platform === platformType);
                        return (
                          <td
                            key={platformType}
                            style={{
                              padding: '0.5rem',
                              textAlign: 'center',
                              fontWeight: '600',
                              color: platformData ? '#0066cc' : '#ccc',
                              backgroundColor: platformData ? '#e7f3ff' : 'transparent'
                            }}
                          >
                            {platformData ? platformData.count : '0'}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '12px', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#28a745', fontSize: '16px' }}>✓</span>
                    <span>Platform configured with credentials</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#ffc107', fontSize: '16px' }}>○</span>
                    <span>Platform configured without credentials</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#dee2e6', fontSize: '14px' }}>-</span>
                    <span>Platform not configured</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#17a2b8',
                      fontWeight: '600',
                      padding: '1px 4px',
                      backgroundColor: '#d1ecf1',
                      borderRadius: '2px'
                    }}>
                      2FA
                    </span>
                    <span>Two-factor authentication enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
        )
      )}

      {/* Ecosystems Tab */}
      {activeTab === 'ecosystems' && (
        <div>
          {/* Search and Filter Bar */}
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search ecosystems..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}>🔍</span>
            </div>
            
            <select
              value={selectedTheme}
              onChange={(e) => {
                setSelectedTheme(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                minWidth: '150px'
              }}
            >
              <option value="all">All Themes</option>
              {stats?.themes.map((theme) => (
                <option key={theme.name} value={theme.name}>{theme.name}</option>
              ))}
            </select>

            <Link
              href="/ecosystems/new"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0066cc',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + New Ecosystem
            </Link>
          </div>

          {/* Ecosystems Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Theme</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Platforms</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Users</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ecosystems.map((ecosystem) => (
                  <tr key={ecosystem.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>
                      <Link href={`/ecosystems/${ecosystem.id}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                        {ecosystem.name}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px', color: '#666' }}>{ecosystem.theme}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {ecosystem.platform_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {ecosystem.user_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: ecosystem.active_status ? '#d4edda' : '#f8d7da',
                        color: ecosystem.active_status ? '#155724' : '#721c24',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {ecosystem.active_status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Link
                          href={`/ecosystems/${ecosystem.id}/edit`}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            color: '#495057',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <div>
          {/* Search Bar */}
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search platforms..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}>🔍</span>
            </div>
          </div>

          {/* Platforms Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Platform</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Ecosystem</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Credentials</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>TOTP</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform) => (
                  <tr key={platform.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>
                      <Link href={`/ecosystems/${platform.ecosystem_id}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                        {platform.platform_name}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {platform.platform_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px', color: '#666' }}>{platform.ecosystem?.name || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {platform.username || platform.password ? (
                        <span style={{ color: '#28a745' }}>✓</span>
                      ) : (
                        <span style={{ color: '#dc3545' }}>✗</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {platform.totp_enabled ? (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#d1ecf1',
                          color: '#0c5460',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          Enabled
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Link
                        href={`/platforms/${platform.id}/edit`}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          color: '#495057',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* Search Bar */}
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}>🔍</span>
            </div>

            <Link
              href="/users/new"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0066cc',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + New User
            </Link>
          </div>

          {/* Users Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Ecosystems</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px' }}>
                      <Link href={`/users/${user.id}/edit`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                        {user.name}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '14px', color: '#666' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: user.role === 'admin' ? '#f8d7da' : '#d1ecf1',
                        color: user.role === 'admin' ? '#721c24' : '#0c5460',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {user.ecosystem_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Link
                        href={`/users/${user.id}/edit`}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          color: '#495057',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {activeTab !== 'overview' && pagination.totalPages > 1 && (
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              fontSize: '14px'
            }}
          >
            Previous
          </button>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: currentPage === pageNum ? '#0066cc' : 'white',
                    color: currentPage === pageNum ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: currentPage === pageNum ? '500' : '400'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === pagination.totalPages ? 0.5 : 1,
              fontSize: '14px'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}