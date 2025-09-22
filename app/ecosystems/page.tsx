"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Ecosystem } from "@/lib/types";

export default function EcosystemsPage() {
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [user, setUser] = useState<{ id: number; name: string; role: string } | null>(null);

  const fetchEcosystems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (themeFilter) {
        params.append('theme', themeFilter);
      }
      
      if (activeFilter !== '') {
        params.append('activeStatus', activeFilter);
      }

      const ecosystemsRes = await fetch(`/api/ecosystems?${params}`);
      
      if (!ecosystemsRes.ok) {
        throw new Error("Failed to fetch ecosystems");
      }
      
      const ecosystemsData = await ecosystemsRes.json();
      console.log('Ecosystems data:', ecosystemsData);
      setEcosystems(ecosystemsData.list || []);
      setPagination(ecosystemsData.pagination || {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, themeFilter, activeFilter]);

  useEffect(() => {
    // Get user session first
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(async (session) => {
        if (session.user) {
          setUser(session.user);
          fetchEcosystems();
        }
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        setLoading(false);
      });
  }, [fetchEcosystems]);

  useEffect(() => {
    if (user) {
      fetchEcosystems();
    }
  }, [user, currentPage, searchTerm, themeFilter, activeFilter, fetchEcosystems]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ecosystem?")) return;

    try {
      const response = await fetch(`/api/ecosystems/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the data to get updated pagination
        if (user) {
          fetchEcosystems();
        }
      }
    } catch (error) {
      console.error("Error deleting ecosystem:", error);
    }
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ color: '#666' }}>Loading ecosystems...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>Ecosystems</h1>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Manage your social media ecosystems and platforms
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link
            href="/ecosystems/new"
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
            New Ecosystem
          </Link>
        )}
      </div>

      {/* Search and Filter Bar */}
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
            placeholder="Search ecosystems..."
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
        <select
          value={themeFilter}
          onChange={(e) => {
            setThemeFilter(e.target.value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#f9fafb',
            minWidth: '150px'
          }}
        >
          <option value="">All Themes</option>
          <option value="Education">Education</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Business">Business</option>
          <option value="Technology">Technology</option>
        </select>
        
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#f9fafb',
            minWidth: '120px'
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        
        <div style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          {pagination.total} ecosystems found
        </div>
      </div>

      {/* Ecosystems Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '14px', width: '3rem' }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Theme</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Platforms</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '14px', width: '8rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ecosystems.map((ecosystem) => (
                <tr key={ecosystem.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <input type="checkbox" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>
                      <p style={{ fontWeight: '500', color: '#333', marginBottom: '0.25rem' }}>{ecosystem.name}</p>
                      {ecosystem.description && (
                        <p style={{ fontSize: '13px', color: '#666' }}>{ecosystem.description}</p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ color: '#555' }}>{ecosystem.theme}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ color: '#555' }}>25</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: ecosystem.active_status ? '#d4edda' : '#f8d7da',
                      color: ecosystem.active_status ? '#155724' : '#721c24',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {ecosystem.active_status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link
                        href={`/ecosystems/${ecosystem.id}`}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          color: '#666'
                        }}
                        title="View"
                      >
                        👁️
                      </Link>
                      {user?.role === 'admin' && (
                        <>
                          <Link
                            href={`/ecosystems/${ecosystem.id}/edit`}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              color: '#666'
                            }}
                            title="Edit"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => handleDelete(ecosystem.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fee',
                              border: '1px solid #fcc',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#c00'
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {ecosystems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#666' }}>No ecosystems found.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: currentPage === 1 ? '#999' : '#333'
                }}
              >
                Previous
              </button>
              
              {/* Page numbers */}
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
                      backgroundColor: currentPage === pageNum ? '#0066cc' : '#f8f9fa',
                      color: currentPage === pageNum ? 'white' : '#333',
                      border: currentPage === pageNum ? 'none' : '1px solid #e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: currentPage === pageNum ? '500' : '400'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: currentPage === pagination.totalPages ? '#999' : '#333'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}