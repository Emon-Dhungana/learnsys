import { Link } from 'react-router-dom'

function HeroSection() {
  return (
    <section className="home-hero home-section" id="hero" aria-labelledby="home-hero-title">
      <div className="home-hero-content">
        <p className="home-hero-tag">AI-Powered Study Experience</p>
        <h1 id="home-hero-title">Smart Learning Platform</h1>
        <p>
          LearnSys unifies admin-managed courses, adaptive quizzes, typing analytics,
          and personalized recommendations into one focused learning environment.
        </p>

        <div className="home-hero-actions">
          <Link to="/courses" className="btn btn-primary btn-large">
            Get Started
          </Link>
          <a href="#platform-overview" className="btn btn-light btn-large">
            Explore Courses
          </a>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
