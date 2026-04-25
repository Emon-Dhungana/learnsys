import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer" aria-label="Footer">
      <div className="footer-col about">
        <h4>About LearnSys</h4>
        <p>
          LearnSys is an intelligent learning system designed to make study more
          personalized, practical, and progress-driven.
        </p>
      </div>

      <div className="footer-col links">
        <h4>Quick Links</h4>
        <ul>
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Courses</a>
          </li>
          <li>
            <a href="#">Quizzes</a>
          </li>
          <li>
            <a href="#">Dashboard</a>
          </li>
        </ul>
      </div>

      <div className="footer-col copy">
        <h4>Contact</h4>
        <p>support@learnsys.app</p>
        <p className="copyright">© 2026 LearnSys. All rights reserved.</p>
      </div>

      <div className="footer-admin-access" aria-label="Admin access">
        <Link className="footer-admin-link" to="/admin">
          Admin Login
        </Link>
      </div>
    </footer>
  )
}

export default Footer
