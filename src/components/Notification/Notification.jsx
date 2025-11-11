import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimesCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import style from './Notification.module.css'
import classNames from 'classnames/bind'

const clx = classNames.bind(style)

export default function Notification({ message, type = 'success', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(true)
    const [isRemoved, setIsRemoved] = useState(false)

    useEffect(() => {
        if (isRemoved) return
        
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => {
                if (onClose) onClose()
            }, 300) // Wait for animation to complete
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose, isRemoved])

    const handleClose = (e) => {
        e?.stopPropagation()
        e?.preventDefault()
        if (isRemoved) return
        setIsRemoved(true)
        setIsVisible(false)
        // Call onClose immediately to remove from list
        if (onClose) {
            onClose()
        }
    }

    return (
        <div className={clx('notification', { 'visible': isVisible, 'success': type === 'success', 'error': type === 'error' })}>
            <div className={clx('icon-container')}>
                <FontAwesomeIcon
                    icon={type === 'success' ? faCheckCircle : faTimesCircle}
                    className={clx('icon', { 'success-icon': type === 'success', 'error-icon': type === 'error' })}
                />
            </div>
            <div className={clx('message')}>{message}</div>
            <button 
                className={clx('close-btn')} 
                onClick={handleClose}
                type="button"
                aria-label="Close notification"
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>
    )
}

