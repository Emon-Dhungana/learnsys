import { useState } from 'react'

function AdminAuthModal({ isOpen, error, onClose, onSubmit }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(credentials)
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={`auth-modal-overlay ${isOpen ? 'is-open' : ''}`}
      role="presentation"
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
    >
      <section className="auth-modal" role="dialog" aria-modal="true" aria-label="Admin login">
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close admin login">
          X
        </button>

        <h3>Admin Login</h3>
        <p className="auth-subtext">Authenticate to access the admin dashboard.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-auth-username">Username</label>
          <input
            id="admin-auth-username"
            name="username"
            type="text"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Enter admin username"
          />

          <label htmlFor="admin-auth-password">Password</label>
          <input
            id="admin-auth-password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Enter admin password"
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-actions">
            <button type="button" className="btn btn-light" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AdminAuthModal
