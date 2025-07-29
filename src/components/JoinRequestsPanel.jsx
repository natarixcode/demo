import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const JoinRequestsPanel = ({ communityId, currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const { execute } = useApi();

  useEffect(() => {
    fetchJoinRequests();
  }, [communityId]);

  const fetchJoinRequests = async () => {
    setIsLoading(true);
    try {
      const response = await execute(`/api/communities/${communityId}/join-requests`, {
        method: 'GET',
        headers: {
          'x-user-id': currentUser?.id || '1'
        }
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, action) => {
    setProcessingRequest(requestId);
    try {
      await execute(`/api/join-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '1'
        },
        body: JSON.stringify({ action })
      });
      
      // Remove the processed request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      alert(`Join request ${actionText} successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing join request:`, error);
      alert(`Failed to ${action} join request. Please try again.`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-slate-600">Loading join requests...</span>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No pending requests</h3>
          <p className="mt-1 text-sm text-slate-500">
            All join requests have been processed or no one has requested to join yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-900">Join Requests</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {request.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{request.username}</h4>
                    <p className="text-sm text-slate-500">{request.email}</p>
                  </div>
                </div>
                
                {request.message && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-md">
                    <p className="text-sm text-slate-700 italic">"{request.message}"</p>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-2">
                  Requested {formatDate(request.created_at)}
                </p>
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleRequestResponse(request.id, 'approve')}
                  disabled={processingRequest === request.id}
                  className="flex items-center space-x-1 bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {processingRequest === request.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>Approve</span>
                </button>
                
                <button
                  onClick={() => handleRequestResponse(request.id, 'reject')}
                  disabled={processingRequest === request.id}
                  className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {processingRequest === request.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinRequestsPanel; 