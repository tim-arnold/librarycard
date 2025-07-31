// Input validation utilities for API endpoints
// Prevents injection attacks and ensures data integrity

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: readonly string[];
  sanitize?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Email validation regex (RFC 5322 compliant subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Password strength validation
export function validatePasswordStrength(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long` };
  }
  if (!hasUpperCase) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumbers) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
  }

  return { isValid: true };
}

// Basic HTML/SQL injection sanitization
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/['";]/g, '') // Remove quotes and semicolons to prevent SQL injection
    .trim();
}

// Validate individual field based on rule
function validateField(value: any, rule: ValidationRule, fieldName: string): ValidationResult {
  // Check if required
  if (rule.required && (value === null || value === undefined || value === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // If not required and empty, skip further validation
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return { isValid: true, data: value };
  }

  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: `${fieldName} must be a string` };
        }
        break;
      case 'number':
        if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
          return { isValid: false, error: `${fieldName} must be a number` };
        }
        value = Number(value);
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: `${fieldName} must be a boolean` };
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
          return { isValid: false, error: `${fieldName} must be a valid email address` };
        }
        break;
      case 'uuid':
        if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
          return { isValid: false, error: `${fieldName} must be a valid UUID` };
        }
        break;
    }
  }

  // String-specific validations
  if (typeof value === 'string') {
    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${rule.minLength} characters long` };
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return { isValid: false, error: `${fieldName} cannot exceed ${rule.maxLength} characters` };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return { isValid: false, error: `${fieldName} format is invalid` };
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      return { isValid: false, error: `${fieldName} must be one of: ${rule.allowedValues.join(', ')}` };
    }

    // Sanitization
    if (rule.sanitize) {
      value = sanitizeString(value);
    }
  }

  return { isValid: true, data: value };
}

// Main validation function
export function validateInput(input: any, schema: ValidationSchema): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { isValid: false, error: 'Invalid input data' };
  }

  const validatedData: any = {};
  
  // Validate each field in schema
  for (const [fieldName, rule] of Object.entries(schema)) {
    const fieldResult = validateField(input[fieldName], rule, fieldName);
    
    if (!fieldResult.isValid) {
      return { isValid: false, error: fieldResult.error };
    }
    
    // Only include the field if it has a value or was provided
    if (fieldResult.data !== undefined || input.hasOwnProperty(fieldName)) {
      validatedData[fieldName] = fieldResult.data;
    }
  }

  // Check for unexpected fields (prevent injection of unwanted data)
  const allowedFields = Object.keys(schema);
  const providedFields = Object.keys(input);
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    return { 
      isValid: false, 
      error: `Unexpected fields: ${unexpectedFields.join(', ')}` 
    };
  }

  return { isValid: true, data: validatedData };
}

// Safe JSON parsing with validation
export async function parseAndValidateJSON(request: Request, schema: ValidationSchema): Promise<ValidationResult> {
  try {
    const data = await request.json();
    return validateInput(data, schema);
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' };
  }
}

// Common validation schemas
export const AuthSchemas = {
  register: {
    email: { required: true, type: 'email' as const, maxLength: 255 },
    password: { required: true, type: 'string' as const, minLength: 8, maxLength: 128 },
    first_name: { required: true, type: 'string' as const, minLength: 1, maxLength: 50, sanitize: true },
    last_name: { required: false, type: 'string' as const, maxLength: 50, sanitize: true },
    invitation_token: { required: false, type: 'string' as const, maxLength: 255 },
    turnstileToken: { required: false, type: 'string' as const, maxLength: 2048 }
  },
  login: {
    email: { required: true, type: 'email' as const, maxLength: 255 },
    password: { required: true, type: 'string' as const, minLength: 1, maxLength: 128 }
  },
  forgotPassword: {
    email: { required: true, type: 'email' as const, maxLength: 255 }
  },
  resetPassword: {
    token: { required: true, type: 'string' as const, minLength: 1, maxLength: 255 },
    password: { required: true, type: 'string' as const, minLength: 8, maxLength: 128 }
  },
  changePassword: {
    old_password: { required: true, type: 'string' as const, minLength: 1, maxLength: 128 },
    new_password: { required: true, type: 'string' as const, minLength: 8, maxLength: 128 }
  }
} as const;