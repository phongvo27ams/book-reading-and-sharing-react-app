import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginGuard from '../LoginGuard'

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

describe('LoginGuard', () => {
  const navigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(navigate)
  })

  it('SHOULD show loading while checking access', () => {
    useAuth.mockReturnValue({
      authenticated: false,
      jwt: null,
      isInitializing: true,
    })

    render(
      <MemoryRouter>
        <LoginGuard>
          <div>Login Page</div>
        </LoginGuard>
      </MemoryRouter>
    )

    expect(screen.getByText(/Đang kiểm tra quyền truy cập/i)).toBeInTheDocument()
  })

  it('SHOULD redirect to / if logged in', async () => {
    useAuth.mockReturnValue({
      authenticated: true,
      jwt: 'fake-jwt',
      isInitializing: false,
    })

    render(
      <MemoryRouter>
        <LoginGuard>
          <div>Login Page</div>
        </LoginGuard>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('SHOULD show children if not logged in', () => {
    useAuth.mockReturnValue({
      authenticated: false,
      jwt: null,
      isInitializing: false,
    })

    render(
      <MemoryRouter>
        <LoginGuard>
          <div>Login Page</div>
        </LoginGuard>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})