import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimesCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import style from './Notification.module.css'
import classNames from 'classnames/bind'

const clx = classNames.bind(style)

export default function Notification({ message, type = 'success', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => {
                if (onClose) onClose()
            }, 300) // Wait for animation to complete
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(() => {
            if (onClose) onClose()
        }, 300)
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
            <button className={clx('close-btn')} onClick={handleClose}>
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>
    )
}

