import style from './LoginPage.module.css'
import logo from '../../assets/fox.png'
import google from '../../assets/google.png'
import facebook from '../../assets/facebook.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { Link, useNavigate } from 'react-router-dom'
import classNames from 'classnames/bind'
import FloatingHintTextBox from '../../components/FloatingHintTextBox/FloatingHintTextBox.'
import { useAuth } from '../../provider/AuthContext'
import Loader from '../../components/Loader/Loader'
import { useState, useEffect } from 'react'
import { Messages } from '../../components/FoxCharacter/FoxCharacter'

const clx = classNames.bind(style);

function LoginPage() {
  const { login, loading, setMessage } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMessage(Messages.LOGIN);
  }, []);

  // Username validation: 6–32 chars, only letters/numbers/_
  const isValidUsername = (name) => {
    const usernameRegex = /^[A-Za-z0-9_]{6,32}$/;
    return usernameRegex.test(name);
  };

  // Password validation: 6–32 chars, at least one letter, one number, one special char, no spaces
  const isValidPassword = (pass) => {
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{6,32}$/;
    return passwordRegex.test(pass) && !/\s/.test(pass);
  };

  const handleLogin = async () => {
    if (isSubmitting) return; // Prevent double-click

    // Reject empty fields
    if (username.trim().length === 0 || password.trim().length === 0) {
      setMessage(Messages.BLANK);
      return;
    }

    // Validate username and password
    if (!isValidUsername(username)) {
      setMessage(Messages.BLANK);
      return;
    }

    if (!isValidPassword(password)) {
      setMessage(Messages.BLANK);
      return;
    }

    const credentials = {
      username: username.trim(),
      password,
    };

    setIsSubmitting(true);
    const success = await login(credentials);
    setIsSubmitting(false);

    if (success) {
      setUsername("");
      setPassword("");
    }
  };

  return (
    <form className={clx("login-container")}>
      <img className={clx("logo")} src={logo} alt="Logo" />
      <label className={clx("title")}>LOGIN</label>

      <FloatingHintTextBox
        hint="Username"
        value={username}
        type="text"
        onChange={(e) => setUsername(e.target.value)}
      />

      <FloatingHintTextBox
        hint="Password"
        value={password}
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Link to="/auth/reset-password" className={clx("reset-pw-link")}>
        Forgot password ?
      </Link>

      <div className={clx("loader-container")}>
        <Loader type="dots" isLoading={loading} />
      </div>

      <button
        type="button"
        className={clx("login-btn")}
        onClick={() => handleLogin()}
      >
        <label>Join the Base</label>
      </button>

      <div className={clx("seperator")}>
        <div></div>
        <label>OR</label>
      </div>

      <a
        className={clx("third-party-auth-button")}
        href="http://localhost:8080/foxbase-be/oauth2/authorization/google"
      >
        <img src={google} alt="Google" />
        <label>Log in with Google</label>
      </a>

      <Link
        className={clx("create-account-link")}
        to="/auth/signin"
        onClick={() => setMessage(Messages.SIGNUP)}
      >
        <img src={logo} alt="Logo" />
        <label>Become a Fox</label>
        <FontAwesomeIcon
          className={clx("arrow-right-icon")}
          icon={faArrowRight}
        />
      </Link>
    </form>
  );
}

export default LoginPage;