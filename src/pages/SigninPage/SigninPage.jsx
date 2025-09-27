import style from './SigninPage.module.css'
import logo from '../../assets/fox.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faCheck, faArrowLeft, faArrowRight, faN } from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate } from 'react-router-dom'
import classNames from 'classnames/bind'
import FloatingHintTextBox from '../../components/FloatingHintTextBox/FloatingHintTextBox.'
import { useState, useEffect } from 'react'
import PasswordReqList from '../../components/PasswordReqList/PasswordReqList'
import { useAuth } from '../../provider/AuthContext'
import Loader from '../../components/Loader/Loader'
import { Messages } from '../../components/FoxCharacter/FoxCharacter'

const clx = classNames.bind(style)

function SigninPage() {
    const { userRegister, loading, setMessage } = useAuth()

    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [fName, setFName] = useState('')
    const [lName, setLName] = useState('')

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    const [validPassword, setValidPassword] = useState(false)

    const [next, setNext] = useState(false)

    useEffect(() => {
        // Ensure SIGNUP message is set when component mounts
        setMessage(Messages.SIGNUP)
    }, [])

    const handleSetNext = () => {
        // Validate all fields are filled
        if (username.trim().length > 0 && email.trim().length > 0 && fName.trim().length > 0 && lName.trim().length > 0) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email.trim())) {
                setMessage(Messages.INVALID_EMAIL)
                return
            }
            setNext(true)
            setMessage(Messages.PASSWORD)
        }
        else setMessage(Messages.BLANK)
    }

    const resetAllFields = () => {
        setUsername('')
        setEmail('')
        setFName('')
        setLName('')
        setPassword('')
        setConfirm('')
    }

    const handleRegister = async () => {
        if (!validPassword) {
            setMessage(Messages.INVALID_PASSWORD)
            return
        }

        const info = {
            username: username,
            email: email,
            password: password,
            lName: lName,
            fName: fName,
            balance: 0
        }

        const success = await userRegister(info)
        if (success) {
            resetAllFields()
            setNext(false)
            navigate("/auth/login")
        }
    }

    return (
        <form className={clx('signin-container')}>
            <img className={clx('logo')} src={logo} />
            <label className={clx('title')}>SIGN UP</label>
            <div className={clx('info-container')}>
                <div className={clx('slider', { 'next': next })}>
                    <div className={clx('step-container')}>
                        <FloatingHintTextBox hint='Username' value={username} onChange={(e) => setUsername(e.target.value)} />
                        <FloatingHintTextBox hint='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
                        <FloatingHintTextBox hint='First name' value={fName} onChange={(e) => setFName(e.target.value)} />
                        <FloatingHintTextBox hint='Last name' value={lName} onChange={(e) => setLName(e.target.value)} />
                        <div className={clx('next-btn')} onClick={handleSetNext}>
                            <label>Go to next step</label>
                            <FontAwesomeIcon icon={faArrowRight} />
                        </div>
                    </div>
                    <div className={clx('step-container')}>
                        <FloatingHintTextBox hint='Password' value={password} type='password' onChange={(e) => setPassword(e.target.value)} />
                        <FloatingHintTextBox hint='Confirm password' value={confirm} type='password' onChange={(e) => setConfirm(e.target.value)} />
                        <PasswordReqList password={password} confirm={confirm} onValidityChange={setValidPassword} />
                        <div className={clx('next-btn')} onClick={() => {
                            setNext(false)
                            setMessage(Messages.SIGNUP)
                        }}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                            <label>Go back to previous step</label>
                        </div>
                        <button type='button' className={clx('signup-btn')} onClick={() => handleRegister()}>
                            Join the Foxes
                        </button>
                        <div className={clx('loader-container')}>
                            <Loader type='spinner' isLoading={loading} />
                        </div>
                    </div>
                </div>
            </div>
            <Link className={clx('login-link')} to='/auth/login' onClick={() => setMessage(Messages.LOGIN)}>
                <FontAwesomeIcon className={clx('login-link-icon')} icon={faArrowLeft} />
                <label>Are you a Fox ? Log in now !</label>
            </Link>
        </form>
    )
}

export default SigninPage
