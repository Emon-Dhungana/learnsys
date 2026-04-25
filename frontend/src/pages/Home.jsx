import { Link } from 'react-router-dom'
import { addDoc, collection } from 'firebase/firestore'
import HeroSection from '../components/home/HeroSection'
import InfoSection from '../components/home/InfoSection'
import FeatureCard from '../components/home/FeatureCard'
import ScrollToTopButton from '../components/ScrollToTopButton'
import Footer from '../components/Footer'
import { db } from '../firebase'

function Home({ onOpenAdminAuth }) {
  const handleFirestoreTest = async () => {
    try {
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello Firestore',
      })

      console.log('Firestore test write succeeded. Document ID:', docRef.id)
    } catch (error) {
      console.error('Firestore test write failed:', error)
    }
  }

  const moduleItems = [
    {
      icon: 'LS',
      title: 'Learning System',
      description:
        'Structured PDFs, course resources, and admin-managed materials organized by categories and subcategories.',
      tone: 'blue',
    },
    {
      icon: 'QZ',
      title: 'Quiz System',
      description:
        'Practice admin-created quizzes and build your own quizzes with category-focused attempts.',
      tone: 'cyan',
    },
    {
      icon: 'TP',
      title: 'Typing System',
      description:
        'Use Practice and Test modes with WPM, accuracy, weak-letter analysis, and hand-balance insights.',
      tone: 'mint',
    },
    {
      icon: 'PT',
      title: 'Performance System',
      description:
        'Track dashboard analytics with personalized recommendations based on preferences and learning behavior.',
      tone: 'indigo',
    },
  ]

  const featureItems = [
    {
      icon: 'LM',
      title: 'Learning Materials',
      description:
        'Access structured PDFs and guided lesson content that supports focused, self-paced study.',
    },
    {
      icon: 'AQ',
      title: 'Adaptive Quizzes',
      description:
        'Practice with admin and user-driven quizzes using category filtering and result reviews.',
    },
    {
      icon: 'TP',
      title: 'Typing Practice',
      description:
        'Improve speed and accuracy with live highlighting, test timers, and analytics-backed insights.',
    },
    {
      icon: 'DG',
      title: 'Performance Tracking',
      description:
        'Visualize strengths, weak areas, and progress through dashboards and recommendation modules.',
    },
  ]

  const stepItems = [
    'User signs up and logs in to access personalized tools.',
    'User selects preferences from admin-managed learning categories.',
    'User studies via courses, quizzes, and typing practice sessions.',
    'System tracks performance and adapts recommendations over time.',
  ]

  const benefitItems = [
    {
      title: 'Personalized Learning',
      description:
        'Preferences and dashboard signals tailor recommendations to each learner profile.',
    },
    {
      title: 'Adaptive Quizzes',
      description:
        'Practice using admin question banks and custom user quiz creation in one unified workflow.',
    },
    {
      title: 'Skill Tracking',
      description:
        'Typing metrics, quiz outcomes, and behavior insights help identify weak points quickly.',
    },
    {
      title: 'Centralized Platform',
      description:
        'Courses, quizzes, typing, preferences, and analytics all operate in a single system.',
    },
  ]

  return (
    <div className="home-page">
      <HeroSection />

      <InfoSection
        id="platform-overview"
        title="Everything You Need to Learn Smarter"
        subtitle="LearnSys combines course delivery, quizzes, typing intelligence, and analytics into one integrated product flow."
      >
        <div className="home-grid home-grid-modules">
          {moduleItems.map((item) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              tone={item.tone}
            />
          ))}
        </div>
      </InfoSection>

      <InfoSection
        id="feature-stack"
        title="Core Features That Drive Progress"
        subtitle="Every module is engineered for practical learning outcomes and measurable improvements."
      >
        <div className="home-grid home-grid-features">
          {featureItems.map((item) => (
            <FeatureCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </InfoSection>

      <InfoSection
        id="how-it-works"
        title="How It Works"
        subtitle="A clear learning flow from onboarding to continuous improvement."
      >
        <div className="home-steps">
          {stepItems.map((step, index) => (
            <article key={step} className="home-step-card">
              <p className="home-step-index">Step {index + 1}</p>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </InfoSection>

      <InfoSection
        id="why-learnsys"
        title="Why LearnSys"
        subtitle="Designed for learners who need personalization, performance visibility, and practical tools in one product."
      >
        <div className="home-grid home-grid-benefits">
          {benefitItems.map((item) => (
            <article key={item.title} className="home-benefit-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </InfoSection>

      <section className="home-cta home-section" aria-labelledby="home-cta-heading">
        <div className="home-cta-card">
          <h2 id="home-cta-heading">Start Your Learning Journey Today</h2>
          <p>
            Build better study habits with personalized content, structured practice,
            and measurable progress tracking across every module.
          </p>

          <div className="home-cta-actions">
            <Link to="/courses" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/dashboard" className="btn btn-light btn-large">
              View Dashboard
            </Link>
            <button type="button" className="btn btn-light btn-large" onClick={handleFirestoreTest}>
              Test Firestore
            </button>
          </div>
        </div>
      </section>

      <Footer onOpenAdminAuth={onOpenAdminAuth} />
      <ScrollToTopButton />
    </div>
  )
}

export default Home
