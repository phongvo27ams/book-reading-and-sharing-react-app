import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import style from './WorkPage.module.css'
import classNames from 'classnames/bind'
import { faArrowLeft, faBookOpen, faBoxOpen, faDownload, faEraser, faImage, faLessThan, faPaperclip, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import RateStars from '../../components/RateStars/RateStars'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../provider/AuthContext'
import { useBook } from '../../provider/BookContext'
import { uploadImage } from '../../api/cloudApi'
import { publishBook, toggleAddToFavorites } from '../../api/bookApi'
import Loader from '../../components/Loader/Loader'
import { useNotification } from '../../components/Notification/NotificationContainer'

const clx = classNames.bind(style)
export default function WorkPage({ type }) {
    const { loading, userInfo, jwt } = useAuth()
    const { showNotification } = useNotification()

    const formRef = useRef()

    const {
        favorites,
        setFavorites,
        works,
        setWorks,
        isEmptyF,
        setIsEmptyF,
        isEmptyW,
        setIsEmptyW,
        fLoading,
        wLoading,
        removeItem,
        removeMyWork,
        setUpdateWorks
    } = useBook()

    const [imgFile, setImgFile] = useState(null)
    const [contentUrl, setContentUrl] = useState()
    const [previewUrl, setPreviewUrl] = useState(null)
    const [pbloading, setPbLoading] = useState(false)

    const [tab, setTab] = useState(1)
    const [title, setTitle] = useState('')
    const [titleCount, setTitleCount] = useState(0)
    const [descriptionCount, setDescriptionCount] = useState(0)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [genre, setGenre] = useState('')
    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')

    const imageInputRef = useRef(null)

    const handleRemove = async (index, id) => {
        if (type === 1){
            // Remove from favorites - use removeItem which will refresh the list
            try {
                const response = await removeItem(index, id)
                if (response) {
                    const isAdded = response.data.isAdded
                    const message = response.data.message || (isAdded 
                        ? "Item has been added to your favorite collection" 
                        : "Item has been removed from your favorite collection")
                    
                    showNotification(message, 'success', 3000)
                }
            } catch (error) {
                console.error('Error removing from favorites:', error)
                showNotification("Failed to remove from favorites. Please try again.", 'error', 3000)
            }
        } else {
            removeMyWork(index, id)
        }
    }

    const handleImageChoose = () => {
        imageInputRef.current.click()
    }

    const handleImgFileChange = (e) => {
        const file = e.target.files[0];
        setImgFile(file)

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    }

    const clearImg = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setImgFile(null)
        setPreviewUrl(null)
    }

    const handlePublish = async () => {
        if (!jwt) return
        if (!title || !imgFile || !contentUrl || !firstName || !lastName || !genre || !description) {
            alert("Please fill out all required fields.")
            return
        }
        try {
            setPbLoading(true)
            setUpdateWorks(true)
            const imgUrl = await uploadImage(imgFile)

            const request = {
                title: title,
                author: firstName + ' ' + lastName,
                description: description,
                contentUrl: contentUrl,
                imageUrl: imgUrl,
                genre: genre,
                price: price.length === 0 ? 0 : price
            }

            const response = await publishBook(request, jwt)
            if (response.statusCode === 0) {
                alert('Publish book success')
                formRef.current.reset()
                clearImg()
                setTitleCount(0)
                setDescriptionCount(0)
            }
        } catch (err) {
            console.log('Error publish', err)
        } finally {
            setUpdateWorks(false)
            setPbLoading(false)
        }
    }

    useEffect(() => {
        setTitleCount(title.length)
    }, [title])

    useEffect(() => {
        setDescriptionCount(description.length)
    }, [description])

    useEffect(() => {
        if (type === 1 && !fLoading) setIsEmptyF(favorites.length === 0)
        if (type === 2 && !wLoading) setIsEmptyW(works.length === 0)
    }, [type, fLoading, wLoading, favorites, works])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    if (loading || userInfo === null) return (<div></div>)

    return (
        <div className={clx('wrapper')}>
            <div className={clx('title')}>
                {tab === 2 && type === 2 && <div className={clx('back-btn')} onClick={() => setTab(1)}>
                    <FontAwesomeIcon className={clx('back-icon')} icon={faArrowLeft} />
                </div>}
                <label>{type === 1 ? 'MY COLLECTION' : (tab === 1 ? 'MY WORK' : 'NEW WORK')}</label>
                {type === 2 && tab === 1 && <div className={clx('add-btn')} onClick={() => setTab(2)}>
                    <FontAwesomeIcon className={clx('plus-icon')} icon={faPlus} />
                </div>}
            </div>
            <div className={clx('slider', { 'next': tab === 2 && type === 2 })}>
                <div className={clx('book-list')}>
                    <div className={clx('header-container', { 'hidden': tab === 2 && type === 2 })}>
                        <div className={clx('table-head')}>
                            <label className={clx('column-label', 'id-space')}>Publish ID</label>
                            <label className={clx('column-label', 'title-space')}>Title</label>
                            <label className={clx('column-label', 'normal-space')}>Genre</label>
                            <label className={clx('column-label', 'normal-space')}>Price</label>
                            <label className={clx('column-label', 'normal-space')}>Rate</label>
                        </div>
                        <div className={clx('seperator')}></div>
                    </div>
                    {!(type === 1 ? isEmptyF : isEmptyW) ?
                        (<div className={clx('list')}>
                            {!(type === 1 ? fLoading : wLoading) && (type === 1 ? favorites : works).map((book, index) => (
                                <Fragment key={book.bookId}>
                                    <div className={clx('book-record', { 'expanded': book.isExpanded })} onClick={() => {
                                        if (type === 1) {
                                            setFavorites(prevfavorites =>
                                                prevfavorites.map((b, i) =>
                                                    i === index ? { ...b, isExpanded: !b.isExpanded } : b
                                                )
                                            );
                                        } else {
                                            setWorks(prevworks =>
                                                prevworks.map((b, i) =>
                                                    i === index ? { ...b, isExpanded: !b.isExpanded } : b
                                                )
                                            );
                                        }
                                    }}>
                                        <div className={clx('record-info')}>
                                            <label className={clx('record-label', 'record-id-space')}>{book.bookId}</label>
                                            <label className={clx('record-label', 'record-title-space', 'orange')}>{book.title}</label>
                                            <label className={clx('record-label', 'record-genre-space', 'yellow')}>{book.genre}</label>
                                            <label className={clx('record-label', 'record-normal-space', { 'cross': book.price > 0, 'pink': book.price > 0, 'green': book.price === 0 })}>
                                                {book.price > 0 ? book.price.toLocaleString() + 'đ' : 'FREE'}
                                            </label>
                                            <div className={clx('rate-container', 'record-normal-space')}>
                                                <label className={'record-label'}>{book.averageRating === null ? '0.0' : book.averageRating.toFixed(1)}</label>
                                                <RateStars rate={book.averageRating} />
                                            </div>
                                        </div>
                                        <div className={clx('book-info')}>
                                            <img src={book.imageUrl} className={clx('book-cover')} />
                                            <div className={clx('description-container')}>
                                                <label className={clx('d-title')}>DESCRIPTION</label>
                                                <p className={clx('d-content')}>{book.description}</p>
                                                <div className={clx('actions')}>
                                                    <a className={clx('action')} href={book.contentUrl}>
                                                        <FontAwesomeIcon className={clx('blue', 'scale-icon')} icon={faDownload} />
                                                        <label className={clx('blue')}>Download</label>
                                                    </a>
                                                    <div className={clx('action')}>
                                                        <FontAwesomeIcon className={clx('orange-yellow', 'scale-icon')} icon={faBookOpen} />
                                                        <label className={clx('orange-yellow')}>Read</label>
                                                    </div>
                                                    <div className={clx('action')} onClick={() => handleRemove(index, book.bookId)}>
                                                        <FontAwesomeIcon className={clx('red', 'scale-icon')} icon={faEraser} />
                                                        <label className={clx('red')}>Remove</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={clx('record-seperator')}></div>
                                </Fragment>
                            ))}
                        </div>)
                        :
                        (
                            <div className={clx('unfound')}>
                                <FontAwesomeIcon icon={faBoxOpen} />
                                <label>No books found.</label>
                            </div>
                        )
                    }
                </div>
                <div className={clx('publish-page')}>
                    <div className={clx('add-book-cover')} onClick={handleImageChoose}>
                        {imgFile ?
                            (
                                <Fragment>
                                    <img src={previewUrl} />
                                    <div className={clx('clear-btn')} onClick={clearImg}>
                                        <FontAwesomeIcon icon={faXmark} />
                                    </div>
                                </Fragment>
                            ) :
                            (
                                <Fragment>
                                    <FontAwesomeIcon icon={faImage} />
                                    <label>Add a book cover</label>
                                    <input ref={imageInputRef} accept='image/*' onChange={handleImgFileChange} className={clx('hidden')} type="file" />
                                </Fragment>)
                        }
                    </div>
                    <div className={clx('book-form')}>
                        <label className={clx('form-title')}>Book information</label>
                        <div className={clx('form-seperator')} />
                        <form ref={formRef}>
                            <div className={clx('input-area')}>
                                <label className={clx('input-title')}>Title:</label>
                                <div className={clx('input-box', 'long')}>
                                    <input id='title-box_asdiw' type='text'
                                        placeholder='Give your book a fantastic title !' required
                                        onChange={(e) => setTitle(e.target.value)} />
                                    <label className={clx('textbox-counter', { 'red': titleCount > 80 })} htmlFor="title-box_asdiw">{`${titleCount}/80`}</label>
                                </div>
                            </div>
                            <div className={clx('input-area')}>
                                <label className={clx('input-title')}>Public URL to your content:</label>
                                <div className={clx('file-input-box', 'long')}>
                                    <input className={clx('url-box')} id='file-box_asd2' type='text' required
                                        onChange={(e) => setContentUrl(e.target.value)}
                                        placeholder='For example: https://mydomain/file.pdf' />
                                </div>
                            </div>
                            <div className={clx('input-area')}>
                                <label className={clx('input-title')}>Author:</label>
                                <div className={clx('name-input-area')}>
                                    <div className={clx('input-box', 'medium')}>
                                        <input type='text' placeholder='First name' required
                                            onChange={(e) => setFirstName(e.target.value)} />
                                    </div>
                                    <div className={clx('input-box', 'medium')}>
                                        <input type='text' placeholder='Last name' required
                                            onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className={clx('combo-input-area')}>
                                <div className={clx('input-area')}>
                                    <label className={clx('input-title')}>Genre:</label>
                                    <div className={clx('input-box', 'short')}>
                                        <input type='text' placeholder='What is the genre of your book ?' required
                                            onChange={(e) => setGenre(e.target.value)} />
                                    </div>
                                </div>
                                <div className={clx('input-area')}>
                                    <label className={clx('input-title')}>Price:</label>
                                    <div className={clx('input-box', 'very-short')}>
                                        <input type='number' placeholder='Sell it ?' required
                                            onChange={(e) => setPrice(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className={clx('input-area')}>
                                <label className={clx('input-title')}>Description:</label>
                                <div className={clx('multiline-box', 'long')}>
                                    <textarea required id='textarea_314asd' rows='4' cols='100'
                                        placeholder='Write a short description about your book...'
                                        onChange={(e) => setDescription(e.target.value)} />
                                    <label className={clx('textarea-counter', { 'red': titleCount > 300 })} htmlFor="textarea_314asd">{`${descriptionCount}/300`}</label>
                                </div>
                            </div>
                            <button className={clx('publish-btn')} type='button' onClick={handlePublish}>
                                Publish
                            </button>
                            <div className={clx('loader-container')}>
                                <Loader type='spinner' isLoading={pbloading} />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}