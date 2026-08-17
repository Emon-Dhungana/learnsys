import { useState } from 'react'

const TYPING_LESSONS = {
  Basic: {
    level: 1,
    description: 'Start with fundamental typing practice',
    lessons: [
      {
        id: 'basic-1',
        title: 'Home Row Keys',
        content:
          'Master the home row keys: a s d f j k l. These keys are the foundation of touch typing. Keep your fingers on these keys and practice moving without looking down.',
        texts: [
          'The quick brown fox jumps over the lazy dog.',
          'A quick brown fox jumps over the lazy dog.',
          'The fox jumps over the lazy dog quickly.',
        ],
      },
      {
        id: 'basic-2',
        title: 'Top Row Keys',
        content:
          'Now learn the top row: q w e r t y u i o p. Combine these with the home row for more complete practice.',
        texts: [
          'The typewriter quickly typed the words here.',
          'We type the question with quick fingers.',
          'Your typing quest starts with practice today.',
        ],
      },
      {
        id: 'basic-3',
        title: 'Bottom Row Keys',
        content:
          'Practice the bottom row: z x c v b n m. These complete your basic typing foundation.',
        texts: [
          'The man can make the box very quickly.',
          'Zero mistakes come from careful practice each day.',
          'Exact timing and careful method make perfect work.',
        ],
      },
    ],
  },
  Intermediate: {
    level: 2,
    description: 'Build speed and accuracy with varied content',
    lessons: [
      {
        id: 'intermediate-1',
        title: 'Common Words',
        content:
          'Type common English words with consistent accuracy. Focus on maintaining rhythm and precision.',
        texts: [
          'Learning becomes powerful when consistency, reflection, and deliberate practice work together each day.',
          'The best study routine is one that balances deep focus, short breaks, and clear goals.',
          'Strong learners ask better questions, review mistakes honestly, and return with strategy.',
        ],
      },
      {
        id: 'intermediate-2',
        title: 'Numbers and Symbols',
        content:
          'Increase difficulty by typing numbers and symbols mixed with regular text. Speed and accuracy are equally important.',
        texts: [
          'The price is $45.99 and the quantity is 100 units available today.',
          'Order #12345 was placed on 2024-01-15 with discount code SAVE20.',
          'Contact us at +1-800-555-1234 or email support@example.com for help.',
        ],
      },
      {
        id: 'intermediate-3',
        title: 'Longer Passages',
        content:
          'Type longer, more complex passages to improve stamina and maintain consistency over extended sessions.',
        texts: [
          'Typing skill improves faster when you prioritize accuracy first and speed second with patient repetition. The fingers learn muscle memory through consistent practice, and the mind develops a better connection with the keyboard layout.',
          'Small improvements tracked over time become meaningful progress that builds confidence and mastery. Every session adds to your foundation, and consistency matters more than intensity in building lasting skills.',
          'The journey to typing mastery requires dedication, focus, and the willingness to learn from mistakes. With each error, you gain knowledge about your weak points and how to strengthen them for future sessions.',
        ],
      },
    ],
  },
  Advanced: {
    level: 3,
    description: 'Master high-speed typing with complex content',
    lessons: [
      {
        id: 'advanced-1',
        title: 'Technical Content',
        content:
          'Type technical text with special characters, code snippets, and complex terminology. Perfect for developers and technical professionals.',
        texts: [
          'The function validateEmail(email) checks if email.includes("@") && email.includes(".") to verify format.',
          'Install the package with: npm install react-router-dom@6.0.0 && npm start to begin development.',
          'Configure settings in config/app.js: { debug: true, timeout: 5000, retries: 3, enableCache: false }.',
        ],
      },
      {
        id: 'advanced-2',
        title: 'Rapid-Fire Practice',
        content:
          'Practice high-speed typing with challenging, varied content. Maintain accuracy while pushing for maximum speed.',
        texts: [
          'Exceptional expertise emerges from extensive experience experimenting with emerging technologies and excellent educational endeavors.',
          'Productivity peaks through purposeful persistence, periodic progress tracking, and proactive professional development practices.',
          'Sophisticated systems significantly streamline substantial software solutions, substantially supporting seamless synchronization and sophisticated security schemes.',
        ],
      },
      {
        id: 'advanced-3',
        title: 'Mixed Challenge',
        content:
          'The ultimate challenge combining everything: speed, accuracy, numbers, symbols, and complex sentences all together.',
        texts: [
          'According to the 2024 report (v3.2.1), approximately 87% of users prefer modern UI/UX design. Contact: CEO@CompanyXYZ.com; Phone: +1-888-999-2024.',
          'The algorithm processes 1,000,000 records/second @ 99.99% accuracy. Status: ACTIVE (since 2023-01-15). Config: env=prod; debug=false; version=2.4.5.',
          'Best practices include: (1) automated testing, (2) CI/CD pipelines, (3) monitoring dashboards. Investment: $500K+. ROI: 340% annually. Contact support@dev.io for details.',
        ],
      },
    ],
  },
}

function TypingLessonSelector({ onSelectLesson, isOpen }) {
  const [selectedLevel, setSelectedLevel] = useState(null)

  if (!isOpen) {
    return null
  }

  const handleLessonClick = (lesson) => {
    onSelectLesson({ level: selectedLevel, lesson })
  }

  const selectedLevelData = selectedLevel ? TYPING_LESSONS[selectedLevel] : null

  return (
    <div className="lesson-selector-overlay" aria-modal="true" role="dialog">
      <section className="lesson-selector-modal">
        <h2>Select Your Typing Level</h2>

        {!selectedLevel ? (
          <>
            <p className="lesson-selector-subtitle">
              Choose a difficulty level to begin your typing practice
            </p>

            <div className="lesson-levels-grid">
              {Object.entries(TYPING_LESSONS).map(([levelName, levelData]) => (
                <button
                  key={levelName}
                  type="button"
                  className="lesson-level-card"
                  onClick={() => setSelectedLevel(levelName)}
                >
                  <div className="lesson-level-badge">Level {levelData.level}</div>
                  <h3>{levelName}</h3>
                  <p>{levelData.description}</p>
                  <div className="lesson-level-footer">
                    {levelData.lessons.length} lessons
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="lesson-back-button"
              onClick={() => setSelectedLevel(null)}
              aria-label="Back to level selection"
            >
              ← Back
            </button>

            <p className="lesson-selector-subtitle">
              {selectedLevelData.description}
            </p>

            <div className="lesson-items-grid">
              {selectedLevelData.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className="lesson-item-card"
                  onClick={() => handleLessonClick(lesson)}
                >
                  <h4>{lesson.title}</h4>
                  <p>{lesson.content}</p>
                  <div className="lesson-item-footer">
                    {lesson.texts.length} practice texts
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export { TYPING_LESSONS, TypingLessonSelector }
