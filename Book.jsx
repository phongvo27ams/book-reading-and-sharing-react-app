import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import style from './Book.module.css'
import classNames from 'classnames/bind'
import { faGift, faCartShopping, faBookOpen, faHeart as faHearSolid } from '@fortawesome/free-solid-svg-icons'
import { useBook } from '../../provider/BookContext'
import { useNavigate } from 'react-router-dom'

const clx = classNames.bind(style)
function Book({ book }) {
    const { setId, setBookData } = useBook()

    const navigate = useNavigate()

    const handleBookDetailView = () => {
        setId(book.bookId)
        setBookData(book)
        navigate(`/book/detail?id=${book.bookId}`)
    }

    return (
        <div className={clx('wrapper')}>
            <div className={clx('cover')}>
                <div className={clx('stamp')}>
                    <div className={clx({ 'stamp-type': true, 'free': book.price === 0, 'cost': book.price !== 0 })}>{book.price > 0 ? book.price.toLocaleString() + "đ" : "FREE"}</div>
                    <div className={clx('stamp-icon-container')}>
                        <FontAwesomeIcon className={clx({ 'stamp-icon': true, 'free-lb': book.price === 0, 'cost-lb': book.price !== 0 })}
                            icon={book.price === 0 ? faGift : faCartShopping} />
                    </div>
                </div>
                <div className={clx('overlay')}>
                    <div className={clx({ 'read-btn': true, 'free-read': book.price === 0, 'cost-read': book.price !== 0 })}
                        onClick={() => handleBookDetailView()}>
                        <FontAwesomeIcon className={clx('read-btn-icon')} icon={book.price === 0 ? faBookOpen : faCartShopping} />
                        <label>{book.price === 0 ? 'Read' : 'Buy'}</label>
                    </div>
                </div>
                <img className={clx('cover-image')} src={book.imageUrl} />
            </div>
            <label className={clx('book-title')}>{book.title}</label>
        </div>
    )
}

export default Book