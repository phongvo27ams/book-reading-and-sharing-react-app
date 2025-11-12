import { render, screen, waitFor } from '@testing-library/react'
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartOutlined } from '@fortawesome/free-regular-svg-icons'
import userEvent from '@testing-library/user-event'
import BookDetailPage from '../BookDetailPage'

import { useBook } from '../../../provider/BookContext'
import { useAuth } from '../../../provider/AuthContext'
import { useNotification } from '../../../components/Notification/NotificationContainer'

import { favoriteCheck, toggleAddToFavorites } from '../../../api/bookApi'

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className, 'data-testid': testId }) => {
    const resolvedTestId =
      testId || (icon.iconName?.includes('heart') ? 'heart-icon' : 'fa-icon')
    return (
      <svg
        data-testid={resolvedTestId}
        data-icon={icon.iconName}
        className={className}
        role={resolvedTestId === 'heart-icon' ? 'button' : undefined}
        aria-label={resolvedTestId === 'heart-icon' ? 'add to favourites' : undefined}
      ></svg>
    )
  },
}))

vi.mock('../../../api/bookApi')
vi.mock('../../../api/ratingApi', () => ({
  counting: vi.fn().mockResolvedValue({ data: 0 }),
  getBookRatings: vi.fn().mockResolvedValue({ data: { content: [] } }),
  getMyRating: vi.fn().mockResolvedValue({ data: null }),
}))
vi.mock('../../../api/purchaseApi', () => ({
  getPurchasedBookIds: vi.fn().mockResolvedValue({ data: [] }),
}))
vi.mock('../../../components/Notification/NotificationContainer')
vi.mock('../../../provider/BookContext')
vi.mock('../../../provider/AuthContext')
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams('?id=1')],
  useNavigate: () => vi.fn(),
}))

vi.mock('../BookDetailPage.module.css', () => ({
  default: {
    heartIcon: 'heart-icon',
    pink: 'pink',
  },
}))

describe('BookDetailPage Favorite Feature', () => {
  const mockBookData = {
    bookId: 1,
    title: 'Test Book',
    author: 'Author',
    price: 0,
    imageUrl: 'img.png',
    description: 'desc',
    genre: 'fiction',
    averageRating: 4.5,
  }

  const mockShowNotification = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    useNotification.mockReturnValue({ showNotification: mockShowNotification })
    useAuth.mockReturnValue({
      authenticated: true,
      jwt: 'fake-jwt',
      userInfo: { username: 'testuser', avatarUrl: 'ava.png', fname: 'Test', lname: 'User' },
      setUserInfo: vi.fn(),
    })
    useBook.mockReturnValue({
      bookData: mockBookData,
      bookLoading: false,
      setId: vi.fn(),
      setUpdateFavorites: vi.fn(),
    })
  })

  it('SHOULD render outlined heart when not favorite', async () => {
    favoriteCheck.mockResolvedValueOnce({ data: { isAdded: false } })

    render(<BookDetailPage />)

    const heart = await screen.findByTestId('heart-icon')
    expect(heart).toHaveAttribute('data-icon', faHeartOutlined.iconName)
  })

  it('SHOULD toggle favorite state when clicked', async () => {
    favoriteCheck.mockResolvedValueOnce({ data: { isAdded: false } })
    toggleAddToFavorites.mockResolvedValueOnce({
      data: { isAdded: true, message: 'Item has been added to your favorite collection' },
    })

    render(<BookDetailPage />)
    const user = userEvent.setup()

    const heartBtn = await screen.findByRole('button', { name: /add to favourites/i })
    await user.click(heartBtn)

    expect(toggleAddToFavorites).toHaveBeenCalledWith('fake-jwt', 1)

    await waitFor(() =>
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Item has been added to your favorite collection',
        'success',
        3000
      )
    )
  })

  it('SHOULD show solid pink heart when already favorite', async () => {
    favoriteCheck.mockResolvedValueOnce({ data: { isAdded: true } })

    render(<BookDetailPage />)

    const heart = await screen.findByTestId('heart-icon')
    expect(heart).toHaveAttribute('data-icon', faHeartSolid.iconName)
  })

  it('SHOULD handle API error gracefully', async () => {
    favoriteCheck.mockResolvedValueOnce({ data: { isAdded: true } })
    toggleAddToFavorites.mockRejectedValueOnce(new Error('Network error'))

    render(<BookDetailPage />)
    const user = userEvent.setup()

    const heartBtn = await screen.findByRole('button', { name: /add to favourites/i })
    await user.click(heartBtn)

    await waitFor(() =>
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Failed to update favorite. Please try again.',
        'error',
        3000
      )
    )
  })
})