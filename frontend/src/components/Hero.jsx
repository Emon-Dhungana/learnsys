function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <p className="hero-tag">AI-Powered Study Experience</p>
        <h1 id="hero-title">Smart Learning Platform</h1>
        <p className="hero-subtext">
          LearnSys uses intelligent personalization to recommend the right materials,
          quizzes, and practice activities so every learner can improve with clarity
          and confidence.
        </p>

        <div className="hero-actions">
          <button type="button" className="btn btn-primary btn-large">
            Get Started
          </button>
          <button type="button" className="btn btn-light btn-large">
            Explore Courses
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
