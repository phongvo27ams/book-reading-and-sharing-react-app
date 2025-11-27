import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Comment from '../../components/Comment/Comment'
import EmojiPicker from 'emoji-picker-react'
import style from './BookDetailPage.module.css'
import classNames from 'classnames/bind'
import { faHeart as faHeartOutlined } from '@fortawesome/free-regular-svg-icons'
import { faFeather, faStar, faClipboardList, faDownload, faHeart as faHeartSolid, faBookOpen, faShoppingCart, faArrowRight, faArrowLeft, faFaceSmile, faChevronDown, faBook, faChevronUp, faComment, faCommenting } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import zaloPayLogo from '../../assets/zaloPay.png'
import foxBudgetLogo from '../../assets/foxb.png'
import BasicRating from '../../components/BasicRating/BasicRating'
import { useBook } from '../../provider/BookContext'
import { useAuth } from '../../provider/AuthContext'
import { counting, getBookRatings, getMyRating, rateThisBook } from '../../api/ratingApi'
import { favoriteCheck, getPurchasedBookIds, toggleAddToFavorites } from '../../api/bookApi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Loader from '../../components/Loader/Loader'
import { createZaloPayOrder, getZaloPayPaymentStatus, getZaloPayOrderStatus, payUsingFoxBudget } from '../../api/purchaseApi'
import { useNotification } from '../../components/Notification/NotificationContainer'

const clx = classNames.bind(style)
function BookDetailPage() {
    const { bookData, bookLoading, updateFavorites, setUpdateFavorites, setId, favorites } = useBook()
    const { authenticated, jwt, userInfo, setUserInfo } = useAuth()
    const { showNotification } = useNotification()
    const [searchParams] = useSearchParams()

    const [clicked, setClicked] = useState(false)
    const [slide, setSlide] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState(1)
    const [emojiOpen, setEmojiOpen] = useState(false)
    const [comment, setComment] = useState('')
    const [error, setError] = useState('')
    const [ratings, setRatings] = useState(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const [ratingsCount, setRatingsCount] = useState(0)
    const [myRating, setMyRating] = useState(null)
    const [canRead, setCanRead] = useState(false)
    const [zaloPayLoading, setZaloPayLoading] = useState(false)
    const [walletLoading, setWalletLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [rate, setRate] = useState(0)
    const [currentOrderId, setCurrentOrderId] = useState(null)
    const [orderStatus, setOrderStatus] = useState(null) // 'PENDING', 'PAID', 'FAILED', 'EXPIRED'
    const [paymentError, setPaymentError] = useState(null)
    const [ratingLoading, setRatingLoading] = useState(false)
    const [ratingDisplayNum, setRatingDisplayNum] = useState(5)
    const [justToggledFavorite, setJustToggledFavorite] = useState(false)

    const navigate = useNavigate()

    // Đọc bookId từ URL params và set vào context
    useEffect(() => {
        const bookIdFromUrl = searchParams.get('id')
        if (bookIdFromUrl) {
            setId(bookIdFromUrl)
        }
    }, [searchParams, setId])

    const updateInteractions = (usn, bid, likes, dislikes, loves) => {
        setRatings(prevRts =>
            prevRts.map((rt, i) => (usn === rt.creatorUsername && bid === rt.ratedBookId) ?
                { ...rt, likes: likes, dislikes: dislikes, loves: loves } : rt)
        )
    }

    const fetchMyRating = async () => {
        try {
            const response = await getMyRating(jwt, bookData.bookId)
            const rating = response.data
            setMyRating(rating)
        } catch {
            console.log("Error fetching my rating")
        }
    }
    
    const handleChange = (e) => {
        const value = e.target.value;
        if (value.length > 100) {
            setError('Comment must be at most 100 characters');
        } else {
            setError('');
            setComment(value);
        }
    };

    const handleRating = (value) => {
        setRate(value)
    }

    const rateBook = async () => {
        if (!jwt) return
        try {
            setRatingLoading(true)
            const request = {
                ratedBookId: bookData.bookId,
                rate: rate,
                comment: comment
            }

            const res = await rateThisBook(jwt, request)
            if (res.statusCode === 0) {
                await fetchMyRating()
            }
        } catch {
            console.log('Error rating book.')
        } finally {
            setRatingLoading(false)
        }
    }

    const fetchBookRatings = async (page) => {
        try {
            const response = await getBookRatings(jwt, bookData.bookId, page, 5)
            const ratings = response.data.content
            const final = ratings.filter(item => item.creatorUsername != userInfo.username)
            setRatings(final)
        } catch {
            console.log("Error fetching ratings")
        }
    }

    const fetchRatingsCount = async () => {
        try {
            const response = await counting(bookData.bookId)
            setRatingsCount(response.data)
        } catch {
            console.log("Error ratings count")
        }
    }

    const fetchBookFavorite = async () => {
        if (!jwt || !bookData) return
        try {
            const response = await favoriteCheck(jwt, bookData.bookId)
            const state = response.data.isAdded
            setIsFavorite(state)
        } catch {
            console.log("Error checking favorite")
        }
    }

    const toggleFavorite = async () => {
        if (!jwt || !bookData) return
        try {
            setUpdateFavorites(true)
            setJustToggledFavorite(true) // Set flag to prevent useEffect from overriding
            const response = await toggleAddToFavorites(jwt, bookData.bookId)
            const isAdded = response.data.isAdded
            const message = response.data.message || (isAdded 
                ? "Item has been added to your favorite collection" 
                : "Item has been removed from your favorite collection")
            
            // Update state immediately - this will trigger icon change
            setIsFavorite(isAdded)
            
            // Show notification
            showNotification(message, 'success', 3000)
            
            // Trigger refresh by setting updateFavorites to false
            // This will trigger useEffect in BookContext to fetch favorites
            // Delay a bit to ensure state is updated first
            setTimeout(() => {
                setUpdateFavorites(false)
                // Clear flag after a delay to allow future refreshes
                setTimeout(() => {
                    setJustToggledFavorite(false)
                }, 1000)
            }, 200)
        } catch (error) {
            console.log("Error toggling favorite", error)
            showNotification("Failed to update favorite. Please try again.", 'error', 3000)
            setUpdateFavorites(false)
            setJustToggledFavorite(false)
        }
    }

    const checkPuchase = async () => {
        if (bookData.price === 0) return
        try {
            const response = await getPurchasedBookIds(jwt)
            const ids = response.data
            setCanRead(ids.includes(bookData.bookId))
        } catch {
            console.log("Error checking purchase")
        }
    }

    const handleReadClick = () => {
        if (bookData.price === 0) window.open(bookData.contentUrl)
        else {
            if (jwt) {
                if (canRead) window.open(bookData.contentUrl)
                else setSlide(2)
            } else {
                navigate("/auth/login")
            }
        }
    }

    const purchaseByWallet = async () => {
        if (!jwt) return
        try {
            setWalletLoading(true)
            const response = await payUsingFoxBudget(jwt, bookData.bookId)
            if (response.data.success) {
                setUserInfo(prev => ({
                    ...prev,
                    balance: prev.balance - bookData.price
                }));
                setSlide(1)
            }
        } catch {
            console.log('Purchase by wallet fail.')
        } finally {
            setWalletLoading(false)
        }
    }

    const checkPaymentStatus = async () => {
        try {
            const response = await getZaloPayPaymentStatus(jwt, bookData.bookId)
            if (response.data.success) {
                setSlide(1)
                setZaloPayLoading(false)
                setChecking(false)
                setOrderStatus('PAID')
                setCurrentOrderId(null)
            }
        } catch {
            console.log('Check status fail: ')
        }
    }

    const checkOrderStatus = async (appTransId) => {
        if (!appTransId || !jwt) return null
        
        try {
            const response = await getZaloPayOrderStatus(jwt, appTransId)
            if (response.data) {
                const status = response.data.status
                setOrderStatus(status)
                
                if (status === 'PAID') {
                    setSlide(1)
                    setZaloPayLoading(false)
                    setChecking(false)
                    setCanRead(true)
                    checkPuchase() // Refresh purchase status
                    showNotification('Payment successful! You can now access the book.', 'success', 3000)
                } else if (status === 'FAILED' || status === 'EXPIRED') {
                    setZaloPayLoading(false)
                    setChecking(false)
                    setPaymentError(status === 'FAILED' ? 'Payment failed. Please try again.' : 'Payment expired. Please create a new order.')
                }
                
                return status
            }
        } catch (error) {
            console.error('Error checking order status:', error)
            return null
        }
        return null
    }

    useEffect(() => {
        if (!checking || !currentOrderId) return

        const interval = setInterval(async () => {
            const status = await checkOrderStatus(currentOrderId)
            
            // Stop checking if payment is completed or failed
            if (status === 'PAID' || status === 'FAILED' || status === 'EXPIRED') {
                clearInterval(interval)
                setChecking(false)
            }
        }, 5000) // Check every 5 seconds

        return () => clearInterval(interval)
    }, [checking, currentOrderId, jwt])


    const purchaseByZaloPay = async () => {
        if (!jwt) return
        try {
            setZaloPayLoading(true)
            setPaymentError(null)
            setOrderStatus(null)
            
            const request = {
                amount: bookData.price,
                item: {
                    bookId: bookData.bookId,
                    title: bookData.title,
                    author: bookData.author,
                    price: bookData.price
                }
            }
            const response = await createZaloPayOrder(jwt, request)
            
            if (response.data && response.data.zaloPayResponse && response.data.zaloPayResponse.returncode === 1) {
                const appTransId = response.data.appTransId
                const orderUrl = response.data.zaloPayResponse.orderurl
                
                // Lưu appTransId để track order
                setCurrentOrderId(appTransId)
                setOrderStatus('PENDING')
                
                window.open(orderUrl, '_blank')
                setChecking(true)
                showNotification('Please complete the payment in the opened window.', 'info', 5000)
            } else {
                setZaloPayLoading(false)
                setPaymentError(response.message || 'Failed to create payment order. Please try again.')
                showNotification(response.message || 'Failed to create payment order. Please try again.', 'error', 3000)
            }
        } catch (error) {
            console.error('ZaloPay fail:', error)
            setZaloPayLoading(false)
            setPaymentError('Failed to create payment order. Please try again.')
            showNotification('Payment initialization failed. Please try again.', 'error', 3000)
        }
    }

    const retryPayment = () => {
        setPaymentError(null)
        setOrderStatus(null)
        setCurrentOrderId(null)
        purchaseByZaloPay()
    }

    useEffect(() => {
        if (!walletLoading) checkPuchase()
    }, [walletLoading])

    useEffect(() => {
        if (!checking) checkPuchase()
    }, [checking])

    useEffect(() => {
        if (!jwt || !bookData) return
        checkPuchase()
        fetchRatingsCount()
        fetchMyRating()
        fetchBookRatings()
        // Don't call fetchBookFavorite here - use favorites from context instead
        // fetchBookFavorite() is only used as fallback if favorites context is not available
    }, [jwt, bookData, bookLoading])

    // Sync isFavorite with favorites from context (my collection)
    // This is the primary source of truth - favorites from context
    useEffect(() => {
        if (!bookData) return
        
        // Skip sync if we just toggled to avoid race condition
        // The toggleFavorite function already sets the state immediately
        if (justToggledFavorite) return
        
        const currentBookId = bookData.bookId || bookData.id
        if (!currentBookId) return
        
        // Check if current book is in favorites collection
        // Handle different possible structures: {bookId}, {id}, or direct book object
        let isInFavorites = false
        
        if (favorites && favorites.length > 0) {
            isInFavorites = favorites.some(fav => {
                if (!fav) return false
                // If fav is a number/string, compare directly
                if (typeof fav === 'number' || typeof fav === 'string') {
                    return String(fav) === String(currentBookId)
                }
                // If fav is an object, check bookId or id property
                if (typeof fav === 'object') {
                    const favId = fav.bookId || fav.id
                    if (favId) {
                        return String(favId) === String(currentBookId)
                    }
                    // Check nested book object
                    if (fav.book) {
                        const bookId = fav.book.bookId || fav.book.id
                        return bookId && String(bookId) === String(currentBookId)
                    }
                }
                return false
            })
        }
        
        // Always update state based on favorites collection
        setIsFavorite(isInFavorites)
    }, [favorites, bookData, justToggledFavorite])

    useEffect(() => {
        // Only use API call as fallback if favorites from context is not available
        // Favorites from context is the primary source of truth
        if (!jwt || !bookData) return
        
        // If we have favorites from context, don't override with API call
        // The favorites useEffect will handle the state
        if (favorites && favorites.length >= 0) {
            // Favorites context is available, skip API call
            return
        }
        
        // Fallback: use API call only if favorites context is not available
        if (!updateFavorites && !justToggledFavorite) {
            const timer = setTimeout(() => {
                if (jwt && bookData && !justToggledFavorite) {
                    fetchBookFavorite()
                }
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [updateFavorites, jwt, bookData, justToggledFavorite, favorites])

    const handleEmojiMenuClick = () => {
        setEmojiOpen(prev => !prev)
    }

    const handleFavoriteClick = async () => {
        if (!jwt) {
            navigate("/auth/login")
            return
        }
        setClicked(true);
        setTimeout(() => setClicked(false), 300);
        await toggleFavorite();
    };

    if (bookLoading || !bookData)
        return (
            <div className={clx('loading-page')}>
            </div>
        )

    return (
        <div className={clx('detail-wrapper', { 'bottom-padding': authenticated })}>
            <div className={clx('blur-container')}>
                <div className={clx('blur-area', { 'green-blur': bookData.price === 0, 'pink-blur': bookData.price !== 0 })}></div>
                <div className={clx('blur-area', 'white-blur')}></div>
            </div>
            <div className={clx('book-detail-container')}>
                <div className={clx('book-cover')}>
                    <img src={bookData.imageUrl} />
                </div>
                <div className={clx('detail-container')}>
                    <h1 className={clx('book-title-lb')}>{bookData.title}</h1>
                    <div className={clx('info-container')}>
                        <div className={clx('sub-info-container')}>
                            <FontAwesomeIcon className={clx('feather-icon', 'blue-violet')} icon={faFeather} />
                            <h3 className={clx('book-author-lb', 'blue-violet')}>{bookData.author}</h3>
                        </div>
                        <div className={clx('sub-info-container')}>
                            <FontAwesomeIcon icon={faStar} className={clx('rate-icon', 'golden')} />
                            <h3 className={clx('golden')}>{"Rate: " + (bookData.averageRating === null ? 0 : bookData.averageRating)}</h3>
                        </div>
                        <div className={clx('sub-info-container')}>
                            <FontAwesomeIcon className={clx('ratings-icon', 'orange')} icon={faClipboardList} />
                            <h3 className={clx('orange')}>
                                {ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'}
                            </h3>
                        </div>
                        <div className={clx({ 'add-to-fav-btn': true, 'clicked': clicked })}
                            onClick={handleFavoriteClick}>
                            <div className={clx('heart-wrapper', { 'favorited': isFavorite })}>
                                <FontAwesomeIcon 
                                    key={isFavorite ? 'favorite' : 'not-favorite'}
                                    className={clx('heart-icon')}
                                    icon={isFavorite ? faHeartSolid : faHeartOutlined}
                                    style={isFavorite ? { color: '#ff0000' } : {}}
                                />
                            </div>
                            <label>Add to favourites</label>
                        </div>
                    </div>
                    <div className={clx('sub-info-container', 'top-margin')}>
                        <FontAwesomeIcon className={clx('ratings-icon', 'red-text')} icon={faBook} />
                        <h3 className={clx('red-text')}>{bookData.genre}</h3>
                    </div>
                    <div className={clx('slider', { 'second': slide === 2 })}>
                        <div className={clx('detail-slide')}>
                            <div className={clx('abstract-container')}>
                                <label>Description</label>
                                <div className={clx('seperator')}></div>
                                <p className={clx('description')}>
                                    {bookData.description}
                                </p>
                            </div>
                            <div className={clx('btn-container')}>
                                <div className={clx({ 'expanded-btn': true, 'blue-theme': canRead || bookData.price === 0, 'pink-theme': !canRead && bookData.price !== 0 })}
                                    onClick={() => handleReadClick()}>
                                    <FontAwesomeIcon className={clx('btn-icon')} icon={canRead || bookData.price === 0 ? faDownload : faShoppingCart} />
                                    <label>{canRead || bookData.price === 0 ? 'Download PDF' : 'Purchase now'}</label>
                                </div>
                                <div className={clx('expanded-btn', 'orange-theme')}>
                                    <FontAwesomeIcon className={clx('btn-icon')} icon={faBookOpen} />
                                    <label>Read on site</label>
                                </div>
                            </div>
                        </div>
                        <div className={clx('payment-slide')}>
                            <label className={clx('gray-text', 'bold')}>Choose a payment method</label>
                            <div className={clx('back-btn')} onClick={() => setSlide(1)}>
                                <FontAwesomeIcon icon={faArrowLeft} />
                                <label>Back</label>
                            </div>
                            <div className={clx('seperator')}></div>
                            <div className={clx('payment-methods')}>
                                <div className={clx('expanded-selection-box', { 'selected': paymentMethod === 1 })}>
                                    <div className={clx('selection-area')}>
                                        <input disabled={walletLoading} id='opt1' type='radio' name='option' checked={paymentMethod === 1} onChange={() => setPaymentMethod(1)} />
                                        <label>ZaloPay</label>
                                        <img className={clx('method-logo')} src={zaloPayLogo} />
                                    </div>
                                    <div className={clx('payment-info')}>
                                        <div className={clx('box-seperator')}></div>
                                        <div className={clx('pay-area')}>
                                            <div className={clx('total')}>
                                                <label className={clx('white-text')}>Total price:</label>
                                                <label className={clx('green-text', 'bold', 'large-text')}>{bookData.price.toLocaleString() + "đ"}</label>
                                            </div>
                                            
                                            {/* Hiển thị trạng thái thanh toán */}
                                            {orderStatus && (
                                                <div className={clx('payment-status')} style={{
                                                    padding: '10px',
                                                    marginBottom: '10px',
                                                    borderRadius: '5px',
                                                    backgroundColor: orderStatus === 'PAID' ? '#4caf50' : 
                                                                   orderStatus === 'FAILED' ? '#f44336' : 
                                                                   orderStatus === 'EXPIRED' ? '#ff9800' : '#2196f3',
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    fontSize: '14px'
                                                }}>
                                                    {orderStatus === 'PAID' && '✓ Payment Successful'}
                                                    {orderStatus === 'PENDING' && (
                                                        <div>
                                                            <div>⏳ Payment Pending...</div>
                                                            {currentOrderId && (
                                                                <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.9 }}>
                                                                    Order ID: {currentOrderId.substring(0, 20)}...
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {orderStatus === 'FAILED' && '✗ Payment Failed'}
                                                    {orderStatus === 'EXPIRED' && '⏰ Payment Expired'}
                                                </div>
                                            )}
                                            
                                            {/* Hiển thị lỗi */}
                                            {paymentError && (
                                                <div className={clx('payment-error')} style={{
                                                    padding: '10px',
                                                    marginBottom: '10px',
                                                    borderRadius: '5px',
                                                    backgroundColor: '#f44336',
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    fontSize: '12px'
                                                }}>
                                                    {paymentError}
                                                </div>
                                            )}
                                            
                                            {/* Nút chính */}
                                            {(!orderStatus || orderStatus === 'PENDING') && (
                                                <a className={clx('pay-btn', 'blue-btn')} onClick={purchaseByZaloPay} disabled={zaloPayLoading}>
                                                    {orderStatus === 'PENDING' ? 'Waiting for payment...' : 'Go to ZaloPay gateway'}
                                                </a>
                                            )}
                                            
                                            {/* Nút retry khi failed hoặc expired */}
                                            {(orderStatus === 'FAILED' || orderStatus === 'EXPIRED') && (
                                                <a className={clx('pay-btn', 'blue-btn')} onClick={retryPayment} style={{ marginTop: '10px' }}>
                                                    Try Again
                                                </a>
                                            )}
                                            
                                            <div className={clx('loader-container')}>
                                                <Loader isLoading={zaloPayLoading} type='spinner' />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={clx('expanded-selection-box', { 'selected': paymentMethod === 2 })}>
                                    <div className={clx('selection-area')}>
                                        <input disabled={zaloPayLoading} id='opt2' type='radio' name='option' checked={paymentMethod === 2} onChange={() => setPaymentMethod(2)} />
                                        <label>Foxbase budget</label>
                                        <img className={clx('method-logo')} src={foxBudgetLogo} />
                                    </div>
                                    <div className={clx('payment-info')}>
                                        <div className={clx('box-seperator')}></div>
                                        <div className={clx('pay-area')}>
                                            <div className={clx('total')}>
                                                <label className={clx('white-text')}>Total price:</label>
                                                <label className={clx('green-text', 'bold', 'large-text')}>{bookData.price.toLocaleString() + "đ"}</label>
                                            </div>
                                            <a className={clx('pay-btn', 'orange-btn')} onClick={purchaseByWallet}>
                                                Confirm payment
                                            </a>
                                            <div className={clx('loader-container')}>
                                                <Loader isLoading={walletLoading} type='spinner' />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {authenticated && <div className={clx('comment-area')}>
                {!myRating ? (
                    <div className={clx('user-comment')}>
                        <div className={clx('rate-container')}>
                            <label className={clx('rate-label')}>Rate this book:</label>
                            <BasicRating value={rate} onChange={handleRating} />
                        </div>
                        <div className={clx('comment-box')}>
                            <div className={clx('first-section')}>
                                <div className={clx('cmt-avatar')}>
                                    <img src={userInfo.avatarUrl ? userInfo.avatarUrl : 'https://res.cloudinary.com/ddlpbdgv5/image/upload/v1763005620/328283141_e3fbbe1c-cb27-4c6a-8416-eeb4640dd148_ha532y.jpg'} /> :
                                </div>
                                <div className={clx('emoji')} onClick={handleEmojiMenuClick}>
                                    <FontAwesomeIcon icon={faFaceSmile} />
                                </div>
                            </div>
                            <div className={clx('input-section')}>
                                <textarea placeholder='Leave your comment here...' rows='5' cols='95'
                                    value={comment}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={clx('btn-section')}>
                                <div>
                                    {comment.length}/100 characters
                                </div>
                                <div className={clx('submit-btn')} onClick={rateBook}>Submit</div>
                                <div className={clx('rloader-container')}>
                                    <Loader isLoading={ratingLoading} type='spinner' />
                                </div>
                            </div>
                        </div>
                        <div className={clx('emoji-container')}>
                          <EmojiPicker
                              emojiStyle='facebook'
                              theme='dark'
                              lazyLoadEmojis
                              open={emojiOpen}
                              onEmojiClick={(obj) => {
                                  setComment(prev => {
                                      const newValue = prev + obj.emoji;

                                      if (newValue.length > 100) {
                                          setError('Comment must be at most 100 characters');
                                          return prev;
                                      }

                                      setError('');
                                      return newValue;
                                  });
                              }}
                          />
                        </div>
                        <div className={clx('error-message')}>
                            {error && <span style={{ color: 'red' }}>{error}</span>}
                        </div>
                    </div>
                ) : (
                    <Comment myComment={true} rating={myRating} updateInteractions={updateInteractions}
                        avatarUrl={userInfo.avatarUrl} fname={userInfo.fname} lname={userInfo.lname} />
                )}
                <div className={clx('cmt-seperator')}></div>
                <h3>Ratings</h3>
                <div className={clx('comments')}>
                    {ratings ? (ratings.filter((item, index) => index < ratingDisplayNum)).map((item, index) => (
                        <Comment key={index} myComment={false} rating={item} avatarUrl={item.creatorAvatar}
                            fname={item.creatorFName} lname={item.creatorLName}
                            updateInteractions={updateInteractions} />
                    )) : (<div></div>)}
                    { myRating ?
                        (ratings && ratings.length > 5 &&
                        <div className={clx('pagination-controls')}>
                            <div className={clx('see-more')} onClick={() => setRatingDisplayNum(prev => prev + 5)}>
                                <label>See more</label>
                                <FontAwesomeIcon icon={faChevronDown} />
                            </div>
                            <div className={clx('see-less')} onClick={() => setRatingDisplayNum(5)}>
                                <label>See less</label>
                                <FontAwesomeIcon icon={faChevronUp} />
                            </div>
                        </div>)
                        :
                        (<div></div>)
                    }
                    {ratings ?
                        (ratings.length === 0 &&
                            <div className={clx('empty')}>
                                <FontAwesomeIcon icon={faCommenting} />
                                <label>No other ratings found.</label>
                            </div>) :
                        (<div></div>)
                    }
                </div>
            </div>}
        </div>
    )
}

export default BookDetailPage