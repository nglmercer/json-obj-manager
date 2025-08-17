// tests/validation.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  DataValidator,
  DataTransformer,
  validators,
  schemas,
  type Schema,
  type ValidationResult
} from '../src/utils/validation.js';

describe('DataValidator', () => {
  describe('Basic validation', () => {
    it('should validate required fields', () => {
      const schema: Schema = {
        type: 'string',
        required: true
      };
      const validator = new DataValidator(schema);
      
      const result1 = validator.validate('test');
      expect(result1.isValid).toBe(true);
      expect(result1.errors).toHaveLength(0);
      
      const result2 = validator.validate(null);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('root: Required field is missing');
    });
    
    it('should validate types correctly', () => {
      const stringSchema: Schema = { type: 'string' };
      const numberSchema: Schema = { type: 'number' };
      const booleanSchema: Schema = { type: 'boolean' };
      const arraySchema: Schema = { type: 'array' };
      const objectSchema: Schema = { type: 'object' };
      
      const stringValidator = new DataValidator(stringSchema);
      const numberValidator = new DataValidator(numberSchema);
      const booleanValidator = new DataValidator(booleanSchema);
      const arrayValidator = new DataValidator(arraySchema);
      const objectValidator = new DataValidator(objectSchema);
      
      expect(stringValidator.validate('test').isValid).toBe(true);
      expect(stringValidator.validate(123).isValid).toBe(false);
      
      expect(numberValidator.validate(123).isValid).toBe(true);
      expect(numberValidator.validate('test').isValid).toBe(false);
      
      expect(booleanValidator.validate(true).isValid).toBe(true);
      expect(booleanValidator.validate('test').isValid).toBe(false);
      
      expect(arrayValidator.validate([1, 2, 3]).isValid).toBe(true);
      expect(arrayValidator.validate('test').isValid).toBe(false);
      
      expect(objectValidator.validate({ key: 'value' }).isValid).toBe(true);
      expect(objectValidator.validate('test').isValid).toBe(false);
    });
  });
  
  describe('String validation', () => {
    it('should validate string length', () => {
      const schema: Schema = {
        type: 'string',
        minLength: 3,
        maxLength: 10
      };
      const validator = new DataValidator(schema);
      
      expect(validator.validate('test').isValid).toBe(true);
      expect(validator.validate('ab').isValid).toBe(false);
      expect(validator.validate('this is too long').isValid).toBe(false);
    });
    
    it('should validate string patterns', () => {
      const schema: Schema = {
        type: 'string',
        pattern: /^[a-z]+$/
      };
      const validator = new DataValidator(schema);
      
      expect(validator.validate('test').isValid).toBe(true);
      expect(validator.validate('Test').isValid).toBe(false);
      expect(validator.validate('test123').isValid).toBe(false);
    });
  });
  
  describe('Number validation', () => {
    it('should validate number ranges', () => {
      const schema: Schema = {
        type: 'number',
        min: 0,
        max: 100
      };
      const validator = new DataValidator(schema);
      
      expect(validator.validate(50).isValid).toBe(true);
      expect(validator.validate(-1).isValid).toBe(false);
      expect(validator.validate(101).isValid).toBe(false);
    });
  });
  
  describe('Enum validation', () => {
    it('should validate enum values', () => {
      const schema: Schema = {
        type: 'string',
        enum: ['red', 'green', 'blue']
      };
      const validator = new DataValidator(schema);
      
      expect(validator.validate('red').isValid).toBe(true);
      expect(validator.validate('yellow').isValid).toBe(false);
    });
  });
  
  describe('Object validation', () => {
    it('should validate object properties', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          age: { type: 'number', min: 0 }
        }
      };
      const validator = new DataValidator(schema);
      
      const validObject = { name: 'John', age: 25 };
      expect(validator.validate(validObject).isValid).toBe(true);
      
      const invalidObject1 = { age: 25 }; // missing name
      expect(validator.validate(invalidObject1).isValid).toBe(false);
      
      const invalidObject2 = { name: 'John', age: -5 }; // invalid age
      expect(validator.validate(invalidObject2).isValid).toBe(false);
    });
  });
  
  describe('Array validation', () => {
    it('should validate array items', () => {
      const schema: Schema = {
        type: 'array',
        items: { type: 'number', min: 0 }
      };
      const validator = new DataValidator(schema);
      
      expect(validator.validate([1, 2, 3]).isValid).toBe(true);
      expect(validator.validate([1, -2, 3]).isValid).toBe(false);
      expect(validator.validate([1, 'two', 3]).isValid).toBe(false);
    });
  });
  
  describe('Custom validation', () => {
    it('should handle custom validators', () => {
      const schema: Schema = {
        type: 'string',
        custom: (value: string) => value.includes('@')
      };
      const validator = new DataValidator(schema);
      
      expect(validator.validate('test@example.com').isValid).toBe(true);
      expect(validator.validate('test').isValid).toBe(false);
    });
    
    it('should handle custom validators with error messages', () => {
      const schema: Schema = {
        type: 'string',
        custom: (value: string) => value.includes('@') ? true : 'Must contain @ symbol'
      };
      const validator = new DataValidator(schema);
      
      const result = validator.validate('test');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('root: Must contain @ symbol');
    });
  });
});

describe('DataTransformer', () => {
  describe('sanitize', () => {
    it('should remove dangerous keys', () => {
      const data = {
        name: 'John',
        __proto__: 'dangerous',
        constructor: 'dangerous',
        prototype: 'dangerous',
        safe: 'value'
      };
      
      const sanitized = DataTransformer.sanitize(data);
      expect(sanitized).toEqual({ name: 'John', safe: 'value' });
    });
    
    it('should filter by allowed keys', () => {
      const data = {
        name: 'John',
        age: 25,
        secret: 'hidden'
      };
      
      const sanitized = DataTransformer.sanitize(data, ['name', 'age']);
      expect(sanitized).toEqual({ name: 'John', age: 25 });
    });
    
    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          __proto__: 'dangerous'
        }
      };
      
      const sanitized = DataTransformer.sanitize(data);
      expect(sanitized).toEqual({ user: { name: 'John' } });
    });
  });
  
  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(DataTransformer.deepClone('test')).toBe('test');
      expect(DataTransformer.deepClone(123)).toBe(123);
      expect(DataTransformer.deepClone(true)).toBe(true);
      expect(DataTransformer.deepClone(null)).toBe(null);
    });
    
    it('should clone dates', () => {
      const date = new Date('2023-01-01');
      const cloned = DataTransformer.deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });
    
    it('should clone arrays', () => {
      const array = [1, 2, { nested: 'value' }];
      const cloned = DataTransformer.deepClone(array);
      
      expect(cloned).toEqual(array);
      expect(cloned).not.toBe(array);
      expect(cloned[2]).not.toBe(array[2]);
    });
    
    it('should clone objects', () => {
      const obj = {
        name: 'John',
        nested: { age: 25 }
      };
      const cloned = DataTransformer.deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.nested).not.toBe(obj.nested);
    });
  });
  
  describe('flatten and unflatten', () => {
    it('should flatten nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'New York'
          }
        },
        count: 5
      };
      
      const flattened = DataTransformer.flatten(obj);
      expect(flattened).toEqual({
        'user.name': 'John',
        'user.address.city': 'New York',
        'count': 5
      });
    });
    
    it('should unflatten objects', () => {
      const flattened = {
        'user.name': 'John',
        'user.address.city': 'New York',
        'count': 5
      };
      
      const unflattened = DataTransformer.unflatten(flattened);
      expect(unflattened).toEqual({
        user: {
          name: 'John',
          address: {
            city: 'New York'
          }
        },
        count: 5
      });
    });
    
    it('should handle custom separators', () => {
      const obj = { a: { b: 'value' } };
      const flattened = DataTransformer.flatten(obj, '', '_');
      expect(flattened).toEqual({ 'a_b': 'value' });
      
      const unflattened = DataTransformer.unflatten(flattened, '_');
      expect(unflattened).toEqual(obj);
    });
  });
  
  describe('serialization', () => {
    it('should convert to serializable format', () => {
      const date = new Date('2023-01-01');
      const regex = /test/gi;
      const func = function test() {};
      
      const data = {
        date,
        regex,
        func,
        normal: 'value'
      };
      
      const serialized = DataTransformer.toSerializable(data);
      expect(serialized.date).toEqual({ __type: 'Date', value: date.toISOString() });
      expect(serialized.regex).toEqual({ __type: 'RegExp', source: 'test', flags: 'gi' });
      expect(serialized.func).toEqual({ __type: 'Function', name: 'test' });
      expect(serialized.normal).toBe('value');
    });
    
    it('should restore from serializable format', () => {
      const serialized = {
        date: { __type: 'Date', value: '2023-01-01T00:00:00.000Z' },
        regex: { __type: 'RegExp', source: 'test', flags: 'gi' },
        func: { __type: 'Function', name: 'test' },
        normal: 'value'
      };
      
      const restored = DataTransformer.fromSerializable(serialized);
      expect(restored.date).toBeInstanceOf(Date);
      expect(restored.regex).toBeInstanceOf(RegExp);
      expect(restored.func).toBe(null); // Functions cannot be restored
      expect(restored.normal).toBe('value');
    });
  });
});

describe('Built-in validators', () => {
  describe('email validator', () => {
    it('should validate email addresses', () => {
      expect(validators.email('test@example.com')).toBe(true);
      expect(validators.email('user.name+tag@domain.co.uk')).toBe(true);
      expect(validators.email('invalid-email')).toBe(false);
      expect(validators.email('test@')).toBe(false);
      expect(validators.email('@example.com')).toBe(false);
    });
  });
  
  describe('url validator', () => {
    it('should validate URLs', () => {
      expect(validators.url('https://example.com')).toBe(true);
      expect(validators.url('http://localhost:3000')).toBe(true);
      expect(validators.url('ftp://files.example.com')).toBe(true);
      expect(validators.url('invalid-url')).toBe(false);
      expect(validators.url('http://')).toBe(false);
    });
  });
  
  describe('uuid validator', () => {
    it('should validate UUIDs', () => {
      expect(validators.uuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validators.uuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validators.uuid('invalid-uuid')).toBe(false);
      expect(validators.uuid('123e4567-e89b-12d3-a456')).toBe(false);
    });
  });
  
  describe('phoneNumber validator', () => {
    it('should validate phone numbers', () => {
      expect(validators.phoneNumber('+1234567890')).toBe(true);
      expect(validators.phoneNumber('1234567890')).toBe(true);
      expect(validators.phoneNumber('+1 (234) 567-890')).toBe(true);
      expect(validators.phoneNumber('123')).toBe(false);
      expect(validators.phoneNumber('abc1234567890')).toBe(false);
    });
  });
  
  describe('creditCard validator', () => {
    it('should validate credit card numbers', () => {
      expect(validators.creditCard('4111111111111111')).toBe(true);
      expect(validators.creditCard('4111 1111 1111 1111')).toBe(true);
      expect(validators.creditCard('4111-1111-1111-1111')).toBe(true);
      expect(validators.creditCard('411111111111111')).toBe(true); // 15 digits
      expect(validators.creditCard('4111111111111111111')).toBe(true); // 19 digits
      expect(validators.creditCard('411111111111')).toBe(false); // too short
      expect(validators.creditCard('41111111111111111111')).toBe(false); // too long (20 digits)
      expect(validators.creditCard('abc')).toBe(false);
    });
  });
  
  describe('strongPassword validator', () => {
    it('should validate strong passwords', () => {
      expect(validators.strongPassword('Password123!')).toBe(true);
      expect(validators.strongPassword('MyStr0ng@Pass')).toBe(true);
      expect(validators.strongPassword('password')).toBe(false); // no uppercase, number, special
      expect(validators.strongPassword('PASSWORD')).toBe(false); // no lowercase, number, special
      expect(validators.strongPassword('Password')).toBe(false); // no number, special
      expect(validators.strongPassword('Pass1!')).toBe(false); // too short
    });
  });
});

describe('Pre-defined schemas', () => {
  describe('user schema', () => {
    it('should validate user objects', () => {
      const validator = new DataValidator(schemas.user);
      
      const validUser = {
        id: 'user123',
        email: 'john@example.com',
        name: 'John Doe',
        age: 25
      };
      expect(validator.validate(validUser).isValid).toBe(true);
      
      const invalidUser = {
        id: 'user123',
        email: 'invalid-email',
        name: '',
        age: -5
      };
      const result = validator.validate(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('message schema', () => {
    it('should validate message objects', () => {
      const validator = new DataValidator(schemas.message);
      
      const validMessage = {
        role: 'user',
        content: 'Hello world',
        timestamp: '2023-01-01T00:00:00.000Z'
      };
      expect(validator.validate(validMessage).isValid).toBe(true);
      
      const invalidMessage = {
        role: 'invalid',
        content: ''
      };
      const result = validator.validate(invalidMessage);
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('stringMap schema', () => {
    it('should validate string map objects', () => {
      const validator = new DataValidator(schemas.stringMap);
      
      const validMap = {
        key1: 'value1',
        key2: 'value2'
      };
      expect(validator.validate(validMap).isValid).toBe(true);
      
      expect(validator.validate('not an object').isValid).toBe(false);
    });
  });
});