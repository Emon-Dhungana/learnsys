import { useEffect, useMemo, useRef, useState } from 'react'

const TAB_PRACTICE = 'Practice Mode'
const TAB_TEST = 'Test Mode'
const TAB_STATS = 'Statistics'

const TIMER_PRESETS = [
  { key: '30', label: '30s', seconds: 30 },
  { key: '60', label: '1m', seconds: 60 },
  { key: '120', label: '2m', seconds: 120 },
  { key: '180', label: '3m', seconds: 180 },
  { key: 'custom', label: 'Custom', seconds: null },
]

const SAMPLE_TEXTS = [
  'Learning becomes powerful when consistency, reflection, and deliberate practice work together each day.',
  'The best study routine is one that balances deep focus, short breaks, and clear goals for every session.',
  'Typing skill improves faster when you prioritize accuracy first and speed second with patient repetition.',
  'Strong learners ask better questions, review mistakes honestly, and return with a clearer strategy.',
  'Small improvements, tracked over time, become meaningful progress that builds confidence and mastery.',
]

const NEPALI_SAMPLE_TEXTS = [
  'नियमित अभ्यासले टाइपिङ गति र शुद्धता दुवै सुधार्छ।',
  'दैनिक सानो प्रगति दीर्घकालीन ठूलो उपलब्धिमा बदलिन्छ।',
  'गल्तीबाट सिकेर फेरि प्रयास गर्नु नै राम्रो रणनीति हो।',
  'स्पष्ट लक्ष्य, ध्यान, र समीक्षा सफल अध्ययनका आधार हुन्।',
  'धैर्य राखेर निरन्तर अभ्यास गर्दा आत्मविश्वास बढ्दै जान्छ।',
]

const LEFT_HAND_KEYS = new Set([
  '1',
  '2',
  '3',
  '4',
  '5',
  'q',
  'w',
  'e',
  'r',
  't',
  'a',
  's',
  'd',
  'f',
  'g',
  'z',
  'x',
  'c',
  'v',
  'b',
])

const RIGHT_HAND_KEYS = new Set([
  '6',
  '7',
  '8',
  '9',
  '0',
  'y',
  'u',
  'i',
  'o',
  'p',
  'h',
  'j',
  'k',
  'l',
  'n',
  'm',
])

const createLongText = (textPool = SAMPLE_TEXTS) => {
  const shuffled = [...textPool].sort(() => Math.random() - 0.5)
  return `${shuffled.join(' ')} ${shuffled[0]} ${shuffled[1]}`
}

const initialMetrics = () => ({
  totalKeystrokes: 0,
  correctTyped: 0,
  errorCount: 0,
  weakKeyCounts: {},
  incorrectPatterns: {},
  handStats: {
    left: { total: 0, errors: 0 },
    right: { total: 0, errors: 0 },
    other: { total: 0, errors: 0 },
  },
})

const detectHand = (char) => {
  const normalized = char.toLowerCase()
  if (LEFT_HAND_KEYS.has(normalized)) {
    return 'left'
  }

  if (RIGHT_HAND_KEYS.has(normalized)) {
    return 'right'
  }

  return 'other'
}

const percentage = (numerator, denominator) => {
  if (!denominator) {
    return 100
  }

  return (numerator / denominator) * 100
}

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remaining = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

const normalizeCustomSecondsInput = (value) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (!/^\d+$/.test(trimmed)) {
    return null
  }

  return String(Math.max(1, Math.floor(Number(trimmed))))
}

function TypingPage({
  user,
  isAdmin,
  typingStats,
  typingSessionState,
  onRequireAuth,
  onUpdateTypingSession,
  onSaveTypingResult,
}) {
  const [activeTab, setActiveTab] = useState(TAB_PRACTICE)
  const [selectedLanguage, setSelectedLanguage] = useState('english')

  const activeTextPool = selectedLanguage === 'nepali' ? NEPALI_SAMPLE_TEXTS : SAMPLE_TEXTS

  const [practiceText, setPracticeText] = useState(() => createLongText(SAMPLE_TEXTS))
  const [practiceInput, setPracticeInput] = useState('')

  const [selectedTimerKey, setSelectedTimerKey] = useState('60')
  const [customSeconds, setCustomSeconds] = useState('90')
  const [testText, setTestText] = useState(() => createLongText(SAMPLE_TEXTS))
  const [testInput, setTestInput] = useState('')
  const [remainingTime, setRemainingTime] = useState(60)
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testSummary, setTestSummary] = useState(null)
  const [testConfigError, setTestConfigError] = useState('')

  const [timerSoundEnabled, setTimerSoundEnabled] = useState(false)
  const timerRef = useRef(null)
  const metricsRef = useRef(initialMetrics())
  const isRunningRef = useRef(false)

  const practiceCorrectCount = useMemo(() => {
    let correct = 0
    for (let i = 0; i < practiceInput.length; i += 1) {
      if (practiceInput[i] === practiceText[i]) {
        correct += 1
      }
    }

    return correct
  }, [practiceInput, practiceText])

  const practiceAccuracy = useMemo(() => {
    return percentage(practiceCorrectCount, practiceInput.length)
  }, [practiceCorrectCount, practiceInput.length])

  const averageWpm = useMemo(() => {
    if (!typingStats.history.length) {
      return 0
    }

    const total = typingStats.history.reduce((sum, item) => sum + item.wpm, 0)
    return total / typingStats.history.length
  }, [typingStats.history])

  const bestWpm = useMemo(() => {
    if (!typingStats.history.length) {
      return 0
    }

    return Math.max(...typingStats.history.map((item) => item.wpm))
  }, [typingStats.history])

  const averageAccuracy = useMemo(() => {
    if (!typingStats.history.length) {
      return 0
    }

    const total = typingStats.history.reduce((sum, item) => sum + item.accuracy, 0)
    return total / typingStats.history.length
  }, [typingStats.history])

  const weakLetters = useMemo(() => {
    return Object.entries(typingStats.weakKeyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [typingStats.weakKeyCounts])

  const incorrectPatterns = useMemo(() => {
    return Object.entries(typingStats.incorrectPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [typingStats.incorrectPatterns])

  const handAnalysis = useMemo(() => {
    const left = typingStats.handStats.left
    const right = typingStats.handStats.right

    const leftRate = left.total ? left.errors / left.total : 0
    const rightRate = right.total ? right.errors / right.total : 0

    const dominantHand = left.total === right.total ? 'Balanced' : left.total > right.total ? 'Left' : 'Right'
    const weakHand = leftRate === rightRate ? 'Balanced' : leftRate > rightRate ? 'Left' : 'Right'

    return {
      dominantHand,
      weakHand,
      leftRate,
      rightRate,
    }
  }, [typingStats.handStats])

  const trendPoints = useMemo(() => {
    const lastResults = typingStats.history.slice(-7)
    return lastResults.map((item) => item.wpm)
  }, [typingStats.history])

  const getSelectedDuration = () => {
    if (selectedTimerKey === 'custom') {
      const parsed = Number(customSeconds)
      if (!Number.isFinite(parsed)) {
        return 0
      }

      return Math.max(1, Math.floor(parsed))
    }

    const preset = TIMER_PRESETS.find((item) => item.key === selectedTimerKey)
    return preset?.seconds ?? 60
  }

  const selectedDurationSeconds = getSelectedDuration()
  const timerDisplayLabel =
    selectedTimerKey === 'custom' ? `Custom (${selectedDurationSeconds}s)` : formatTime(selectedDurationSeconds)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const renderTypedText = (targetText, userText) => {
    return targetText.split('').map((char, index) => {
      let className = 'typing-char'

      if (index < userText.length) {
        className = userText[index] === char ? 'typing-char is-correct' : 'typing-char is-wrong'
      } else if (index === userText.length) {
        className = 'typing-char is-current'
      }

      return (
        <span key={`char-${index}`} className={className}>
          {char}
        </span>
      )
    })
  }

  const resetTestSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    isRunningRef.current = false
    setIsTestRunning(false)
    setTestInput('')
    setRemainingTime(selectedDurationSeconds)
    setTestSummary(null)
    setTestConfigError('')
    metricsRef.current = initialMetrics()
    setTestText(createLongText(activeTextPool))
    onUpdateTypingSession(null)
  }

  const finalizeTest = (durationSeconds) => {
    if (!isRunningRef.current) {
      return
    }

    isRunningRef.current = false
    setIsTestRunning(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const metrics = metricsRef.current
    const durationMinutes = durationSeconds / 60
    const wpm = durationMinutes ? (metrics.totalKeystrokes / 5) / durationMinutes : 0
    const accuracy = percentage(metrics.correctTyped, metrics.totalKeystrokes)

    const summary = {
      wpm,
      accuracy,
      errorCount: metrics.errorCount,
      totalKeystrokes: metrics.totalKeystrokes,
      durationSeconds,
    }

    setTestSummary(summary)
    onSaveTypingResult({
      ...summary,
      language: selectedLanguage,
      weakKeyCounts: metrics.weakKeyCounts,
      incorrectPatterns: metrics.incorrectPatterns,
      handStats: metrics.handStats,
    })

    onUpdateTypingSession({
      mode: 'test',
      status: 'completed',
      summary,
    })
  }

  const startTest = () => {
    if (!user) {
      onRequireAuth()
      return
    }

    const selectedDuration = getSelectedDuration()
    if (!selectedDuration || selectedDuration < 1) {
      setTestConfigError('Please select a valid duration in seconds.')
      return
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    metricsRef.current = initialMetrics()
    setTestInput('')
    setRemainingTime(selectedDuration)
    setTestSummary(null)
    setTestConfigError('')
    setTestText(createLongText(activeTextPool))
    setIsTestRunning(true)
    isRunningRef.current = true

    onUpdateTypingSession({
      mode: 'test',
      status: 'running',
      startedAt: Date.now(),
      totalDuration: selectedDuration,
      remainingTime: selectedDuration,
    })

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          if (timerSoundEnabled) {
            console.log('Typing timer ended')
          }

          setTimeout(() => finalizeTest(selectedDuration), 0)
          return 0
        }

        const next = prev - 1
        onUpdateTypingSession({
          mode: 'test',
          status: 'running',
          startedAt: Date.now(),
          totalDuration: selectedDuration,
          remainingTime: next,
        })

        return next
      })
    }, 1000)
  }

  const handleTestInputChange = (event) => {
    if (!isTestRunning) {
      return
    }

    const rawValue = event.target.value
    const cappedValue = rawValue.slice(0, testText.length)
    const previousValue = testInput

    if (cappedValue.length <= previousValue.length) {
      setTestInput(cappedValue)
      return
    }

    const addedText = cappedValue.slice(previousValue.length)
    const updatedMetrics = {
      ...metricsRef.current,
      weakKeyCounts: { ...metricsRef.current.weakKeyCounts },
      incorrectPatterns: { ...metricsRef.current.incorrectPatterns },
      handStats: {
        left: { ...metricsRef.current.handStats.left },
        right: { ...metricsRef.current.handStats.right },
        other: { ...metricsRef.current.handStats.other },
      },
    }

    addedText.split('').forEach((typedChar, offset) => {
      const absoluteIndex = previousValue.length + offset
      const expectedChar = testText[absoluteIndex] ?? ''
      const hand = detectHand(typedChar)

      updatedMetrics.totalKeystrokes += 1
      updatedMetrics.handStats[hand].total += 1

      if (typedChar === expectedChar) {
        updatedMetrics.correctTyped += 1
      } else {
        updatedMetrics.errorCount += 1
        updatedMetrics.handStats[hand].errors += 1

        const weakKey = (expectedChar || typedChar || '_').toLowerCase()
        updatedMetrics.weakKeyCounts[weakKey] = (updatedMetrics.weakKeyCounts[weakKey] ?? 0) + 1

        const pattern = `${expectedChar || '∅'}->${typedChar}`
        updatedMetrics.incorrectPatterns[pattern] =
          (updatedMetrics.incorrectPatterns[pattern] ?? 0) + 1
      }
    })

    metricsRef.current = updatedMetrics
    setTestInput(cappedValue)
  }

  const tabList = [TAB_PRACTICE, TAB_TEST, TAB_STATS]
  const elapsedSeconds = selectedDurationSeconds - remainingTime
  const progressPercent = percentage(elapsedSeconds, selectedDurationSeconds)
  const isTimeWarning = remainingTime <= 10 && isTestRunning

  return (
    <section className="typing-page" aria-labelledby="typing-heading">
      <header className="typing-hero">
        <p className="typing-tag">Skill Builder</p>
        <h1 id="typing-heading">Typing Practice and Testing</h1>
        <p>Train with guided practice, timed tests, and performance insights.</p>
        <div className="courses-toolbar">
          <select
            className="courses-filter-select"
            value={selectedLanguage}
            onChange={(event) => {
              if (isTestRunning) {
                return
              }

              const nextLanguage = event.target.value
              const nextTextPool = nextLanguage === 'nepali' ? NEPALI_SAMPLE_TEXTS : SAMPLE_TEXTS

              setSelectedLanguage(nextLanguage)
              setPracticeText(createLongText(nextTextPool))
              setPracticeInput('')
              setTestText(createLongText(nextTextPool))
              setTestInput('')
              setTestSummary(null)
            }}
          >
            <option value="english">English</option>
            <option value="nepali">Nepali</option>
          </select>
        </div>
      </header>

      <div className="typing-tabs" role="tablist" aria-label="Typing tabs">
        {tabList.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`typing-tab ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => {
              if (!user && !isAdmin && tab !== TAB_PRACTICE) {
                onRequireAuth()
                return
              }
              setActiveTab(tab)
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === TAB_PRACTICE ? (
        <section className="typing-panel typing-glass" aria-label="Practice mode">
          <div className="typing-panel-head">
            <h2>Practice Mode</h2>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                setPracticeText(createLongText(activeTextPool))
                setPracticeInput('')
              }}
            >
              New Practice Text
            </button>
          </div>

          <div className="typing-text-box">{renderTypedText(practiceText, practiceInput)}</div>

          <textarea
            className="typing-input"
            placeholder="Type the text above..."
            value={practiceInput}
            onChange={(event) => setPracticeInput(event.target.value.slice(0, practiceText.length))}
          />

          <p className="typing-live-metric">Live Accuracy: {practiceAccuracy.toFixed(1)}%</p>
        </section>
      ) : null}

      {activeTab === TAB_TEST ? (
        <section className="typing-panel typing-glass" aria-label="Test mode">
          {!user && !isAdmin ? (
            <div className="empty-courses">
              <h2>Login Required</h2>
              <p>Please login to use Test Mode.</p>
              <button type="button" className="btn btn-primary" onClick={onRequireAuth}>
                Login to Continue
              </button>
            </div>
          ) : (
            <>
              <div className={`typing-timer-pill ${isTimeWarning ? 'is-warning' : ''}`}>
                <span>Mode: Test</span>
                <span>Duration: {timerDisplayLabel}</span>
                <strong>{formatTime(remainingTime)}</strong>
              </div>

              <div className="typing-test-controls">
                <span className="typing-control-label">Timer Duration</span>

                <div className="typing-duration-group" role="group" aria-label="Timer duration presets">
                  {TIMER_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      className={`typing-duration-chip ${
                        selectedTimerKey === preset.key ? 'is-active' : ''
                      }`}
                      onClick={() => {
                        if (isTestRunning) {
                          return
                        }

                        setSelectedTimerKey(preset.key)
                        if (preset.seconds) {
                          setRemainingTime(preset.seconds)
                        }
                        setTestConfigError('')
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {selectedTimerKey === 'custom' ? (
                  <div className="typing-custom-input-wrap">
                    <label htmlFor="typing-custom-seconds">Custom seconds</label>
                    <input
                      id="typing-custom-seconds"
                      className="typing-select"
                      type="number"
                      min={1}
                      step={1}
                      value={customSeconds}
                      onChange={(event) => {
                        if (isTestRunning) {
                          return
                        }

                        const nextValue = normalizeCustomSecondsInput(event.target.value)
                        if (nextValue === null) {
                          return
                        }

                        setCustomSeconds(nextValue)
                        if (selectedTimerKey === 'custom') {
                          const parsed = Number(nextValue)
                          setRemainingTime(Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1)
                        }
                        setTestConfigError('')
                      }}
                      onBlur={() => {
                        if (isTestRunning || customSeconds) {
                          return
                        }

                        setCustomSeconds('1')
                        if (selectedTimerKey === 'custom') {
                          setRemainingTime(1)
                        }
                      }}
                    />
                  </div>
                ) : null}

                <label className="typing-toggle" htmlFor="sound-toggle">
                  <input
                    id="sound-toggle"
                    type="checkbox"
                    checked={timerSoundEnabled}
                    onChange={(event) => setTimerSoundEnabled(event.target.checked)}
                  />
                  Sound Toggle
                </label>

                <button type="button" className="btn btn-primary" onClick={startTest}>
                  Start Test
                </button>
                <button type="button" className="btn btn-light" onClick={resetTestSession}>
                  Restart
                </button>
              </div>

              {typingSessionState?.mode === 'test' ? (
                <p className="typing-session-note">Current Session: {typingSessionState.status}</p>
              ) : null}

              {testConfigError ? <p className="auth-error">{testConfigError}</p> : null}

              <div className="typing-progress-wrap">
                <div className="typing-progress-bar" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <p className="typing-timer">Time Left: {formatTime(remainingTime)}</p>

              <div className="typing-text-box">{renderTypedText(testText, testInput)}</div>

              <textarea
                className="typing-input"
                placeholder={isTestRunning ? 'Type to begin...' : 'Start test to type'}
                value={testInput}
                onChange={handleTestInputChange}
                disabled={!isTestRunning}
              />

              {testSummary ? (
                <div className="typing-result-box">
                  <h3>Test Result Summary</h3>
                  <div className="typing-result-hero">
                    <article>
                      <p>WPM</p>
                      <strong>{testSummary.wpm.toFixed(1)}</strong>
                    </article>
                    <article>
                      <p>Accuracy</p>
                      <strong>{testSummary.accuracy.toFixed(1)}%</strong>
                    </article>
                  </div>

                  <div className="typing-result-stats-grid">
                    <article>
                      <p>Errors</p>
                      <strong>{testSummary.errorCount}</strong>
                    </article>
                    <article>
                      <p>Keystrokes</p>
                      <strong>{testSummary.totalKeystrokes}</strong>
                    </article>
                    <article>
                      <p>Duration</p>
                      <strong>{formatTime(testSummary.durationSeconds)}</strong>
                    </article>
                  </div>

                  <div className="typing-insight-box">
                    <h4>Improvement Insight</h4>
                    <p>
                      Weak letters: {weakLetters.slice(0, 3).map(([key]) => key).join(', ') || 'None'}
                    </p>
                    <p>
                      Hand imbalance: {handAnalysis.weakHand === 'Balanced'
                        ? 'Balanced typing load'
                        : `${handAnalysis.weakHand} hand has higher error rate`}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {activeTab === TAB_STATS ? (
        <section className="typing-panel typing-glass" aria-label="Statistics">
          {!user && !isAdmin ? (
            <div className="empty-courses">
              <h2>Login Required</h2>
              <p>Please login to view your typing statistics.</p>
              <button type="button" className="btn btn-primary" onClick={onRequireAuth}>
                Login to Continue
              </button>
            </div>
          ) : (
            <>
              <h2>Typing Statistics</h2>

              {typingStats.history.length === 0 ? (
                <div className="empty-courses">
                  <h2>No statistics yet</h2>
                  <p>Complete at least one test to see analytics.</p>
                </div>
              ) : (
                <>
                  <div className="typing-stats-grid">
                    <article className="typing-stat-card">
                      <h3>Average WPM</h3>
                      <p>{averageWpm.toFixed(1)}</p>
                    </article>
                    <article className="typing-stat-card">
                      <h3>Best WPM</h3>
                      <p>{bestWpm.toFixed(1)}</p>
                    </article>
                    <article className="typing-stat-card">
                      <h3>Average Accuracy</h3>
                      <p>{averageAccuracy.toFixed(1)}%</p>
                    </article>
                    <article className="typing-stat-card">
                      <h3>Dominant Hand</h3>
                      <p>{handAnalysis.dominantHand}</p>
                    </article>
                    <article className="typing-stat-card">
                      <h3>Weak Hand</h3>
                      <p>{handAnalysis.weakHand}</p>
                    </article>
                  </div>

                  <div className="typing-analysis-grid">
                    <article className="typing-analysis-card">
                      <h3>Weak Letters</h3>
                      {weakLetters.length === 0 ? (
                        <p>No weak letters recorded yet.</p>
                      ) : (
                        <ul>
                          {weakLetters.map(([key, count]) => (
                            <li key={key}>
                              {key} - {count}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>

                    <article className="typing-analysis-card">
                      <h3>Incorrect Patterns</h3>
                      {incorrectPatterns.length === 0 ? (
                        <p>No incorrect patterns recorded yet.</p>
                      ) : (
                        <ul>
                          {incorrectPatterns.map(([pattern, count]) => (
                            <li key={pattern}>
                              {pattern} - {count}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>

                    <article className="typing-analysis-card">
                      <h3>Improvement Trend</h3>
                      <div className="typing-trend">
                        {trendPoints.map((point, index) => (
                          <div key={`${point}-${index}`} className="typing-trend-item">
                            <div
                              className="typing-trend-bar"
                              style={{ width: `${Math.max(8, point * 2)}px` }}
                            ></div>
                            <span>{point.toFixed(1)} WPM</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      ) : null}
    </section>
  )
}

export default TypingPage
