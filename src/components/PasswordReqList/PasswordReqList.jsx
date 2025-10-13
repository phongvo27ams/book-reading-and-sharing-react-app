import style from './PasswordReqList.module.css'
import classNames from 'classnames/bind'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'

const clx = classNames.bind(style)
function PasswordReqList({ password, confirm, onValidityChange }) {
    const [validNumOfChar, setValidNumOfChar] = useState(false)
    const [hasCapLetterAndDigit, setHasCapLetterAndDigit] = useState(false)
    const [hasSpecChar, setHasSpecChar] = useState(false)
    const [matchPassword, setMatchPassword] = useState(false)

    useEffect(() => {
        const isValid = validNumOfChar && hasCapLetterAndDigit && hasSpecChar && matchPassword
        onValidityChange?.(isValid)
    }, [validNumOfChar, hasCapLetterAndDigit, hasSpecChar, matchPassword])


    useEffect(() => {
        var capletters = 0
        var digits = 0
        var spec = 0

        for (const c of password) {
            if (/\d/.test(c)) digits++;
            else if (/[A-Z]/.test(c)) capletters++
            else if (/[^a-zA-Z0-9]/.test(c)) spec++
        }

        setValidNumOfChar(password.length >= 6)
        setHasCapLetterAndDigit(capletters >= 1 && digits >= 1)
        setHasSpecChar(spec >= 1)
    }, [password])

    useEffect(() => {
        setMatchPassword(password == confirm && password != '')
    }, [password, confirm])

    return (
        <ul className={clx('cond-list')}>
            <li className={clx('req')}>
                <FontAwesomeIcon className={clx({ 'req-icon': true, 'ok': validNumOfChar })}
                    icon={validNumOfChar ? faCheck : faXmark} />
                <label className={clx({ 'ok': validNumOfChar })}>At least 6 characters</label>
            </li>
            <li className={clx('req')}>
                <FontAwesomeIcon className={clx({ 'req-icon': true, 'ok': hasCapLetterAndDigit })}
                    icon={hasCapLetterAndDigit ? faCheck : faXmark} />
                <label className={clx({ 'ok': hasCapLetterAndDigit })}>At least 1 capital letter and 1 digit</label>
            </li>
            <li className={clx('req')}>
                <FontAwesomeIcon className={clx({ 'req-icon': true, 'ok': hasSpecChar })}
                    icon={hasSpecChar ? faCheck : faXmark} />
                <label className={clx({ 'ok': hasSpecChar })}>At least 1 special character</label>
            </li>
            <li className={clx('req')}>
                <FontAwesomeIcon className={clx({ 'req-icon': true, 'ok': matchPassword })}
                    icon={matchPassword ? faCheck : faXmark} />
                <label className={clx({ 'ok': matchPassword })}>Match password confirm</label>
            </li>
        </ul>
    )
}

export default PasswordReqList