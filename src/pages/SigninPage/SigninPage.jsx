import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../provider/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';

import style from './SigninPage.module.css';
import logo from '../../assets/fox.png';
import FloatingHintTextBox from '../../components/FloatingHintTextBox/FloatingHintTextBox.';
import PasswordReqList from '../../components/PasswordReqList/PasswordReqList';
import Loader from '../../components/Loader/Loader';
import ReCAPTCHA from 'react-google-recaptcha'
import { Messages } from '../../components/FoxCharacter/FoxCharacter';
import { Toaster, toast } from 'react-hot-toast';

const clx = classNames.bind(style);

function SigninPage() {
  const { userRegister, loading, setMessage } = useAuth();
  const navigate = useNavigate();

  const recaptchaRef = useRef(null)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
  const [captchaToken, setCaptchaToken] = useState(null)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [next, setNext] = useState(false);

  const [validPassword, setValidPassword] = useState(false);

  useEffect(() => {
    setMessage(Messages.SIGNUP)
  }, []);

  // Validation functions
  const isValidUsername = (name) => /^[A-Za-z0-9_]{6,32}$/.test(name);
  const isValidEmail = (mail) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  const isValidName = (name) => /^[A-Za-zÀ-ỹ\s'-]{1,32}$/.test(name);

  const handleSetNext = () => {
    if (!username.trim() || !email.trim() || !fName.trim() || !lName.trim()) {
      setMessage(Messages.BLANK);
      toast.error('Please fill in all fields.')
      return;
    }

    if (!isValidUsername(username.trim())) {
      setMessage(Messages.BLANK);
      toast.error('Username must be 6-32 characters: letters, numbers, or underscores only.')
      return;
    }

    if (email.trim().length < 6 || email.trim().length > 32) {
      setMessage(Messages.INVALID_EMAIL);
      toast.error('Email must be 6-32 characters long.')
      return;
    }

    if (!isValidEmail(email.trim())) {
      setMessage(Messages.INVALID_EMAIL);
      toast.error('Please enter a valid email address.')
      return;
    }

    if (!isValidName(fName.trim()) || !isValidName(lName.trim())) {
      setMessage(Messages.BLANK);
      toast.error('First name and Last name must be valid.')
      return;
    }

    setNext(true);
    setMessage(Messages.PASSWORD);
  }

  const resetAllFields = () => {
    setUsername('');
    setEmail('');
    setFName('');
    setLName('');
    setPassword('');
    setConfirm('');
    setNext(false);
    setValidPassword(false);
  }

  const handleRegister = async () => {
    // Step 2 validation
    if (password.trim().length < 6 || password.trim().length > 32) {
      setMessage(Messages.INVALID_PASSWORD);
      toast.error('Password must be 6-32 characters long.')
      return;
    }

    if (!validPassword || password !== confirm) {
      setMessage(Messages.INVALID_PASSWORD);
      toast.error('Password is invalid or does not match confirmation.')
      return;
    }

    // For reCAPTCHA v2 (tickbox), require the client-side token from onChange
    if (siteKey && !captchaToken) {
      toast.error('Please complete the captcha to verify you are not a robot.')
      return
    }

    try {
      const info = {
        username: username.trim(),
        email: email.trim(),
        password,
        fName: fName.trim(),
        lName: lName.trim(),
        balance: 0,
        captchaToken,
      }

      // Debug: print registration payload
      // try {
      //   if (import.meta.env.MODE !== 'production') {
      //     const debugInfo = { ...info, password: '***MASKED***' }
      //     console.log('Register payload:', debugInfo)
      //   }
      // } catch (e) {
      //   // Ignore logging errors
      // }

      const result = await userRegister(info);
      const success = typeof result === "boolean" ? result : result?.success;

      if (success) {
        resetAllFields();
        navigate('/auth/login');
        return;
      }

      const { errorCode, errorMessage } = typeof result === "object" && result !== null ? result : {};

      switch (errorCode) {
        case "USERNAME_EXIST":
          toast.error("That username is already in use. Please choose another one.");
          break;
        case "EMAIL_EXIST":
          toast.error("That email is already associated with an account. Use a different email.");
          break;
        default:
          toast.error(errorMessage || "Registration failed. Please try again.");
          break;
      }
      toast.error(errorMessage)
    } catch (err) {
      toast.error('Registration failed. Please try again.')
    } finally {
      try {
        if (recaptchaRef && recaptchaRef.current) recaptchaRef.current.reset()
      } catch (e) {
        // Ignore reset errors
      }
      // Clear local captcha token so user must re-validate next time
      setCaptchaToken(null)
    }
  }

  return (
    <form className={clx('signin-container')}>
      <Toaster position="top-right" reverseOrder={false} />
      <img className={clx('logo')} src={logo} alt="Logo" />
      <label className={clx('title')}>SIGN UP</label>

      <div className={clx('info-container')}>
        <div className={clx('slider', { next })}>
          {/* Step 1 */}
          <div className={clx('step-container')}>
            <FloatingHintTextBox
              hint="Username"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
              }}
            />
            <FloatingHintTextBox
              hint="Email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
              }}
            />
            <FloatingHintTextBox
              hint="First name"
              value={fName}
              onChange={e => {
                setFName(e.target.value);
              }}
            />
            <FloatingHintTextBox
              hint="Last name"
              value={lName}
              onChange={e => {
                setLName(e.target.value);
              }}
            />
            <div className={clx('next-btn')} onClick={handleSetNext}>
              <label>Go to next step</label>
              <FontAwesomeIcon icon={faArrowRight} />
            </div>
          </div>

          {/* Step 2 */}
          <div className={clx('step-container')}>
            <FloatingHintTextBox
              hint="Password"
              data-testid="password-input"
              value={password}
              type="password"
              onChange={e => {
                setPassword(e.target.value);
              }}
            />
            <FloatingHintTextBox
              hint="Confirm password"
              data-testid="confirm-input"
              value={confirm}
              type="password"
              onChange={e => {
                setConfirm(e.target.value);
              }}
            />
            <PasswordReqList password={password} confirm={confirm} onValidityChange={setValidPassword} />

            <div className={clx('next-btn')} onClick={() => { setNext(false); setMessage(Messages.SIGNUP);}}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <label>Go back to previous step</label>
            </div>

            <button type="button" className={clx('signup-btn')} onClick={handleRegister} disabled={loading}>
              Join the Foxes
            </button>

            <div className={clx('loader-container')}>
              <Loader type="spinner" isLoading={loading} />
            </div>
            
            {siteKey && (
              <div className={clx('captcha-wrapper')}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={siteKey}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Link className={clx('login-link')} to="/auth/login" onClick={() => setMessage(Messages.LOGIN)}>
        <FontAwesomeIcon className={clx('login-link-icon')} icon={faArrowLeft} />
        <label>Are you a Fox ? Log in now !</label>
      </Link>
    </form>
  );
}

export default SigninPage;