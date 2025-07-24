// src/components/CheckDBButton.jsx - Database Connectivity Test Component
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CheckDBButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetry, setAutoRetry] = useState(false);
  const [lastTestTime, setLastTestTime] = useState(null);

  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  // Auto-retry logic
  useEffect(() => {
    let retryTimeout;
    
    if (autoRetry && retryCount < maxRetries && connectionStatus?.status === 'error') {
      retryTimeout = setTimeout(() => {
        testDatabaseConnection();
      }, retryDelay);
    }
    
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [autoRetry, retryCount, connectionStatus]);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Call backend API to test database connection
      const response = await fetch('http://localhost:3001/api/test-db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      const testDuration = Date.now() - startTime;
      
      setConnectionStatus({
        ...data,
        clientTestTime: `${testDuration}ms`
      });
      setLastTestTime(new Date().toLocaleTimeString());
      
      if (data.status === 'success') {
        // Success toast
        toast.success(
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Database Connected!</p>
              <p className="text-sm text-gray-500">Response time: {data.requestTime}</p>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        
        setRetryCount(0);
        setAutoRetry(false);
        
      } else {
        // Error toast
        toast.error(
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Connection Failed</p>
              <p className="text-sm text-gray-500">{data.message}</p>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        
        if (autoRetry && retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
        }
      }
      
    } catch (error) {
      console.error('Frontend error testing database:', error);
      
      setConnectionStatus({
        status: 'error',
        message: 'Failed to reach backend server',
        error: { message: error.message }
      });
      
      toast.error(
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Network Error</p>
            <p className="text-sm text-gray-500">Cannot reach backend server</p>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 7000,
        }
      );
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryToggle = () => {
    setAutoRetry(!autoRetry);
    setRetryCount(0);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <ToastContainer />
      
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Database Connectivity Test
        </h2>
        <p className="text-gray-600">
          Test your PostgreSQL connection and monitor database health
        </p>
      </div>

      {/* Main Test Button */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={testDatabaseConnection}
          disabled={isLoading}
          className={`
            relative px-8 py-4 rounded-lg font-semibold text-white text-lg
            transition-all duration-300 transform hover:scale-105 active:scale-95
            ${isLoading 
              ? 'bg-gradient-to-r from-blue-400 to-purple-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Testing Connection...</span>
              {autoRetry && retryCount > 0 && (
                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                  Retry {retryCount}/{maxRetries}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 2a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Test Database Connection</span>
            </div>
          )}
        </button>

        {/* Auto-retry toggle */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoRetry}
              onChange={handleRetryToggle}
              className="sr-only"
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${autoRetry ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${autoRetry ? 'transform translate-x-5' : ''}`}></div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">Auto-retry on failure</span>
          </label>
        </div>
      </div>

      {/* Connection Status Display */}
      {connectionStatus && (
        <div className={`mt-6 p-4 rounded-lg border-l-4 ${
          connectionStatus.status === 'success' 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {connectionStatus.status === 'success' ? (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                connectionStatus.status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionStatus.message}
              </h3>
              {lastTestTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Last tested: {lastTestTime}
                </p>
              )}
              
              {/* Success Details */}
              {connectionStatus.status === 'success' && connectionStatus.database && (
                <div className="mt-2 space-y-1 text-xs text-green-700">
                  <p>⏱️ Response Time: {connectionStatus.requestTime}</p>
                  <p>🔗 Connection Time: {connectionStatus.database.connectionTime}</p>
                  <p>📊 Pool Status: {connectionStatus.database.poolInfo?.totalCount} total, {connectionStatus.database.poolInfo?.idleCount} idle</p>
                </div>
              )}
              
              {/* Error Details */}
              {connectionStatus.status === 'error' && connectionStatus.database?.error && (
                <div className="mt-2 space-y-1 text-xs text-red-700">
                  <p>❌ Error: {connectionStatus.database.error.message}</p>
                  {connectionStatus.database.error.hint && (
                    <p>💡 Hint: {connectionStatus.database.error.hint}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Connection Details</h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Host:</span> localhost
          </div>
          <div>
            <span className="font-medium">Port:</span> 5432
          </div>
          <div>
            <span className="font-medium">Database:</span> notorix
          </div>
          <div>
            <span className="font-medium">User:</span> postgres
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckDBButton; 