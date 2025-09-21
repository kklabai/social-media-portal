"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditEcosystemPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ecosystem, setEcosystem] = useState({
    name: "",
    theme: "",
    description: "",
    active_status: true,
  });

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      loadEcosystem();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const loadEcosystem = async () => {
    try {
      const response = await fetch(`/api/ecosystems/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setEcosystem({
          name: data.name || "",
          theme: data.theme || "",
          description: data.description || "",
          active_status: data.active_status !== false,
        });
      }
    } catch (error) {
      console.error("Error loading ecosystem:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = params.id === 'new' ? 'POST' : 'PUT';
      const url = '/api/ecosystems';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ecosystem,
          id: params.id !== 'new' ? parseInt(params.id as string) : undefined,
        }),
      });

      if (response.ok) {
        router.push('/ecosystems');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save ecosystem');
      }
    } catch (error) {
      console.error("Error saving ecosystem:", error);
      alert('Failed to save ecosystem');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '400', marginBottom: '0.5rem' }}>
          {params.id === 'new' ? 'Create New Ecosystem' : 'Edit Ecosystem'}
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {params.id === 'new' 
            ? 'Create a new digital ecosystem for managing social media platforms' 
            : 'Update ecosystem details and settings'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            color: '#333'
          }}>
            Ecosystem Name *
          </label>
          <input
            type="text"
            required
            value={ecosystem.name}
            onChange={(e) => setEcosystem({ ...ecosystem, name: e.target.value })}
            placeholder="Enter ecosystem name"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            color: '#333'
          }}>
            Theme *
          </label>
          <input
            type="text"
            required
            value={ecosystem.theme}
            onChange={(e) => setEcosystem({ ...ecosystem, theme: e.target.value })}
            placeholder="e.g., Government, Education, Healthcare"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            color: '#333'
          }}>
            Description
          </label>
          <textarea
            value={ecosystem.description}
            onChange={(e) => setEcosystem({ ...ecosystem, description: e.target.value })}
            placeholder="Provide a brief description of this ecosystem"
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#f8f9fa',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500',
            color: '#333'
          }}>
            <input
              type="checkbox"
              checked={ecosystem.active_status}
              onChange={(e) => setEcosystem({ ...ecosystem, active_status: e.target.checked })}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            Active Status
          </label>
          <p style={{ marginLeft: '26px', fontSize: '13px', color: '#666', marginTop: '0.25rem' }}>
            Inactive ecosystems will not be accessible to users
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: '1px solid #eee'
        }}>
          <button
            type="button"
            onClick={() => router.push('/ecosystems')}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              color: '#666',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Ecosystem'}
          </button>
        </div>
      </form>
    </div>
  );
}