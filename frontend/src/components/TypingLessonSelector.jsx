import { useState } from 'react'

const TYPING_LESSONS = {
  Basic: {
    level: 1,
    description: 'Learn fundamental keys',
    lessons: [
      {
        id: 'basic-1',
        title: 'Home Row',
        keys: 'a s d f j k l',
        content: 'Focus: a s d f j k l',
        texts: [
          'dad lad sad flask flags flask lads dads ads alls falls halls jags ads',
          'ask fall fads sad add ads asks flask lads dads jags flasks',
          'lads ask ads falls flask dads jags alls fads hall gals',
        ],
      },
      {
        id: 'basic-2',
        title: 'Top Row',
        keys: 'q w e r t y u i o p',
        content: 'Focus: q w e r t y u i o p',
        texts: [
          'quit quiet quip weary wore wipe wire type retry pure pyre poetry output quiet',
          'write wrote rope tire wire query worry quote trite retry quiver poetry',
          'tower power three try truly pretty port query quiet require worry output rope',
        ],
      },
      {
        id: 'basic-3',
        title: 'Bottom Row',
        keys: 'z x c v b n m',
        content: 'Focus: z x c v b n m',
        texts: [
          'buzz zone zero vex voice zinc zone zing box maze buzz blab comb',
          'nexus venue vendor zone zero zinc vine vice vest buzz maze box venom',
          'zero zany buzz zone boxes venom vice voice venue next buzz comb',
        ],
      },
    ],
  },
  Intermediate: {
    level: 2,
    description: 'Build speed with combined keys',
    lessons: [
      {
        id: 'intermediate-1',
        title: 'All Letters',
        keys: 'a-z',
        content: 'Focus: All alphabet keys combined',
        texts: [
          'Learning becomes powerful when consistency reflection and deliberate practice work together.',
          'The best study routine balances deep focus short breaks and clear goals for success.',
          'Strong learners ask questions review mistakes honestly and return with better strategies.',
        ],
      },
      {
        id: 'intermediate-2',
        title: 'Numbers & Symbols',
        keys: '0-9 ! @ # $ % ^ & *',
        content: 'Focus: Numbers and basic symbols',
        texts: [
          'Price: $99.99, Qty: 5, Code: ABC123, Save: 25% off all items',
          'Contact: +1-800-555-1234, Email: user@domain.com, ID: #98765',
          'Order total: $1,250 (50% deposit = $625), Balance due: 2024-01-15',
        ],
      },
      {
        id: 'intermediate-3',
        title: 'Extended Passages',
        keys: 'a-z, 0-9, symbols',
        content: 'Focus: Longer texts with rhythm',
        texts: [
          'Typing skill improves when you prioritize accuracy first and speed second through patient practice. Consistency matters more than intensity in building lasting skills and confidence.',
          'Every practice session adds to your foundation. Small improvements tracked over time become meaningful progress that builds strong muscle memory and keyboard familiarity.',
          'The key to mastery is dedication and focus. Learn from each mistake and strengthen your weak areas. With time, typing becomes second nature and effortless.',
        ],
      },
    ],
  },
  Advanced: {
    level: 3,
    description: 'Master with complex content',
    lessons: [
      {
        id: 'advanced-1',
        title: 'Technical Syntax',
        keys: 'symbols (), {}, [], @, /, =, .',
        content: 'Focus: Code-like syntax and symbols',
        texts: [
          'function validate(email) { return email.includes("@") && email.length > 5; }',
          'npm install package@1.2.3 --save-dev && npm run build --production',
          'const config = { debug: true, port: 3000, timeout: 5000, cache: false };',
        ],
      },
      {
        id: 'advanced-2',
        title: 'High Speed',
        keys: 'a-z, rapid repeated patterns',
        content: 'Focus: Speed with repeated letter patterns',
        texts: [
          'Excessive expertise emerges through experience executing experiments with emerging technologies.',
          'Successful systems streamline substantial solutions supporting seamless synchronization and security.',
          'Persistent practice produces powerful proficiency promoting professional performance and progress.',
        ],
      },
      {
        id: 'advanced-3',
        title: 'Full Challenge',
        keys: 'all keys, symbols, numbers, punctuation',
        content: 'Focus: Everything combined - maximum difficulty',
        texts: [
          'Status Report v2.4.5 (2024-01-15): Processed 1,000,000+ records @ 99.9% accuracy. Cost: $50K. ROI: 340%.',
          'Meeting: Thu 2:00pm, Location: Room A-12 (Bldg #3). Topics: Q4 results, 2024 roadmap, budget allocation.',
          'API endpoint: https://api.example.com/v3/users?filter=active&sort=-date&limit=100&token=ABC123',
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
                  <div className="lesson-keys-badge">{lesson.keys}</div>
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
