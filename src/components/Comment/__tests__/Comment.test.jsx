import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Comment from '../Comment'
import { useAuth } from '../../../provider/AuthContext'
import { countInteractionsOfOneRating, getUserInteraction, interact } from '../../../api/interactionApi'

// Mock the necessary modules
vi.mock('../../../provider/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../api/interactionApi', () => ({
  countInteractionsOfOneRating: vi.fn(),
  getUserInteraction: vi.fn(),
  interact: vi.fn(),
}))

vi.mock('../../RateStars/RateStars', () => ({
  __esModule: true,
  default: ({ rate }) => <div data-testid="rate-stars">Rate: {rate}</div>,
}))

describe('Comment Component', () => {
  const mockRating = {
    creatorUsername: 'alice',
    ratedBookId: 1,
    createdAt: '2025-05-10T09:21:50.264489',
    rate: 4,
    comment: 'Great book!',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    useAuth.mockReturnValue({
      jwt: 'fake-jwt',
      userInfo: { username: 'bob' },
    })

    countInteractionsOfOneRating.mockResolvedValue({
      statusCode: 0,
      data: { LIKE: 2, DISLIKE: 1, LOVE: 5 },
    })
    getUserInteraction.mockResolvedValue({ data: 'NONE' })
    interact.mockResolvedValue({})
  })

  it('SHOULD render basic info correctly', async () => {
    render(
      <Comment
        myComment={false}
        fname="Alice"
        lname="Nguyen"
        avatarUrl=""
        rating={mockRating}
        updateInteractions={vi.fn()}
      />
    )

    expect(await screen.findByText('Alice Nguyen')).toBeInTheDocument()
    expect(screen.getByText('Great book!')).toBeInTheDocument()
    expect(screen.getByTestId('rate-stars')).toHaveTextContent('Rate: 4')
  })

  it('SHOULD call countInteractions and getUserInteraction on mount', async () => {
    render(
      <Comment
        myComment={false}
        fname="Alice"
        lname="Nguyen"
        avatarUrl=""
        rating={mockRating}
        updateInteractions={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(countInteractionsOfOneRating).toHaveBeenCalledTimes(1)
      expect(getUserInteraction).toHaveBeenCalledTimes(1)
    })
  })

  it('SHOULD handle like click correctly', async () => {
    render(
      <Comment
        myComment={false}
        fname="Alice"
        lname="Nguyen"
        avatarUrl=""
        rating={mockRating}
        updateInteractions={vi.fn()}
      />
    )

    // Wait for useEffect to complete before clicking
    const likeButton = await screen.findByTestId('like-btn')
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(interact).toHaveBeenCalledWith(
        'fake-jwt',
        expect.objectContaining({
          action: 'LIKE',
          interactUsername: 'bob',
        })
      )
    })
  })

  it('SHOULD handle love click correctly', async () => {
    render(
      <Comment
        myComment={false}
        fname="Alice"
        lname="Nguyen"
        avatarUrl=""
        rating={mockRating}
        updateInteractions={vi.fn()}
      />
    )

    // Wait for useEffect to complete before clicking
    const loveButton = await screen.findByTestId('heart-btn')
    fireEvent.click(loveButton)

    await waitFor(() => {
      expect(interact).toHaveBeenCalledWith(
        'fake-jwt',
        expect.objectContaining({
          action: 'LOVE',
          interactUsername: 'bob',
        })
      )
    })
  })

  it('SHOULD NOT call interact when myComment is true', async () => {
    render(
      <Comment
        myComment={true}
        fname="Alice"
        lname="Nguyen"
        avatarUrl=""
        rating={mockRating}
        updateInteractions={vi.fn()}
      />
    )

    // Wait for useEffect to complete before clicking
    await waitFor(() => expect(getUserInteraction).toHaveBeenCalled())

    const likeButton = await screen.findByTestId('like-btn')
    fireEvent.click(likeButton)

    // Wait to ensure interact is not called
    await waitFor(() => {
      expect(interact).not.toHaveBeenCalled()
    })
  })

  it('SHOULD update UI when like count increases after interaction', async () => {
    const mockUpdateInteractions = vi.fn().mockImplementation(async () => {
      countInteractionsOfOneRating.mockResolvedValueOnce({
        statusCode: 0,
        data: { LIKE: 3, DISLIKE: 1, LOVE: 5 }, // Update value
      })
    })

    countInteractionsOfOneRating.mockResolvedValueOnce({
      statusCode: 0,
      data: { LIKE: 2, DISLIKE: 1, LOVE: 5 },
    })

    render(
      <Comment
        myComment={false}
        fname="Alice"
        lname="Nguyen"
        avatarUrl=""
        rating={mockRating}
        updateInteractions={mockUpdateInteractions}
      />
    )

    // Initial UI
    const likeButton = await screen.findByTestId('like-btn')
    const likeCountLabel = likeButton.querySelector('label')
    expect(likeCountLabel).toHaveTextContent('2')

    // Click like button
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(interact).toHaveBeenCalledWith(
        'fake-jwt',
        expect.objectContaining({
          action: 'LIKE',
          ratedBookId: 1,
        })
      )
    })

    // Call the updateInteractions function (simulate the component calling the refresh API)
    await mockUpdateInteractions()

    // wait for the UI to update
    await waitFor(() => {
      expect(likeCountLabel).toHaveTextContent('3')
    })
  })
})