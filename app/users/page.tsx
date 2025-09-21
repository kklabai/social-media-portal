"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  ecitizen_id?: string;
  role: string;
  created_at: string;
  userEcosystems?: any[];
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userEcosystems, setUserEcosystems] = useState<any>({});
  const [ecosystems, setEcosystems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentPage, searchTerm, roleFilter]);

  const checkPermissions = async () => {
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
      
      setCurrentUser(session.user);
      fetchUsers();
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/dashboard");
    }
  };

  const fetchUsers = async () => {
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
      
      if (roleFilter) {
        params.append('role', roleFilter);
      }

      // Fetch users with pagination and search
      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      
      setUsers(data.list || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      });

      // Fetch ecosystems (for assignment display)
      const ecosysRes = await fetch("/api/ecosystems");
      if (ecosysRes.ok) {
        const ecosysData = await ecosysRes.json();
        setEcosystems(ecosysData.list || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>User Management</h1>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Manage users and their access to the system
          </p>
        </div>
        <button 
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500',
            fontSize: '14px'
          }}
          onClick={() => router.push("/users/new")}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          Add User
        </button>
      </div>

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
            placeholder="Search by name, email, or Ecitizen ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              paddingLeft: '2.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#f9fafb'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }}>
            🔍
          </span>
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
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
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        
        <div style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          {pagination.total} users found
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8f9fa' }}>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', fontSize: '14px', color: '#374151' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', fontSize: '14px', color: '#374151' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', fontSize: '14px', color: '#374151' }}>Ecitizen ID</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', fontSize: '14px', color: '#374151' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', fontSize: '14px', color: '#374151' }}>Assigned Ecosystems</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', fontSize: '14px', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '1rem' }}>{user.name}</td>
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>{user.ecitizen_id || "-"}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '12px',
                        borderRadius: '9999px',
                        backgroundColor: user.role === 'admin' ? '#d4edda' : '#cfe2ff',
                        color: user.role === 'admin' ? '#155724' : '#084298'
                      }}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {user.userEcosystems && user.userEcosystems.length > 0 ? (
                          user.userEcosystems.map((ue: any) => (
                            <span
                              key={ue.ecosystem.id}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#e3f2fd',
                                color: '#1565c0',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {ue.ecosystem.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#999', fontSize: '12px' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link 
                          href={`/users/${user.id}/edit`}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            display: 'inline-block',
                            textDecoration: 'none',
                            color: '#666'
                          }}
                        >
                          ✏️
                        </Link>
                        <button style={{
                          padding: '0.5rem',
                          backgroundColor: '#fee',
                          border: '1px solid #fcc',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#c00'
                        }}
                        onClick={() => alert('Delete functionality not yet implemented')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>
      )}
    </div>
  );
}