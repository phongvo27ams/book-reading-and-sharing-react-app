import { render, screen, act } from '@testing-library/react'
import { NotificationProvider, useNotification } from '../NotificationContainer'

// Mock Notification component để tránh phụ thuộc UI
vi.mock('../Notification', () => ({
  default: ({ message, type, duration, onClose }) => (
    <div data-testid="notification">
      <span>{message}</span>
      <span>{type}</span>
      <span>{duration}</span>
      <button onClick={onClose}>x</button>
    </div>
  ),
}))

// Component test nhỏ để gọi useNotification
function TestComponent() {
  const { showNotification } = useNotification()
  return (
    <button onClick={() => showNotification('Hello world', 'info', 1234)}>
      Trigger
    </button>
  )
}

describe('NotificationProvider', () => {
  it('SHOULD render children normally', () => {
    render(
      <NotificationProvider>
        <p>child</p>
      </NotificationProvider>
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('SHOULD show notification when showNotification is called', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    // Gọi showNotification qua nút trong TestComponent
    act(() => {
      screen.getByText('Trigger').click()
    })

    // Kiểm tra notification xuất hiện
    const notif = screen.getByTestId('notification')
    expect(notif).toBeInTheDocument()
    expect(notif).toHaveTextContent('Hello world')
    expect(notif).toHaveTextContent('info')
    expect(notif).toHaveTextContent('1234')
  })

  it('SHOULD remove notification when onClose is called', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    act(() => {
      screen.getByText('Trigger').click()
    })

    const closeBtn = screen.getByText('x')

    act(() => {
      closeBtn.click()
    })

    expect(screen.queryByTestId('notification')).not.toBeInTheDocument()
  })

  it('SHOULD throw error when useNotification is used outside provider', () => {
    const Broken = () => {
      useNotification()
      return null
    }

    // useNotification không nằm trong Provider → sẽ ném lỗi
    expect(() => render(<Broken />)).toThrow(
      'useNotification must be used within NotificationProvider'
    )
  })
})