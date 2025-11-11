import { createContext, useContext, useState, useCallback } from 'react'
import Notification from './Notification'
import style from './NotificationContainer.module.css'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])

    const showNotification = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random()
        const notification = { id, message, type, duration }

        // Only show 1 notification at a time
        // Replace old notification with new one
        setNotifications([notification])

        return id
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className={style.container}>
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        message={notification.message}
                        type={notification.type}
                        duration={notification.duration}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    )
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider')
    }
    return context
}

