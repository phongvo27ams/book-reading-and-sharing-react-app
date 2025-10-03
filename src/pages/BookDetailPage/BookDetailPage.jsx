import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Comment from '../../components/Comment/Comment'
import EmojiPicker from 'emoji-picker-react'
import style from './BookDetailPage.module.css'
import classNames from 'classnames/bind'
import { faHeart as faHeartOutlined } from '@fortawesome/free-regular-svg-icons'
import { faFeather, faStar, faClipboardList, faDownload, faHeart as faHearSolid, faBookOpen, faShoppingCart, faArrowRight, faArrowLeft, faFaceSmile, faChevronDown, faBook, faChevronUp, faComment, faCommenting } from '@fortawesome/free-solid-svg-icons'
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
import { createZaloPayOrder, getZaloPayPaymentStatus, payUsingFoxBudget } from '../../api/purchaseApi'

const clx = classNames.bind(style)
function BookDetailPage() {
    const { bookData, bookLoading, setUpdateFavorites, setId } = useBook()
    const { authenticated, jwt, userInfo, setUserInfo } = useAuth()
    const [searchParams] = useSearchParams()

    const [clicked, setClicked] = useState(false)
    const [slide, setSlide] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState(1)
    const [emojiOpen, setEmojiOpen] = useState(false)
    const [comment, setComment] = useState('')
    const [ratings, setRatings] = useState(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const [ratingsCount, setRatingsCount] = useState(0)
    const [myRating, setMyRating] = useState(null)
    const [canRead, setCanRead] = useState(false)
    const [zaloPayLoading, setZaloPayLoading] = useState(false)
    const [walletLoading, setWalletLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [rate, setRate] = useState(0)
    const [ratingLoading, setRatingLoading] = useState(false)
    const [ratingDisplayNum, setRatingDisplayNum] = useState(5)

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
        try {
            const response = await favoriteCheck(jwt, bookData.bookId)
            const state = response.data.added
            setIsFavorite(state)
        } catch {
            console.log("Error checking favorite")
        }
    }

    const toggleFavorite = async () => {
        try {
            setUpdateFavorites(true)
            const response = await toggleAddToFavorites(jwt, bookData.bookId)
            const isAdded = response.data.added
            setIsFavorite(isAdded)
        } catch {
            console.log("Error toggling favorite")
        } finally {
            setUpdateFavorites(false)
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
            }
        } catch {
            console.log('Check status fail: ')
        }
    }

    useEffect(() => {
        if (!checking) return

        const interval = setInterval(() => {
            if (zaloPayLoading) {
                checkPaymentStatus()
            } else {
                clearInterval(interval)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [checking, zaloPayLoading])


    const purchaseByZaloPay = async () => {
        if (!jwt) return
        try {
            setZaloPayLoading(true)
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
            if (response.data.returncode === 1) {
                window.open(response.data.orderurl, '_blank')
                setChecking(true)
            }
        } catch {
            console.log('ZaloPay fail')
        }
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
        fetchBookFavorite()
    }, [jwt, bookData, bookLoading])

    const handleEmojiMenuClick = () => {
        setEmojiOpen(prev => !prev)
    }

    const handleFavoriteClick = () => {
        if (!jwt) {
            navigate("/auth/login")
            return
        }
        toggleFavorite()
        setIsFavorite(!isFavorite)
        setClicked(true);
        setTimeout(() => setClicked(false), 300);
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
                            <h3 className={clx('orange')}>{ratingsCount + " ratings"}</h3>
                        </div>
                        <div className={clx({ 'add-to-fav-btn': true, 'clicked': clicked })}
                            onClick={handleFavoriteClick}>
                            <FontAwesomeIcon className={clx({ 'heart-icon': true, 'pink': isFavorite })}
                                icon={isFavorite ? faHearSolid : faHeartOutlined} />
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
                                            <a className={clx('pay-btn', 'blue-btn')} onClick={purchaseByZaloPay}>
                                                Go to ZaloPay gateway
                                            </a>
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
                                    <img src={userInfo.avatarUrl} />
                                </div>
                                <div className={clx('emoji')} onClick={handleEmojiMenuClick}>
                                    <FontAwesomeIcon icon={faFaceSmile} />
                                </div>
                            </div>
                            <div className={clx('input-section')}>
                                <textarea placeholder='Leave your comment here...' rows='5' cols='95'
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)} />
                            </div>
                            <div className={clx('btn-section')}>
                                <div className={clx('submit-btn')} onClick={rateBook}>Submit</div>
                                <div className={clx('rloader-container')}>
                                    <Loader isLoading={ratingLoading} type='spinner' />
                                </div>
                            </div>
                        </div>
                        <div className={clx('emoji-container')}>
                            <EmojiPicker emojiStyle='facebook'
                                theme='dark'
                                lazyLoadEmojis
                                open={emojiOpen}
                                onEmojiClick={(obj) => setComment(prev => prev + obj.emoji)} />
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
                        (ratings.length > 5 &&
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