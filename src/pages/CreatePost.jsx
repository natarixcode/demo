// src/pages/CreatePost.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePost, useDraftManager } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useForm, validationSchemas } from "../hooks/useForm";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';

/**
 * Enhanced Create Post Page Component with Draft Support
 * Features:
 * - Rich text editing capabilities
 * - Form validation with custom hooks
 * - Auto-save functionality for drafts
 * - Preview mode
 * - Responsive design
 * - Real API integration
 */
const CreatePost = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Form validation schema
  const validationSchema = {
    title: {
      required: 'Title is required',
      minLength: 5,
      maxLength: 200
    },
    content: {
      required: 'Content is required',
      minLength: 10
    }
  };

  // Initialize form with custom hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit: handleFormSubmit,
    getFieldProps,
    isValid
  } = useForm(
    {
      title: '',
      content: '',
      category: '',
      tags: ''
    },
    validationSchema
  );

  // API hooks
  const { execute: createPost, loading: createLoading } = useCreatePost();
  const { saveDraft, loading: draftLoading } = useDraftManager(user?.id);

  // Get field props once to avoid multiple calls
  const titleProps = getFieldProps('title');
  const contentProps = getFieldProps('content');
  const categoryProps = getFieldProps('category');
  const tagsProps = getFieldProps('tags');

  // Form submission handlers
  const handlePublish = async (formValues) => {
    try {
      const result = await createPost({
        title: formValues.title,
        content: formValues.content,
        author: user.id,
        is_draft: false
      });

      if (result.success) {
        toast.success('Post published successfully!');
        navigate(`/post/${result.data.data.id}`);
      } else {
        toast.error(result.error || 'Failed to publish post');
      }
    } catch (error) {
      toast.error('Error publishing post');
      console.error('Error creating post:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!values.title && !values.content) {
      toast.warning('Please add some content before saving draft');
      return;
    }

    try {
      const result = await saveDraft({
        title: values.title || 'Untitled Draft',
        content: values.content || '',
        author: user.id
      });

      if (result.success) {
        toast.success('Draft saved successfully!');
        setAutoSaveStatus('Saved');
      } else {
        toast.error(result.error || 'Failed to save draft');
      }
    } catch (error) {
      toast.error('Error saving draft');
      console.error('Error saving draft:', error);
    }
  };

  // Auto-save functionality
  React.useEffect(() => {
    if (values.title || values.content) {
      const timer = setTimeout(() => {
        setAutoSaveStatus('Auto-saving...');
        handleSaveDraft();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [values.title, values.content]);

  // Handle form submission for publish
  const handleFormSubmitWrapper = async (e) => {
    e.preventDefault();
    
    // Validate the form first
    if (!isValid()) {
      return;
    }
    
    // Call the publish handler with form values
    await handlePublish(values);
  };

  const formatPreviewContent = (content) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2">
        {line}
      </p>
    ));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 hover:scale-105 transition-all duration-200"
            >
              <span>←</span>
              <span className="font-medium text-gray-900">Back</span>
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              {autoSaveStatus && (
                <span className="text-sm text-gray-600">{autoSaveStatus}</span>
              )}
              
              {/* Preview toggle */}
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20 hover:scale-105 transition-all duration-200"
              >
                <span>{isPreviewMode ? '📝' : '👁️'}</span>
                <span className="font-medium text-gray-900">
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-24 px-4 max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-6 animate-glass-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {isPreviewMode ? 'Preview Post' : 'Create New Post'}
          </h1>

          {!isPreviewMode ? (
            /* Edit Mode */
            <form onSubmit={handleFormSubmitWrapper} className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title *
                </label>
                <input
                  name={titleProps.name}
                  value={titleProps.value}
                  onChange={titleProps.onChange}
                  onBlur={titleProps.onBlur}
                  type="text"
                  placeholder="Enter your post title..."
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all duration-200"
                />
                {touched.title && errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Content *
                </label>
                <textarea
                  name={contentProps.name}
                  value={contentProps.value}
                  onChange={contentProps.onChange}
                  onBlur={contentProps.onBlur}
                  placeholder="Share your thoughts..."
                  rows="12"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all duration-200 resize-none"
                />
                {touched.content && errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>

              {/* Category Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Category
                </label>
                <select
                  name={categoryProps.name}
                  value={categoryProps.value}
                  onChange={categoryProps.onChange}
                  onBlur={categoryProps.onBlur}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all duration-200"
                >
                  <option value="">Select a category...</option>
                  <option value="general">General</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="gaming">Gaming</option>
                  <option value="science">Science</option>
                  <option value="technology">Technology</option>
                </select>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tags
                </label>
                <input
                  name={tagsProps.name}
                  value={tagsProps.value}
                  onChange={tagsProps.onChange}
                  onBlur={tagsProps.onBlur}
                  type="text"
                  placeholder="Enter tags separated by commas..."
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 outline-none transition-all duration-200"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Separate tags with commas (e.g., react, javascript, tutorial)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={draftLoading || (!values.title && !values.content)}
                  className="btn-secondary px-6 py-3 disabled:opacity-50"
                >
                  {draftLoading ? 'Saving...' : 'Save Draft'}
                </button>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || createLoading || !values.title.trim() || !values.content.trim()}
                    className="btn-primary px-8 py-3 disabled:opacity-50"
                  >
                    {createLoading ? 'Publishing...' : 'Publish Post'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Preview Mode */
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {values.title || 'Untitled Post'}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>By {user?.username}</span>
                  <span>•</span>
                  <span>Just now</span>
                  {values.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{values.category}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div className="prose prose-lg max-w-none">
                {values.content ? (
                  <div className="text-gray-800 leading-relaxed">
                    {formatPreviewContent(values.content)}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No content to preview</p>
                )}
              </div>

              {/* Preview Tags */}
              {values.tags && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  {values.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Preview Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveDraft}
                  disabled={draftLoading}
                  className="btn-secondary px-6 py-3 disabled:opacity-50"
                >
                  {draftLoading ? 'Saving...' : 'Save Draft'}
                </button>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsPreviewMode(false)}
                    className="text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={() => handlePublish(values)}
                    disabled={!isValid || createLoading || !values.title.trim() || !values.content.trim()}
                    className="btn-primary px-8 py-3 disabled:opacity-50"
                  >
                    {createLoading ? 'Publishing...' : 'Publish Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatePost;