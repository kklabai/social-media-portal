"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ImportType = 'users' | 'ecosystems' | 'user-assignments' | null;

interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
}

export default function ImportPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ImportType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

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
    } catch (error) {
      console.error("Permission check failed:", error);
      router.push("/dashboard");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        alert("Please upload a CSV file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = async (type: ImportType) => {
    if (!type) return;
    
    try {
      const response = await fetch(`/api/import/template?type=${type}`);
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template");
    }
  };

  const handleImport = async () => {
    if (!file || !selectedType) return;

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', selectedType);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setFile(null);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Import failed: ' + (error as Error).message,
      });
    } finally {
      setImporting(false);
    }
  };

  const importTypes = [
    {
      type: 'users' as ImportType,
      title: 'Users',
      icon: '👥',
      description: 'Import user accounts with roles and details',
      fields: 'email, name, ecitizen_id, role'
    },
    {
      type: 'ecosystems' as ImportType,
      title: 'Ecosystems',
      icon: '🌐',
      description: 'Import ecosystem definitions',
      fields: 'name, theme, description, active_status'
    },
    {
      type: 'user-assignments' as ImportType,
      title: 'User Assignments',
      icon: '🔗',
      description: 'Assign users to ecosystems',
      fields: 'user_email, ecosystem_name, assigned_by_email'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/dashboard" 
          style={{ color: '#0066cc', textDecoration: 'none', fontSize: '14px' }}
        >
          ← Back to dashboard
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: '400', marginTop: '1rem', marginBottom: '0.5rem' }}>
          Data Import
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Import data from CSV files. Download templates to ensure correct format.
        </p>
      </div>

      {/* Import Type Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1rem' }}>
          1. Select Data Type
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {importTypes.map((item) => (
            <div
              key={item.type}
              onClick={() => {
                setSelectedType(item.type);
                setFile(null);
                setResult(null);
                // Smooth scroll to show new content
                setTimeout(() => {
                  window.scrollBy({ top: 300, behavior: 'smooth' });
                }, 100);
              }}
              style={{
                padding: '1.5rem',
                backgroundColor: selectedType === item.type ? '#e6f3ff' : 'white',
                border: `2px solid ${selectedType === item.type ? '#0066cc' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedType === item.type ? '0 4px 6px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                ':hover': {
                  borderColor: '#0066cc',
                  transform: 'translateY(-2px)'
                }
              }}
              onMouseEnter={(e) => {
                if (selectedType !== item.type) {
                  e.currentTarget.style.borderColor = '#0066cc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== item.type) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '0.5rem' }}>
                {item.description}
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                Fields: {item.fields}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Template Download */}
      {selectedType && (
        <div style={{ 
          marginBottom: '2rem',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1rem' }}>
            2. Download Template
          </h2>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ marginBottom: '1rem', fontSize: '14px', color: '#555' }}>
              Download the template CSV file to see the required format and prepare your data.
            </p>
            <button
              onClick={() => downloadTemplate(selectedType)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>⬇️</span>
              Download {importTypes.find(t => t.type === selectedType)?.title} Template
            </button>
          </div>
        </div>
      )}

      {/* File Upload */}
      {selectedType && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '1rem' }}>
            3. Upload CSV File
          </h2>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              backgroundColor: dragActive ? '#e6f3ff' : '#f8f9fa',
              padding: '3rem',
              borderRadius: '8px',
              border: `2px dashed ${dragActive ? '#0066cc' : '#d1d5db'}`,
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            
            {file ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📄</div>
                <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '0.5rem' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '1rem' }}>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => setFile(null)}
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
                  Remove File
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📤</div>
                <label 
                  htmlFor="csv-upload"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '1rem'
                  }}
                >
                  Choose File
                </label>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  or drag and drop your CSV file here
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import Button and Results */}
      {selectedType && file && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: importing ? '#6c757d' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              opacity: importing ? 0.6 : 1
            }}
          >
            {importing ? 'Importing...' : `Import ${importTypes.find(t => t.type === selectedType)?.title}`}
          </button>
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: result.success ? '#155724' : '#721c24',
            marginBottom: '0.5rem'
          }}>
            {result.success ? '✅ Import Successful' : '❌ Import Failed'}
          </h3>
          <p style={{
            fontSize: '14px',
            color: result.success ? '#155724' : '#721c24',
            marginBottom: result.imported ? '0.5rem' : 0
          }}>
            {result.message}
          </p>
          {result.imported && (
            <p style={{ fontSize: '14px', color: result.success ? '#155724' : '#721c24' }}>
              Imported {result.imported} records
            </p>
          )}
          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem' }}>Errors:</p>
              <ul style={{ marginLeft: '1.5rem', fontSize: '13px' }}>
                {result.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}