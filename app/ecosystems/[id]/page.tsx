"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EcosystemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ecosystem, setEcosystem] = useState<any>(null);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1
  });

  useEffect(() => {
    // Get user session first
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(session => {
        if (session.user) {
          setUser(session.user);
        }
        if (params.id !== 'new') {
          loadEcosystemData();
        }
      });
  }, [params.id]);

  useEffect(() => {
    if (params.id && params.id !== 'new' && ecosystem) {
      loadPlatforms();
    }
  }, [searchTerm, currentPage]);

  const loadPlatforms = async () => {
    try {
      const queryParams = new URLSearchParams({
        ecosystemId: String(params.id),
        page: currentPage.toString(),
        limit: '12',
      });
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const platRes = await fetch(`/api/platforms?${queryParams}`);
      if (!platRes.ok) {
        throw new Error(`Failed to fetch platforms: ${platRes.status}`);
      }
      const platData = await platRes.json();
      setPlatforms(platData.list || []);
      setPagination(platData.pagination || {
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1
      });
    } catch (error) {
      console.error("Error loading platforms:", error);
    }
  };

  const loadEcosystemData = async () => {
    try {
      if (!params.id || params.id === 'undefined') {
        console.error("Invalid ecosystem ID:", params.id);
        setLoading(false);
        return;
      }

      const ecoRes = await fetch(`/api/ecosystems/${params.id}`);
      if (!ecoRes.ok) {
        throw new Error(`Failed to fetch ecosystem: ${ecoRes.status}`);
      }
      const ecoData = await ecoRes.json();
      setEcosystem(ecoData);

      // Load platforms with pagination
      await loadPlatforms();
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading ecosystem:", error);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (platformId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ecosystem and all its platforms?")) return;
    
    try {
      const res = await fetch(`/api/ecosystems/${params.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        router.push("/ecosystems");
      }
    } catch (error) {
      console.error("Error deleting ecosystem:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading ecosystem details...</div>
      </div>
    );
  }

  if (!ecosystem) {
    return (
      <div style={{ padding: '2rem' }}>
        <div>Ecosystem not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/ecosystems" style={{ color: '#0066cc', textDecoration: 'none' }}>
          ← Back to ecosystems
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '0.5rem' }}>{ecosystem.name}</h1>
            <p style={{ color: '#666', fontSize: '16px' }}>{ecosystem.theme}</p>
            {ecosystem.description && (
              <p style={{ color: '#666', fontSize: '14px', marginTop: '0.5rem' }}>{ecosystem.description}</p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              padding: '4px 12px',
              backgroundColor: ecosystem.active_status ? '#d4edda' : '#f8d7da',
              color: ecosystem.active_status ? '#155724' : '#721c24',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {ecosystem.active_status ? 'Active' : 'Inactive'}
            </span>
            
            {user?.role === 'admin' && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Delete Ecosystem
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Total Platforms</h3>
          <p style={{ fontSize: '32px', fontWeight: '600', color: '#0066cc' }}>{pagination.total}</p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>With Credentials</h3>
          <p style={{ fontSize: '32px', fontWeight: '600', color: '#28a745' }}>
            {platforms.filter(p => p.username || p.password).length}
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>TOTP Enabled</h3>
          <p style={{ fontSize: '32px', fontWeight: '600', color: '#17a2b8' }}>
            {platforms.filter(p => p.totp_enabled).length}
          </p>
        </div>
      </div>

      {/* Platforms Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Social Media Platforms</h2>
        <Link
          href={`/platforms/new?ecosystemId=${params.id}`}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0066cc',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          New Platform
        </Link>
      </div>
      
      {/* Search Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999',
            fontSize: '18px',
            pointerEvents: 'none'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search platforms by name, type, or URL..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              paddingRight: '0.75rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        
        <div style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          {pagination.total} platforms found
        </div>
      </div>
      
      {/* Platforms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {platforms.map((platform) => (
          <div
            key={platform.id || platform.Id}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {platform.platform_name}
                </h3>
                <p style={{ fontSize: '13px', color: '#666' }}>{platform.platform_type}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {platform.totp_enabled && (
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#d1ecf1',
                    color: '#0c5460',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    TOTP
                  </span>
                )}
                
                <Link
                  href={`/platforms/${platform.id || platform.Id}/edit`}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#333',
                    fontSize: '12px'
                  }}
                >
                  Edit
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {platform.profile_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '13px', color: '#666', minWidth: '80px' }}>URL:</span>
                  <a 
                    href={platform.profile_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#0066cc', fontSize: '13px', textDecoration: 'none' }}
                  >
                    {platform.profile_url}
                  </a>
                </div>
              )}
              
              {platform.username && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '13px', color: '#666', minWidth: '80px' }}>Username:</span>
                  <span style={{ fontSize: '13px' }}>{platform.username}</span>
                </div>
              )}
              
              {platform.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '13px', color: '#666', minWidth: '80px' }}>Password:</span>
                  <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                    {showPasswords[platform.id || platform.Id] ? platform.password : '••••••••'}
                  </span>
                  <button
                    onClick={() => togglePasswordVisibility(platform.id || platform.Id)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {showPasswords[platform.id || platform.Id] ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
              
              {!platform.username && !platform.password && !platform.profile_url && (
                <p style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                  No credentials configured
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
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
      
      {/* No platforms message */}
      {platforms.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666' }}>No platforms found.</p>
        </div>
      )}
    </div>
  );
}