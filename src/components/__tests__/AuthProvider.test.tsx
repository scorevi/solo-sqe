import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider, useAuth } from '../AuthProvider'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Test component that uses the auth hook
const TestComponent = () => {
  const { user, token, login, register, logout, isLoading } = useAuth()

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password')
    } catch (loginError) {
      // Handle login error silently for testing
      console.error('Login failed:', loginError)
    }
  }

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? user.name : 'no user'}</div>
      <div data-testid="token">{token || 'no token'}</div>
      <button onClick={handleLogin}>
        Login
      </button>
      <button onClick={() => register('Test User', 'test@example.com', 'password')}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should render children and provide auth context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(screen.getByTestId('token')).toHaveTextContent('no token')
  })

  it('should load user from localStorage on mount', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      createdAt: '2024-01-01',
    }
    const mockToken = 'mock-token'

    mockLocalStorage.getItem
      .mockReturnValueOnce(mockToken)
      .mockReturnValueOnce(JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    expect(screen.getByTestId('token')).toHaveTextContent('mock-token')
  })

  it('should handle login successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      createdAt: '2024-01-01',
    }
    const mockToken = 'mock-token'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        token: mockToken,
        message: 'Login successful',
      }),
    } as Response)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      expect(screen.getByTestId('token')).toHaveTextContent('mock-token')
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
  })

  it('should handle login failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Invalid credentials',
      }),
    } as Response)

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error))
    })

    // The error should be thrown and caught by the component
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(screen.getByTestId('token')).toHaveTextContent('no token')

    consoleSpy.mockRestore()
  })

  it('should handle registration successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      createdAt: '2024-01-01',
    }
    const mockToken = 'mock-token'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        token: mockToken,
        message: 'User registered successfully',
      }),
    } as Response)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Register'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      expect(screen.getByTestId('token')).toHaveTextContent('mock-token')
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
  })

  it('should handle logout', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      createdAt: '2024-01-01',
    }

    mockLocalStorage.getItem
      .mockReturnValueOnce('mock-token')
      .mockReturnValueOnce(JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // User should be loaded from localStorage
    expect(screen.getByTestId('user')).toHaveTextContent('Test User')

    fireEvent.click(screen.getByText('Logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(screen.getByTestId('token')).toHaveTextContent('no token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('should throw error when useAuth is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
