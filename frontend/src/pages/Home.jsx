import Hero from '../components/Hero'
import SectionHeader from '../components/SectionHeader'
import InfoCard from '../components/InfoCard'
import Footer from '../components/Footer'

function Home() {
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
        'Practice with quizzes that adjust difficulty based on your progress and understanding.',
    },
    {
      icon: 'TP',
      title: 'Typing Practice',
      description:
        'Improve speed and accuracy in both English and Nepali through targeted drills.',
    },
    {
      icon: 'PT',
      title: 'Performance Tracking',
      description:
        'Visualize strengths, weak areas, and milestones with clear performance insights.',
    },
  ]

  const sampleResources = [
    {
      icon: 'CS',
      title: 'Computer Science Fundamentals',
      description: 'Core concepts, notes, and interactive checkpoints for foundational topics.',
    },
    {
      icon: 'MA',
      title: 'Applied Mathematics',
      description: 'Stepwise lessons with solved examples and quick revision worksheets.',
    },
    {
      icon: 'EN',
      title: 'Academic English Lab',
      description: 'Reading, grammar, and writing exercises tailored to your skill level.',
    },
  ]

  return (
    <>
      <Hero />

      <section className="section features" aria-labelledby="features-heading">
        <SectionHeader
          id="features-heading"
          title="Powerful Learning Features"
          subtitle="Everything you need for focused, personalized, and measurable learning."
        />

        <div className="card-grid feature-grid">
          {featureItems.map((item) => (
            <InfoCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <section className="section resources" aria-labelledby="resources-heading">
        <SectionHeader
          id="resources-heading"
          title="Explore Sample Resources"
          subtitle="Preview how courses and resources are presented in LearnSys."
        />

        <div className="card-grid resource-grid">
          {sampleResources.map((item) => (
            <InfoCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              variant="compact"
            />
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}

export default Home
