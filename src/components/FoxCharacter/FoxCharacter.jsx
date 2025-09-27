import classNames from 'classnames/bind'
import style from './FoxCharacter.module.css'
import fox from '../../assets/fox_login.png'
import AutoTypeText from '../AutoTypeText/AutoTypeText'
import { useEffect } from 'react'
import { useAuth } from '../../provider/AuthContext'

const clx = classNames.bind(style)

export const Messages = Object.freeze({
    LOGIN: ["Hello, I'm Fox. Nice to meet you", "Give me your identity", "and I'll let you in !"],
    SIGNUP: ["Hahah, it's me again !", "Let's hold an induction ceremony", "and become a Fox !"],
    LOGIN_FAIL: ["Oops, something wrong with you", "You are not a Fox", "Sorry ! I can't let you in"],
    AFTER_SIGNUP_SUCCESS: ["Great, the induction ceremony is done", "You are now one of us", "Let's confirm it again !"],
    USERNAME_EXIST: ["This username looks familiar", "It's seem to be used before", "Please try another one !"],
    EMAIL_EXIST: ["This email looks familiar", "It's seem to be used before", "Please try another one !"],
    BLANK: ["Hey, don't worry buddy", "Just tell me who you are", "And fill in the blank !"],
    PASSWORD: ["Ok, now move to next step", "Please enter a password", "Read the rules carefully !"],
    INVALID_PASSWORD: ["Oops, something wrong", "You need stronger password", "Read the rules again !"],
    INVALID_EMAIL: ["Hmm, that email doesn't look right", "Please check your email format", "and try again!"]
});

function FoxCharacter() {
    const { message } = useAuth()

    return (
        <div className={clx('fox')}>
            <div className={clx('message')}>
                <AutoTypeText lines={message} />
            </div>
            <div className={clx('fox-body')}>
                <img src={fox} className={clx('fox-character')} />
                <div className={clx('eyes')}>
                    <div className={clx('eye-container', 'left')}>
                        <div className={clx('eye')}></div>
                    </div>
                    <div className={clx('eye-container', 'right')}>
                        <div className={clx('eye')}></div>
                    </div>
                </div>
            </div>
            <div className={clx('shadow')} />
        </div>
    )
}

export default FoxCharacter