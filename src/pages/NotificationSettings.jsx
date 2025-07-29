// src/pages/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * Notification Settings Page
 * Allows users to manage their notification preferences with iOS 17 design
 */
const NotificationSettings = () => {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    allow_comment: true,
    allow_reply: true,
    allow_join: true,
    allow_like: true,
    allow_mention: true,
    allow_follow: true,
    allow_community_invite: true,
    email_notifications: false,
    push_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current preferences
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/notifications/preferences', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      } else {
        console.error('Failed to fetch preferences');
        toast.error('Failed to load notification preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Network error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  // Handle preference change
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('http://localhost:3001/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          ...getAuthHeader()
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Notification preferences saved successfully! ✅');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Network error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  // Toggle component
  const Toggle = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
        ${enabled 
          ? 'bg-blue-500' 
          : 'bg-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  // Notification type configuration
  const notificationTypes = [
    {
      key: 'allow_comment',
      title: 'Comments',
      description: 'When someone comments on your posts',
      icon: '💬'
    },
    {
      key: 'allow_reply',
      title: 'Replies',
      description: 'When someone replies to your comments',
      icon: '💭'
    },
    {
      key: 'allow_join',
      title: 'Community Joins',
      description: 'When someone joins your communities',
      icon: '👋'
    },
    {
      key: 'allow_like',
      title: 'Likes',
      description: 'When someone likes your posts',
      icon: '⭐'
    },
    {
      key: 'allow_mention',
      title: 'Mentions',
      description: 'When someone mentions you in posts or comments',
      icon: '@️⃣'
    },
    {
      key: 'allow_follow',
      title: 'Followers',
      description: 'When someone starts following you',
      icon: '👤'
    },
    {
      key: 'allow_community_invite',
      title: 'Community Invites',
      description: 'When someone invites you to join a community',
      icon: '📨'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-xl mb-6 w-3/4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 hover:scale-105 transition-all duration-200"
            >
              <span>←</span>
              <span className="font-medium text-gray-900">Back</span>
            </button>
            
            <h1 className="text-xl font-bold text-gray-900">
              🔔 Notification Settings
            </h1>
            
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Settings Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Manage Your Notifications
            </h2>
            <p className="text-gray-600">
              Choose which notifications you want to receive to stay updated on what matters to you.
            </p>
          </div>

          {/* In-App Notifications Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📱 In-App Notifications
            </h3>
            
            <div className="space-y-4">
              {notificationTypes.map((type) => (
                <div 
                  key={type.key}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/30 hover:bg-white/70 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {type.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {type.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  
                  <Toggle
                    enabled={preferences[type.key]}
                    onChange={(value) => handlePreferenceChange(type.key, value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Methods Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📬 Delivery Methods
            </h3>
            
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/30 hover:bg-white/70 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">📧</div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Email Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email (Coming Soon)
                    </p>
                  </div>
                </div>
                
                <Toggle
                  enabled={preferences.email_notifications}
                  onChange={(value) => handlePreferenceChange('email_notifications', value)}
                  disabled={true}
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/30 hover:bg-white/70 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">🔔</div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Browser Notifications
                    </h4>
                    <p className="text-sm text-gray-600">
                      Show notifications in your browser (Coming Soon)
                    </p>
                  </div>
                </div>
                
                <Toggle
                  enabled={preferences.push_notifications}
                  onChange={(value) => handlePreferenceChange('push_notifications', value)}
                  disabled={true}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⚡ Quick Actions
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const allEnabled = Object.fromEntries(
                    notificationTypes.map(type => [type.key, true])
                  );
                  setPreferences(prev => ({ ...prev, ...allEnabled }));
                }}
                className="p-4 bg-green-50 border border-green-200 rounded-2xl hover:bg-green-100 transition-all duration-200 text-green-800 font-medium"
              >
                ✅ Enable All
              </button>
              
              <button
                onClick={() => {
                  const allDisabled = Object.fromEntries(
                    notificationTypes.map(type => [type.key, false])
                  );
                  setPreferences(prev => ({ ...prev, ...allDisabled }));
                }}
                className="p-4 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-all duration-200 text-red-800 font-medium"
              >
                ❌ Disable All
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </div>
              ) : (
                '💾 Save Preferences'
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50/50 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/30">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            💡 Need Help?
          </h4>
          <p className="text-blue-800 text-sm">
            You can change these settings anytime. Notifications help you stay connected with your communities and conversations.
          </p>
        </div>
      </main>
    </div>
  );
};

export default NotificationSettings; 