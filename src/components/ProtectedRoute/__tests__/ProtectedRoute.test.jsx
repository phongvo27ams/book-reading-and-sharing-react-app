import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'

// Mock useAuth and useNavigate
vi.mock('../../../provider/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

// Import mocked functions
import { useAuth } from '../../../provider/AuthContext'
import { useNavigate } from 'react-router-dom'

describe('ProtectedRoute', () => {
  const navigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(navigate)
  })

  it('SHOULD show loading while checking access', () => {
    useAuth.mockReturnValue({
      authenticated: false,
      jwt: null,
      loading: true,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText(/Đang kiểm tra quyền truy cập/i)).toBeInTheDocument()
  })

  it('SHOULD redirect to /auth/login if not logged in', async () => {
    useAuth.mockReturnValue({
      authenticated: false,
      jwt: null,
      loading: false,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/auth/login', { replace: true })
    })
  })

  it('SHOULD show children if logged in', () => {
    useAuth.mockReturnValue({
      authenticated: true,
      jwt: 'fake-jwt',
      loading: false,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Secret Content')).toBeInTheDocument()
  })
})