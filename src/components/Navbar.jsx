// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, icon, external = false }) => {
    const isActive = isActivePath(to);
    const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/40 hover:backdrop-blur-lg";
    const activeClasses = isActive ? "bg-white/40 backdrop-blur-lg shadow-inner text-iosBlue" : "text-iosGray-700 hover:text-iosGray-900";
    
    if (external) {
      return (
        <a href={to} className={`${baseClasses} ${activeClasses}`}>
          {icon && <span className="text-lg">{icon}</span>}
          <span>{children}</span>
        </a>
      );
    }

    return (
      <Link to={to} className={`${baseClasses} ${activeClasses}`}>
        {icon && <span className="text-lg">{icon}</span>}
        <span>{children}</span>
      </Link>
    );
  };

  const ProfileDropdown = () => (
    <div className={`absolute right-0 top-full mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-ios-lg border border-white/20 overflow-hidden transition-all duration-200 ${isProfileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
      {/* User Info */}
      <div className="p-4 border-b border-iosGray-200/30">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-iosBlue to-iosPurple rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-iosGray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-iosGray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <Link
          to={`/user/${user?.id}`}
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-iosGray-100/50 transition-colors duration-150"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <span className="text-iosGray-600">👤</span>
          <span className="text-sm font-medium text-iosGray-700">Profile</span>
        </Link>
        
        <Link
          to="/create-community"
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-iosGray-100/50 transition-colors duration-150"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <span className="text-iosGray-600">🏘️</span>
          <span className="text-sm font-medium text-iosGray-700">Create Community</span>
        </Link>

        <Link
          to="/create-subclub"
          className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-iosGray-100/50 transition-colors duration-150"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <span className="text-iosGray-600">🎯</span>
          <span className="text-sm font-medium text-iosGray-700">Create Sub-Club</span>
        </Link>

        <div className="border-t border-iosGray-200/30 my-2"></div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-iosRed/10 transition-colors duration-150 text-left"
        >
          <span className="text-iosRed">🚪</span>
          <span className="text-sm font-medium text-iosRed">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-glass-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-iosBlue to-iosPurple rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-iosBlue to-iosPurple bg-clip-text text-transparent">
                Natarix
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <NavLink to="/" icon="🏠">Home</NavLink>
              <NavLink to="/communities" icon="🏘️">Communities</NavLink>
              {isAuthenticated && (
                <NavLink to="/create-post" icon="✍️">Create Post</NavLink>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-white/40 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-iosBlue to-iosPurple rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <svg 
                      className={`w-4 h-4 text-iosGray-600 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <ProfileDropdown />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-iosGray-700 hover:text-iosBlue transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-iosBlue text-white text-sm font-medium rounded-xl hover:bg-iosBlue/90 transition-all duration-200 shadow-ios"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-white/40 transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-iosGray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-ios-lg animate-slide-up">
            <div className="px-4 py-6 space-y-2">
              <NavLink to="/" icon="🏠">Home</NavLink>
              <NavLink to="/communities" icon="🏘️">Communities</NavLink>
              {isAuthenticated && (
                <NavLink to="/create-post" icon="✍️">Create Post</NavLink>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay for profile dropdown */}
      {isProfileMenuOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsProfileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;