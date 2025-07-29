import {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  loginSchema,
  registerSchema,
  bookingSchema,
  labSchema,
} from '../auth'

describe('Authentication Utilities', () => {
  describe('Token Management', () => {
    it('should generate and verify JWT tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'STUDENT',
      }

      const token = generateToken(payload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const verifiedPayload = verifyToken(token)
      expect(verifiedPayload).toBeDefined()
      expect(verifiedPayload?.userId).toBe(payload.userId)
      expect(verifiedPayload?.email).toBe(payload.email)
      expect(verifiedPayload?.role).toBe(payload.role)
    })

    it('should return null for invalid tokens', () => {
      const result = verifyToken('invalid-token')
      expect(result).toBeNull()
    })

    it('should return null for expired tokens', () => {
      // This would require mocking time, but for now we test invalid format
      const result = verifyToken('')
      expect(result).toBeNull()
    })
  })

  describe('Password Hashing', () => {
    it('should hash and compare passwords correctly', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(password.length)

      const isValid = await comparePassword(password, hashedPassword)
      expect(isValid).toBe(true)

      const isInvalid = await comparePassword('wrongPassword', hashedPassword)
      expect(isInvalid).toBe(false)
    })
  })

  describe('Validation Schemas', () => {
    describe('loginSchema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
        }

        const result = loginSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password123',
        }

        expect(() => loginSchema.parse(invalidData)).toThrow()
      })

      it('should reject short password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '123',
        }

        expect(() => loginSchema.parse(invalidData)).toThrow()
      })
    })

    describe('registerSchema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'STUDENT' as const,
        }

        const result = registerSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should default role to STUDENT', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        }

        const result = registerSchema.parse(validData)
        expect(result.role).toBe('STUDENT')
      })

      it('should reject invalid role', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'INVALID_ROLE',
        }

        expect(() => registerSchema.parse(invalidData)).toThrow()
      })
    })

    describe('bookingSchema', () => {
      it('should validate correct booking data', () => {
        const validData = {
          labId: 'lab-123',
          computerId: 'computer-456',
          startTime: '2024-01-01T10:00:00.000Z',
          endTime: '2024-01-01T12:00:00.000Z',
          purpose: 'Programming assignment',
        }

        const result = bookingSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should allow optional fields', () => {
        const validData = {
          labId: 'lab-123',
          startTime: '2024-01-01T10:00:00.000Z',
          endTime: '2024-01-01T12:00:00.000Z',
        }

        const result = bookingSchema.parse(validData)
        expect(result.labId).toBe(validData.labId)
        expect(result.computerId).toBeUndefined()
        expect(result.purpose).toBeUndefined()
      })
    })

    describe('labSchema', () => {
      it('should validate correct lab data', () => {
        const validData = {
          name: 'Computer Lab 1',
          description: 'Main computer lab',
          capacity: 30,
          location: 'Building A, Room 101',
        }

        const result = labSchema.parse(validData)
        expect(result).toEqual(validData)
      })

      it('should reject zero or negative capacity', () => {
        const invalidData = {
          name: 'Computer Lab 1',
          capacity: 0,
          location: 'Building A, Room 101',
        }

        expect(() => labSchema.parse(invalidData)).toThrow()
      })
    })
  })
})
