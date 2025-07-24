// App Component (src/App.jsx)
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import Navbar from "./components/Navbar";

// Lazy load components for better performance
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const PostDetails = lazy(() => import("./pages/PostDetails"));
const Community = lazy(() => import("./pages/Community"));
const Communities = lazy(() => import("./pages/Communities"));
const CreateCommunity = lazy(() => import("./pages/CreateCommunity"));
const CommunityDetail = lazy(() => import("./pages/CommunityDetail"));
const CreateSubClub = lazy(() => import("./pages/CreateSubClub"));
const CreateIndependentSubClub = lazy(() => import("./pages/CreateIndependentSubClub"));
const CreateCommunityPost = lazy(() => import("./pages/CreateCommunityPost"));
const SubClubDetail = lazy(() => import("./pages/SubClubDetail"));
const CreateSubClubPost = lazy(() => import("./pages/CreateSubClubPost"));
const UserProfile = lazy(() => import('./pages/UserProfile'));

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iosGray-50 via-white to-iosGray-100 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 animate-glass-fade-in">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Public Route Component
 * Redirects authenticated users away from auth pages
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iosGray-50 via-white to-iosGray-100 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 animate-glass-fade-in">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Loading Component for Suspense
 */
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-iosGray-50 via-white to-iosGray-100 flex items-center justify-center">
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-ios animate-fade-in">
      <LoadingSpinner size="lg" text="Loading page..." />
    </div>
  </div>
);

/**
 * Main App Component
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-iosGray-50 via-white to-iosGray-100">
          {/* iOS-style background pattern */}
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <Navbar />
            
            <main className="pt-16">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/post/:id" element={<PostDetails />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/communities/:id" element={<CommunityDetail />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  
                  {/* Auth Routes - Redirect if already authenticated */}
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    } 
                  />
                  
                  {/* Protected Routes - Require authentication */}
                  <Route 
                    path="/create-post" 
                    element={
                      <ProtectedRoute>
                        <CreatePost />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create-community" 
                    element={
                      <ProtectedRoute>
                        <CreateCommunity />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/communities/:communityId/create-subclub" 
                    element={
                      <ProtectedRoute>
                        <CreateSubClub />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create-subclub" 
                    element={
                      <ProtectedRoute>
                        <CreateIndependentSubClub />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/communities/:communityId/create-post" 
                    element={
                      <ProtectedRoute>
                        <CreateCommunityPost />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/sub-clubs/:subClubId" 
                    element={
                      <ProtectedRoute>
                        <SubClubDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/sub-clubs/:subClubId/create-post" 
                    element={
                      <ProtectedRoute>
                        <CreateSubClubPost />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
