import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';

import style from './LoginPage.module.css';
import logo from '../../assets/fox.png';
import google from '../../assets/google.png';

import FloatingHintTextBox from '../../components/FloatingHintTextBox/FloatingHintTextBox.';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../provider/AuthContext';
import { Messages } from '../../components/FoxCharacter/FoxCharacter';

const clx = classNames.bind(style);

function LoginPage() {
  const { login, loading, setMessage } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMessage(Messages.LOGIN);
    setErrorMessage("");
  }, []);

  // Username validation: 6–32 chars, only letters/numbers/_
  const isValidUsername = (name) => /^[A-Za-z0-9_]{6,32}$/.test(name);

  // Password validation: 6–32 chars, at least one letter, number, special char, no spaces
  const isValidPassword = (pass) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{6,32}$/.test(pass) &&
    !/\s/.test(pass);

  const handleLogin = async () => {
    if (isSubmitting) return;

    // Reset lỗi trước khi check
    setErrorMessage("");

    if (username.trim().length === 0 || password.trim().length === 0) {
      setMessage(Messages.BLANK);
      setErrorMessage("Please enter both username and password.");
      return;
    }

    if (!isValidUsername(username)) {
      setMessage(Messages.BLANK);
      setErrorMessage("Username must be 6-32 characters and contain no spaces or special characters.");
      return;
    }

    if (!isValidPassword(password)) {
      setMessage(Messages.BLANK);
      setErrorMessage("Password must be 6-32 characters, include at least one letter, one number, and one special symbol.");
      return;
    }

    setIsSubmitting(true);
    const success = await login({
      username: username.trim(),
      password,
    });
    setIsSubmitting(false);

    if (success) {
      setUsername("");
      setPassword("");
      setErrorMessage(""); // Clear error message when logged in
    } else {
      setErrorMessage("Login failed. Please check your credentials.");
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

      {/* Error message */}
      {errorMessage && (
        <div className={clx("error-message")}>
          <span>{errorMessage}</span>
        </div>
      )}

      <Link to="/auth/reset-password" className={clx("reset-pw-link")}>
        Forgot password ?
      </Link>

      <div className={clx("loader-container")}>
        <Loader type="dots" isLoading={loading || isSubmitting} />
      </div>

      <button
        type="button"
        className={clx("login-btn")}
        onClick={handleLogin}
        disabled={isSubmitting}
      >
        <label>{isSubmitting ? "Logging in..." : "Join the Base"}</label>
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