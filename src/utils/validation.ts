// src/utils/validation.ts
import type { AllowedData } from '../core/types.js';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Schema definition for validation
export interface Schema {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  properties?: Record<string, Schema>;
  items?: Schema;
  custom?: (value: any) => boolean | string;
}

// Data validator class
export class DataValidator {
  private schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  validate(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    this.validateValue(data, this.schema, 'root', result);
    result.isValid = result.errors.length === 0;

    return result;
  }

  private validateValue(value: any, schema: Schema, path: string, result: ValidationResult): void {
    // Check required
    if (schema.required && (value === null || value === undefined)) {
      result.errors.push(`${path}: Required field is missing`);
      return;
    }

    // Skip validation if value is null/undefined and not required
    if (value === null || value === undefined) {
      return;
    }

    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        result.errors.push(`${path}: Expected ${schema.type}, got ${actualType}`);
        return;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        result.errors.push(`${path}: String too short (min: ${schema.minLength})`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        result.errors.push(`${path}: String too long (max: ${schema.maxLength})`);
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        result.errors.push(`${path}: String does not match pattern`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        result.errors.push(`${path}: Number too small (min: ${schema.min})`);
      }
      if (schema.max !== undefined && value > schema.max) {
        result.errors.push(`${path}: Number too large (max: ${schema.max})`);
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      result.errors.push(`${path}: Value not in allowed enum: ${schema.enum.join(', ')}`);
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        this.validateValue(value[key], propSchema, `${path}.${key}`, result);
      }
    }

    // Array validation
    if (schema.type === 'array' && schema.items) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          this.validateValue(item, schema.items!, `${path}[${index}]`, result);
        });
      }
    }

    // Custom validation
    if (schema.custom) {
      const customResult = schema.custom(value);
      if (customResult === false) {
        result.errors.push(`${path}: Custom validation failed`);
      } else if (typeof customResult === 'string') {
        result.errors.push(`${path}: ${customResult}`);
      }
    }
  }
}

// Data transformation utilities
export class DataTransformer {
  // Sanitize data by removing unsafe properties
  static sanitize(data: any, allowedKeys?: string[]): any {
    if (data === null || data === undefined || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, allowedKeys));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip dangerous keys
      if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // If allowedKeys is specified, only include those keys
      if (allowedKeys && !allowedKeys.includes(key)) {
        continue;
      }

      sanitized[key] = this.sanitize(value, allowedKeys);
    }

    return sanitized;
  }

  // Deep clone data
  static deepClone<T>(data: T): T {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Date) {
      return new Date(data.getTime()) as unknown as T;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const [key, value] of Object.entries(data)) {
      (cloned as any)[key] = this.deepClone(value);
    }

    return cloned;
  }

  // Flatten nested object
  static flatten(obj: any, prefix: string = '', separator: string = '.'): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flatten(value, newKey, separator));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  // Unflatten object
  static unflatten(obj: Record<string, any>, separator: string = '.'): any {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split(separator);
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;
    }

    return result;
  }

  // Convert data to serializable format
  static toSerializable(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      return { __type: 'Date', value: data.toISOString() };
    }

    if (data instanceof RegExp) {
      return { __type: 'RegExp', source: data.source, flags: data.flags };
    }

    if (typeof data === 'function') {
      return { __type: 'Function', name: data.name };
    }

    if (Array.isArray(data)) {
      return data.map(item => this.toSerializable(item));
    }

    if (typeof data === 'object') {
      const serialized: any = {};
      for (const [key, value] of Object.entries(data)) {
        serialized[key] = this.toSerializable(value);
      }
      return serialized;
    }

    return data;
  }

  // Restore data from serializable format
  static fromSerializable(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.fromSerializable(item));
    }

    if (typeof data === 'object' && data.__type) {
      switch (data.__type) {
        case 'Date':
          return new Date(data.value);
        case 'RegExp':
          return new RegExp(data.source, data.flags);
        case 'Function':
          return null; // Functions cannot be restored
        default:
          return data;
      }
    }

    if (typeof data === 'object') {
      const restored: any = {};
      for (const [key, value] of Object.entries(data)) {
        restored[key] = this.fromSerializable(value);
      }
      return restored;
    }

    return data;
  }
}

// Utility functions for common validations
export const validators = {
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  phoneNumber: (value: string): boolean => {
    const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
    return phoneRegex.test(value.replace(/[\s()-]/g, ''));
  },

  creditCard: (value: string): boolean => {
    const ccRegex = /^[0-9]{13,19}$/;
    return ccRegex.test(value.replace(/[\s-]/g, ''));
  },

  strongPassword: (value: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(value);
  }
};

// Pre-defined schemas for common data types
export const schemas = {
  user: {
    type: 'object' as const,
    required: true,
    properties: {
      id: { type: 'string' as const, required: true },
      email: { type: 'string' as const, required: true, custom: validators.email },
      name: { type: 'string' as const, required: true, minLength: 1, maxLength: 100 },
      age: { type: 'number' as const, min: 0, max: 150 }
    }
  },

  message: {
    type: 'object' as const,
    required: true,
    properties: {
      role: { type: 'string' as const, required: true, enum: ['user', 'assistant'] },
      content: { type: 'string' as const, required: true, minLength: 1 },
      timestamp: { type: 'string' as const }
    }
  },

  stringMap: {
    type: 'object' as const,
    required: true
  }
};