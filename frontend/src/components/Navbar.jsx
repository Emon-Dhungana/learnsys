function Navbar({ links, user, onOpenAuth, onLogout, onNavClick }) {
  const handleNavItemClick = (event, link) => {
    event.preventDefault()
    onNavClick(link)
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar" aria-label="Main navigation">
        <a
          className="brand"
          href="#"
          aria-label="LearnSys home"
          onClick={(event) => {
            event.preventDefault()
            onNavClick('Home')
          }}
        >
          LearnSys
        </a>

        <ul className="nav-links">
          {links.map((link) => (
            <li key={link}>
              <a href="#" onClick={(event) => handleNavItemClick(event, link)}>
                {link}
              </a>
            </li>
          ))}
        </ul>

        <div className="auth-actions">
          {user ? (
            <>
              <p className="welcome-user">Welcome, {user.username}</p>
              <button type="button" className="btn btn-light" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => onOpenAuth('login')}
              >
                Login
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onOpenAuth('signup')}
              >
                Signup
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
