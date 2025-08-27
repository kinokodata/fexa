'use client';

import { useState, useEffect } from 'react';
import { HealthStatus as HealthStatusType } from '../types/api';
import { apiClient } from '../services/api';

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHealth(showDetails);
      if (response.success && response.data) {
        setHealth(response.data);
      }
    } catch (error) {
      console.error('ヘルスチェックに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = async () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    
    if (newShowDetails) {
      // 詳細情報を取得
      const response = await apiClient.getHealth(true);
      if (response.success && response.data) {
        setHealth(response.data);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '0.75rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '0.25rem', 
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        APIサーバー接続確認中...
      </div>
    );
  }

  if (!health) {
    return (
      <div style={{ 
        padding: '0.75rem', 
        backgroundColor: '#f8d7da', 
        borderRadius: '0.25rem', 
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: '#721c24'
      }}>
        ⚠️ APIサーバーに接続できません
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'unhealthy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '0.25rem', 
      marginBottom: '1rem',
      border: `2px solid ${getStatusColor(health.status)}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>
            {getStatusIcon(health.status)}
          </span>
          <span style={{ fontWeight: 'bold', color: getStatusColor(health.status) }}>
            APIサーバー: {health.status.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>
            ({health.environment})
          </span>
        </div>
        
        <button
          onClick={toggleDetails}
          style={{ 
            background: 'none', 
            border: '1px solid #ccc', 
            borderRadius: '0.25rem',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          {showDetails ? '詳細を隠す' : '詳細を表示'}
        </button>
      </div>

      {showDetails && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>タイムスタンプ:</strong> {new Date(health.timestamp).toLocaleString('ja-JP')}
          </div>
          
          {health.database && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>データベース:</strong>{' '}
              <span style={{ color: getStatusColor(health.database.status) }}>
                {getStatusIcon(health.database.status)} {health.database.status}
              </span>
              {health.database.error && (
                <div style={{ fontSize: '0.8rem', color: '#dc3545', marginLeft: '1rem' }}>
                  エラー: {health.database.error}
                </div>
              )}
            </div>
          )}

          {health.storage && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>ストレージ:</strong>{' '}
              <span style={{ color: getStatusColor(health.storage.status) }}>
                {getStatusIcon(health.storage.status)} {health.storage.status}
              </span>
              {health.storage.error && (
                <div style={{ fontSize: '0.8rem', color: '#dc3545', marginLeft: '1rem' }}>
                  エラー: {health.storage.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}