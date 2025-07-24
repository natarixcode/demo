import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for form handling with validation and error management
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation rules for each field
 * @param {Function} onSubmit - Function to call when form is submitted
 * @returns {Object} - Form state and handlers
 */
export const useForm = (initialValues = {}, validationSchema = {}, onSubmit = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = validationSchema[name];
    if (!rules) return '';

    // Required validation
    if (rules.required) {
      // Handle different value types
      if (typeof value === 'boolean') {
        if (!value) {
          return typeof rules.required === 'string' ? rules.required : `${name} is required`;
        }
      } else if (typeof value === 'string') {
        if (!value || value.trim() === '') {
          return typeof rules.required === 'string' ? rules.required : `${name} is required`;
        }
      } else {
        if (!value) {
          return typeof rules.required === 'string' ? rules.required : `${name} is required`;
        }
      }
    }

    // Min length validation (string values only)
    if (rules.minLength && value && typeof value === 'string') {
      const minLength = typeof rules.minLength === 'object' ? rules.minLength.value : rules.minLength;
      const message = typeof rules.minLength === 'object' ? rules.minLength.message : `${name} must be at least ${minLength} characters`;
      
      if (value.length < minLength) {
        return message;
      }
    }

    // Max length validation (string values only)
    if (rules.maxLength && value && typeof value === 'string') {
      const maxLength = typeof rules.maxLength === 'object' ? rules.maxLength.value : rules.maxLength;
      const message = typeof rules.maxLength === 'object' ? rules.maxLength.message : `${name} must be no more than ${maxLength} characters`;
      
      if (value.length > maxLength) {
        return message;
      }
    }

    // Pattern validation (string values only)
    if (rules.pattern && value && typeof value === 'string') {
      const pattern = typeof rules.pattern === 'object' ? rules.pattern.value : rules.pattern;
      const message = typeof rules.pattern === 'object' ? rules.pattern.message : `${name} format is invalid`;
      
      if (pattern && typeof pattern.test === 'function' && !pattern.test(value)) {
        return message;
      }
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value, values);
      if (customError) return customError;
    }

    return '';
  }, [validationSchema, values]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField, validationSchema, values]);

  // Handle input change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Handle input blur (for touched state)
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationSchema).forEach(fieldName => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);

    // Validate form
    const isValid = validateForm();
    
    if (!isValid) {
      return;
    }

    if (onSubmit && typeof onSubmit === 'function') {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateForm, onSubmit, values, validationSchema]);

  // Check if form is valid (computed on demand)
  const isValid = useCallback(() => {
    return Object.keys(validationSchema).every(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      return !error;
    });
  }, [validateField, validationSchema, values]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Update values (useful for programmatic form updates)
  const updateValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Helper function to get field props for easier integration
  const getFieldProps = useCallback((name) => {
    const fieldError = touched[name] ? errors[name] : '';
    const fieldHasError = touched[name] && errors[name];
    
    return {
      // DOM props (safe to spread on input elements)
      name,
    value: values[name] || '',
      onChange: (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        handleChange(name, value);
      },
    onBlur: () => handleBlur(name),
      
      // Custom props (should be destructured separately, not spread on DOM elements)
      error: fieldError,
      hasError: fieldHasError
    };
  }, [values, errors, touched, handleChange, handleBlur]);

  // Note: Real-time validation is handled in handleChange and handleBlur
  // No useEffect needed to avoid infinite loops

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid: isValid,
    resetForm,
    validateForm,
    getFieldProps,
    setValues: updateValues
  };
};

/**
 * Validation schemas for common use cases
 */
export const validationSchemas = {
  // Email validation
  email: {
    required: 'Email is required',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return '';
    }
  },

  // Password validation
  password: {
    required: 'Password is required',
    minLength: 8,
    validate: (value) => {
      if (value && value.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return '';
    }
  },

  // Username validation
  username: {
    required: 'Username is required',
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    validate: (value) => {
      if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores';
      }
      return '';
    }
  },

  // Required field validation
  required: {
    required: true
  }
}; 