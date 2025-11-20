import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WorkPage from '../WorkPage'

// Prepare mocks
const mockShowNotification = vi.fn()
const mockRemoveItem = vi.fn()
const mockRemoveMyWork = vi.fn()
const mockSetUpdateWorks = vi.fn()
const mockPublishBook = vi.fn()

// Mock modules exactly as imported in WorkPage.jsx
vi.mock('../../../provider/AuthContext', () => ({
  useAuth: () => ({
    loading: false,
    userInfo: { username: 'testuser', avatarUrl: 'ava.png' },
    jwt: 'fake-jwt',
  }),
}))

vi.mock('../../../components/Notification/NotificationContainer', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
  }),
}))

vi.mock('../../../provider/BookContext', () => ({
  useBook: () => ({
    favorites: [
      {
        bookId: 1,
        title: 'A',
        genre: 'Drama',
        price: 0,
        description: 'desc',
        imageUrl: '',
        contentUrl: '',
        averageRating: 4.5,
        isExpanded: false,
      },
    ],
    works: [
      {
        bookId: 99,
        title: 'Mine',
        genre: 'SciFi',
        price: 0,
        description: 'desc',
        imageUrl: '',
        contentUrl: '',
        averageRating: 5.0,
        isExpanded: false,
      },
    ],
    isEmptyF: false,
    isEmptyW: false,
    fLoading: false,
    wLoading: false,
    setFavorites: vi.fn(),
    setWorks: vi.fn(),
    setIsEmptyF: vi.fn(),
    setIsEmptyW: vi.fn(),
    removeItem: mockRemoveItem,
    removeMyWork: mockRemoveMyWork,
    setUpdateWorks: mockSetUpdateWorks,
  }),
}))

vi.mock('../../../api/bookApi', () => ({
  publishBook: (...args) => mockPublishBook(...args),
}))

// Mock FontAwesomeIcon to simplify DOM queries
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }) => {
    const name = icon && icon.iconName ? icon.iconName : 'fa'
    return <svg data-testid={`fa-${name}`} className={className} data-icon={name}></svg>
  },
}))

// Mock import CSS modules
vi.mock('../WorkPage.module.css', () => ({
  default: {}
}))

describe('WorkPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('SHOULD renders My Collection when type=1', () => {
    render(<WorkPage type={1} />)
    expect(screen.getByText(/MY COLLECTION/i)).toBeInTheDocument()
  })

  it('SHOULD renders My Work when type=2', () => {
    render(<WorkPage type={2} />)
    expect(screen.getByText(/MY WORK/i)).toBeInTheDocument()
  })

  it('SHOULD switches to NEW WORK tab when clicking add button (type=2)', () => {
    render(<WorkPage type={2} />)

    const addBtn = screen.getByText((t) => /add/i.test(t))
    fireEvent.click(addBtn)

    expect(
      screen.getByText(/book information/i)
    ).toBeInTheDocument()
  })

  it('SHOULD shows validation when publishing with missing fields', async () => {
    render(<WorkPage type={2} />)

    const publishBtn = screen.getByRole('button', { name: /publish/i });
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Please fill out all required fields (Title, PDF, Author, Genre, Description).",
        'error',
        3000
      )
    })
  })

  it('SHOULD publishes successfully when form is filled and publishBook returns success', async () => {
    mockPublishBook.mockResolvedValue({ statusCode: 0 })

    render(<WorkPage type={2} />)

    const titleInput = screen.getByPlaceholderText(/Give your book a fantastic title/i)
    fireEvent.change(titleInput, { target: { value: 'My Title' } })

    const firstNameInput = screen.getByPlaceholderText(/First name/i)
    fireEvent.change(firstNameInput, { target: { value: 'John' } })

    const lastNameInput = screen.getByPlaceholderText(/Last name/i)
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })

    const genreInput = screen.getByPlaceholderText(/What is the genre/i)
    fireEvent.change(genreInput, { target: { value: 'SciFi' } })

    const descriptionInput = screen.getByPlaceholderText(/Write a short description about your book/i)
    fireEvent.change(descriptionInput, { target: { value: 'Nice book' } })

    const priceInput = screen.getByPlaceholderText(/Sell it \?/i)
    fireEvent.change(priceInput, { target: { value: '0' } })

    const fileInput = screen.getByLabelText((content, node) => {
      return node.tagName === 'INPUT' && node.getAttribute('type') === 'file' && node.getAttribute('accept') === 'application/pdf'
    })

    const pdfFile = new File(['dummy'], 'book.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [pdfFile] } })

    const publishBtn = screen.getByTestId('publish-btn');
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(mockPublishBook).toHaveBeenCalled()
      expect(mockShowNotification).toHaveBeenCalledWith('Publish book success', 'success', 3000)
    })
  })

  it('SHOULD show error when PDF file exceeds size limit', async () => {
    render(<WorkPage type={2} />)

    fireEvent.change(screen.getByPlaceholderText(/Give your book a fantastic title/i), { target: { value: 'My Title' } })
    fireEvent.change(screen.getByPlaceholderText(/First name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByPlaceholderText(/Last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByPlaceholderText(/What is the genre/i), { target: { value: 'SciFi' } })

    const fileInput = screen.getByLabelText((content, node) =>
      node.tagName === 'INPUT' && node.getAttribute('type') === 'file' && node.getAttribute('accept') === 'application/pdf'
    )

    // File size > 50MB
    const largePdf = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [largePdf] } })

    fireEvent.click(screen.getByTestId('publish-btn'))

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'File size exceeds 50MB limit!',
        'error',
        3000
      )
    })
  })

  it('SHOULD show error when file type is not PDF', async () => {
    render(<WorkPage type={2} />)

    fireEvent.change(screen.getByPlaceholderText(/Give your book a fantastic title/i), { target: { value: 'My Title' } })
    fireEvent.change(screen.getByPlaceholderText(/First name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByPlaceholderText(/Last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByPlaceholderText(/What is the genre/i), { target: { value: 'SciFi' } })
    fireEvent.change(screen.getByPlaceholderText(/Write a short description about your book/i), { target: { value: 'Nice book' } })
    fireEvent.change(screen.getByPlaceholderText(/Sell it \?/i), { target: { value: '0' } })

    const fileInput = screen.getByLabelText((content, node) => {
      return node.tagName === 'INPUT' && node.getAttribute('type') === 'file' && node.getAttribute('accept') === 'application/pdf'
    })

    // Create a TXT file
    const txtFile = new File(['dummy content'], 'book.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [txtFile] } })

    fireEvent.click(screen.getByTestId('publish-btn'))

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith("Invalid file type! Only PDF is allowed.", "error", 3000)
    })
  })

  it('SHOULD handleRemove calls removeItem for type=1 and shows notification', async () => {
    mockRemoveItem.mockResolvedValue({ data: { isAdded: false, message: 'Removed' } })

    render(<WorkPage type={1} />)

    // Find the Remove button label in a rendered record
    const removeBtn = screen.getAllByText('Remove')[0]
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(mockRemoveItem).toHaveBeenCalled()
      expect(mockShowNotification).toHaveBeenCalledWith('Removed', 'success', 3000)
    })
  })

  it('SHOULD handleRemove calls removeMyWork for type=2', async () => {
    render(<WorkPage type={2} />)

    const removeBtn = screen.getAllByText('Remove')[0]
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(mockRemoveMyWork).toHaveBeenCalled()
    })
  })
})