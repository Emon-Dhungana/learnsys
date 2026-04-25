import { useMemo, useState } from 'react'

function AuthModal({ isOpen, view, onClose, onSwitchView, onLogin, onSignup }) {
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: '',
  })
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState('')

  const modalTitle = useMemo(() => {
    return view === 'login' ? 'Login to LearnSys' : 'Create your LearnSys account'
  }, [view])

  const resetError = () => setErrorMessage('')

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
    resetError()
  }

  const handleSignupChange = (event) => {
    const { name, value } = event.target
    setSignupData((prev) => ({ ...prev, [name]: value }))
    resetError()
  }

  const submitLogin = (event) => {
    event.preventDefault()

    if (!loginData.identifier.trim() || !loginData.password.trim()) {
      setErrorMessage('Please fill in your identifier and password.')
      return
    }

    onLogin({
      identifier: loginData.identifier.trim(),
      password: loginData.password,
    })

    setLoginData({ identifier: '', password: '' })
    setErrorMessage('')
  }

  const submitSignup = (event) => {
    event.preventDefault()

    if (!signupData.username.trim() || !signupData.email.trim() || !signupData.password.trim()) {
      setErrorMessage('Please complete all signup fields.')
      return
    }

    onSignup({
      username: signupData.username.trim(),
      email: signupData.email.trim(),
      password: signupData.password,
    })

    setSignupData({ username: '', email: '', password: '' })
    setErrorMessage('')
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
      setErrorMessage('')
    }
  }

  const handleClose = () => {
    onClose()
    setErrorMessage('')
  }

  return (
    <div
      className={`auth-modal-overlay ${isOpen ? 'is-open' : ''}`}
      role="presentation"
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
    >
      <section className="auth-modal" role="dialog" aria-modal="true" aria-label={modalTitle}>
        <button type="button" className="auth-close" aria-label="Close auth modal" onClick={handleClose}>
          X
        </button>

        <h3>{modalTitle}</h3>

        <div className="auth-tabs" role="tablist" aria-label="Authentication tabs">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'login'}
            className={`auth-tab ${view === 'login' ? 'is-active' : ''}`}
            onClick={() => {
              onSwitchView('login')
              resetError()
            }}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'signup'}
            className={`auth-tab ${view === 'signup' ? 'is-active' : ''}`}
            onClick={() => {
              onSwitchView('signup')
              resetError()
            }}
          >
            Signup
          </button>
        </div>

        {view === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <label htmlFor="login-identifier">Email or Username</label>
            <input
              id="login-identifier"
              type="text"
              name="identifier"
              value={loginData.identifier}
              onChange={handleLoginChange}
              placeholder="Enter email or username"
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              placeholder="Enter password"
            />

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <button type="submit" className="btn btn-primary auth-submit">
              Login
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitSignup}>
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              name="username"
              value={signupData.username}
              onChange={handleSignupChange}
              placeholder="Choose a username"
            />

            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              value={signupData.email}
              onChange={handleSignupChange}
              placeholder="Enter your email"
            />

            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              value={signupData.password}
              onChange={handleSignupChange}
              placeholder="Create password"
            />

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <button type="submit" className="btn btn-primary auth-submit">
              Signup
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

export default AuthModal
