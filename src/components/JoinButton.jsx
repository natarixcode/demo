import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

const JoinButton = ({ community, currentUser, onJoinSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);
  const { execute } = useApi();

  const isPrivate = community.visibility === 'private';
  const hasPendingRequest = community.has_pending_request;
  const canViewContent = community.can_view_content;
  const isAlreadyMember = canViewContent && isPrivate;

  const handleJoinPublic = async () => {
    setIsLoading(true);
    try {
      await execute(`/api/communities/${community.id}/join`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser?.id || '1'
        }
      });
      onJoinSuccess?.();
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!showMessageInput) {
      setShowMessageInput(true);
      return;
    }

    setIsLoading(true);
    try {
      await execute('/api/join-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '1'
        },
        body: JSON.stringify({
          communityId: community.id,
          message: requestMessage
        })
      });
      
      alert('Join request sent successfully! The community admin will review your request.');
      setShowMessageInput(false);
      setRequestMessage('');
      onJoinSuccess?.();
    } catch (error) {
      console.error('Error sending join request:', error);
      alert(error.message || 'Failed to send join request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already a member
  if (isAlreadyMember) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Member</span>
      </div>
    );
  }

  // If private community and has pending request
  if (isPrivate && hasPendingRequest) {
    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Request Pending</span>
      </div>
    );
  }

  // Private community - show request to join
  if (isPrivate) {
    return (
      <div className="space-y-3">
        {!showMessageInput ? (
          <button
            onClick={handleRequestToJoin}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Request to Join</span>
          </button>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message to Admin (Optional)
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Tell the admin why you'd like to join this private community..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleRequestToJoin}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </button>
              <button
                onClick={() => {
                  setShowMessageInput(false);
                  setRequestMessage('');
                }}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Public community - direct join
  return (
    <button
      onClick={handleJoinPublic}
      disabled={isLoading}
      className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
      <span>{isLoading ? 'Joining...' : 'Join Community'}</span>
    </button>
  );
};

export default JoinButton; 