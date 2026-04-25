import { useMemo, useState } from 'react'

const TAB_EXPLORE = 'Explore Quizzes'
const TAB_CREATE = 'Create Quiz'
const TAB_MY = 'My Quizzes'

const emptyQuestion = () => ({
  id: crypto.randomUUID(),
  question: '',
  options: {
    A: '',
    B: '',
    C: '',
    D: '',
  },
  correctAnswer: 'A',
})

const shuffle = (items) => {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

function QuizPage({
  user,
  quizCategories,
  adminQuizzes,
  userQuizzes,
  quizSessionState,
  onRequireAuth,
  onSaveUserQuiz,
  onDeleteUserQuiz,
  onUpdateQuizSession,
}) {
  const [activeTab, setActiveTab] = useState(TAB_EXPLORE)
  const [adminCategorySelection, setAdminCategorySelection] = useState('mixed')
  const [adminQuestionCount, setAdminQuestionCount] = useState(10)
  const [exploreError, setExploreError] = useState('')

  const [editingQuizId, setEditingQuizId] = useState(null)
  const [createError, setCreateError] = useState('')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizQuestions, setQuizQuestions] = useState([emptyQuestion()])

  const myQuizzes = useMemo(() => {
    if (!user) {
      return []
    }

    return userQuizzes.filter((item) => item.owner === user.username)
  }, [user, userQuizzes])

  const startQuizSession = (title, mode, questions, sourceQuizId = null) => {
    onUpdateQuizSession({
      mode,
      title,
      sourceQuizId,
      questions,
      currentIndex: 0,
      score: 0,
      pendingSelection: '',
      revealed: false,
      wasCorrect: false,
      answers: [],
      completed: false,
    })
  }

  const startAdminQuiz = () => {
    if (!user) {
      onRequireAuth()
      return
    }

    const pool =
      adminCategorySelection === 'mixed'
        ? adminQuizzes
        : adminQuizzes.filter((item) => item.category === adminCategorySelection)

    if (pool.length === 0) {
      setExploreError('No quiz questions available for the selected category.')
      return
    }

    const shuffled = shuffle(pool)
    const selected = shuffled.slice(0, Math.min(adminQuestionCount, shuffled.length))
    setExploreError('')
    startQuizSession('Admin Practice Quiz', 'admin', selected)
  }

  const resetCreateForm = () => {
    setEditingQuizId(null)
    setQuizTitle('')
    setQuizQuestions([emptyQuestion()])
    setCreateError('')
  }

  const updateCreateQuestion = (questionId, updates) => {
    setQuizQuestions((prev) =>
      prev.map((item) =>
        item.id === questionId
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    )
    setCreateError('')
  }

  const addCreateQuestion = () => {
    setQuizQuestions((prev) => [...prev, emptyQuestion()])
  }

  const removeCreateQuestion = (questionId) => {
    if (quizQuestions.length === 1) {
      return
    }

    setQuizQuestions((prev) => prev.filter((item) => item.id !== questionId))
  }

  const validateCreateQuiz = () => {
    if (!quizTitle.trim()) {
      return 'Quiz title is required.'
    }

    const hasInvalid = quizQuestions.some((item) => {
      const hasQuestion = item.question.trim().length > 0
      const optionsFilled = ['A', 'B', 'C', 'D'].every(
        (key) => item.options[key].trim().length > 0,
      )
      return !hasQuestion || !optionsFilled
    })

    if (hasInvalid) {
      return 'Every question must have text and all four options.'
    }

    return ''
  }

  const saveCreateQuiz = () => {
    if (!user) {
      onRequireAuth()
      return
    }

    const validationError = validateCreateQuiz()
    if (validationError) {
      setCreateError(validationError)
      return
    }

    const normalizedQuestions = quizQuestions.map((item) => ({
      id: item.id,
      question: item.question.trim(),
      options: {
        A: item.options.A.trim(),
        B: item.options.B.trim(),
        C: item.options.C.trim(),
        D: item.options.D.trim(),
      },
      correctAnswer: item.correctAnswer,
    }))

    onSaveUserQuiz({
      id: editingQuizId,
      title: quizTitle.trim(),
      questions: normalizedQuestions,
    })

    resetCreateForm()
    setActiveTab(TAB_MY)
  }

  const beginEditQuiz = (quiz) => {
    if (!user) {
      onRequireAuth()
      return
    }

    setEditingQuizId(quiz.id)
    setQuizTitle(quiz.title)
    setQuizQuestions(
      quiz.questions.map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        question: item.question,
        options: { ...item.options },
        correctAnswer: item.correctAnswer,
      })),
    )
    setCreateError('')
    setActiveTab(TAB_CREATE)
  }

  const startUserQuiz = (quiz) => {
    if (!user) {
      onRequireAuth()
      return
    }

    if (!quiz.questions.length) {
      return
    }

    const shuffled = shuffle(quiz.questions)
    startQuizSession(quiz.title, 'user', shuffled, quiz.id)
  }

  const deleteQuiz = (quizId) => {
    onDeleteUserQuiz(quizId)
  }

  const selectOption = (key) => {
    if (!quizSessionState || quizSessionState.revealed || quizSessionState.completed) {
      return
    }

    onUpdateQuizSession({
      ...quizSessionState,
      pendingSelection: key,
    })
  }

  const submitCurrentAnswer = () => {
    if (!quizSessionState || !quizSessionState.pendingSelection || quizSessionState.revealed) {
      return
    }

    const currentQuestion = quizSessionState.questions[quizSessionState.currentIndex]
    const wasCorrect = quizSessionState.pendingSelection === currentQuestion.correctAnswer

    onUpdateQuizSession({
      ...quizSessionState,
      score: quizSessionState.score + (wasCorrect ? 1 : 0),
      revealed: true,
      wasCorrect,
      answers: [
        ...quizSessionState.answers,
        {
          questionId: currentQuestion.id,
          selected: quizSessionState.pendingSelection,
          correctAnswer: currentQuestion.correctAnswer,
          wasCorrect,
        },
      ],
    })
  }

  const goToNextQuestion = () => {
    if (!quizSessionState) {
      return
    }

    const isLast = quizSessionState.currentIndex >= quizSessionState.questions.length - 1
    if (isLast) {
      onUpdateQuizSession({
        ...quizSessionState,
        completed: true,
      })
      return
    }

    onUpdateQuizSession({
      ...quizSessionState,
      currentIndex: quizSessionState.currentIndex + 1,
      pendingSelection: '',
      revealed: false,
      wasCorrect: false,
    })
  }

  const closeQuizSession = () => {
    onUpdateQuizSession(null)
  }

  const tabList = [TAB_EXPLORE, TAB_CREATE, TAB_MY]
  const quizCategoryNames = quizCategories.map((item) => item.name)

  return (
    <section className="quiz-page" aria-labelledby="quiz-heading">
      <header className="quiz-hero">
        <p className="quiz-tag">Assessment Center</p>
        <h1 id="quiz-heading">LearnSys Quiz System</h1>
        <p>Explore admin quizzes, build your own quizzes, and track your performance.</p>
      </header>

      {quizSessionState ? (
        <section className="quiz-session" aria-label="Active quiz session">
          {!quizSessionState.completed ? (
            <>
              <div className="quiz-session-head">
                <h2>{quizSessionState.title}</h2>
                <p>
                  Question {quizSessionState.currentIndex + 1}/{quizSessionState.questions.length}
                </p>
              </div>

              <article className="quiz-question-card">
                <h3>{quizSessionState.questions[quizSessionState.currentIndex].question}</h3>
                <div className="quiz-option-grid">
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const optionValue =
                      quizSessionState.questions[quizSessionState.currentIndex].options[key]
                    const isSelected = quizSessionState.pendingSelection === key
                    const isCorrectAnswer =
                      quizSessionState.questions[quizSessionState.currentIndex].correctAnswer === key

                    return (
                      <button
                        key={key}
                        type="button"
                        className={`quiz-option ${isSelected ? 'is-selected' : ''} ${
                          quizSessionState.revealed && isCorrectAnswer ? 'is-correct' : ''
                        }`}
                        onClick={() => selectOption(key)}
                      >
                        <span>{key}.</span> {optionValue}
                      </button>
                    )
                  })}
                </div>

                {quizSessionState.revealed ? (
                  <p className={`quiz-feedback ${quizSessionState.wasCorrect ? 'good' : 'bad'}`}>
                    {quizSessionState.wasCorrect
                      ? 'Correct answer!'
                      : `Incorrect. Correct option is ${
                          quizSessionState.questions[quizSessionState.currentIndex].correctAnswer
                        }.`}
                  </p>
                ) : null}
              </article>

              <div className="quiz-session-actions">
                {!quizSessionState.revealed ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submitCurrentAnswer}
                    disabled={!quizSessionState.pendingSelection}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={goToNextQuestion}>
                    {quizSessionState.currentIndex + 1 === quizSessionState.questions.length
                      ? 'Finish Quiz'
                      : 'Next Question'}
                  </button>
                )}

                <button type="button" className="btn btn-light" onClick={closeQuizSession}>
                  Exit Quiz
                </button>
              </div>
            </>
          ) : (
            <div className="quiz-result-card">
              <h2>Quiz Completed</h2>
              <p>
                Final Score: {quizSessionState.score}/{quizSessionState.questions.length}
              </p>

              <div className="quiz-review-list">
                {quizSessionState.questions.map((question, index) => {
                  const answer = quizSessionState.answers[index]
                  return (
                    <article key={question.id} className="quiz-review-item">
                      <h3>{question.question}</h3>
                      <p>
                        Your Answer: {answer?.selected ?? '-'} | Correct: {question.correctAnswer}
                      </p>
                    </article>
                  )
                })}
              </div>

              <div className="quiz-session-actions">
                <button type="button" className="btn btn-primary" onClick={closeQuizSession}>
                  Close Result
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      <div className="quiz-tabs" role="tablist" aria-label="Quiz tabs">
        {tabList.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`quiz-tab ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === TAB_EXPLORE ? (
        <section className="quiz-panel" aria-label="Explore quizzes">
          <h2>Explore Quizzes</h2>

          <div className="quiz-controls">
            <label htmlFor="quiz-category">Category</label>
            <select
              id="quiz-category"
              value={adminCategorySelection}
              onChange={(event) => setAdminCategorySelection(event.target.value)}
            >
              <option value="mixed">Mixed Categories</option>
              {quizCategoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <label htmlFor="quiz-count">Number of Questions</label>
            <select
              id="quiz-count"
              value={adminQuestionCount}
              onChange={(event) => setAdminQuestionCount(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {exploreError ? <p className="auth-error">{exploreError}</p> : null}

          <button type="button" className="btn btn-primary" onClick={startAdminQuiz}>
            Start Admin Quiz
          </button>
        </section>
      ) : null}

      {activeTab === TAB_CREATE ? (
        <section className="quiz-panel" aria-label="Create quiz">
          <h2>{editingQuizId ? 'Edit Quiz' : 'Create Quiz'}</h2>

          {!user ? (
            <div className="empty-courses">
              <h2>Login Required</h2>
              <p>Please login to create your own quizzes.</p>
              <button type="button" className="btn btn-primary" onClick={onRequireAuth}>
                Login to Continue
              </button>
            </div>
          ) : (
            <>
              <label htmlFor="custom-quiz-title">Quiz Title</label>
              <input
                id="custom-quiz-title"
                type="text"
                className="quiz-input"
                value={quizTitle}
                onChange={(event) => {
                  setQuizTitle(event.target.value)
                  setCreateError('')
                }}
                placeholder="Enter quiz title"
              />

              <div className="create-question-list">
                {quizQuestions.map((item, index) => (
                  <article key={item.id} className="create-question-card">
                    <div className="create-question-head">
                      <h3>Question {index + 1}</h3>
                      {quizQuestions.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={() => removeCreateQuestion(item.id)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <label htmlFor={`question-${item.id}`}>Question</label>
                    <textarea
                      id={`question-${item.id}`}
                      className="quiz-input"
                      value={item.question}
                      onChange={(event) =>
                        updateCreateQuestion(item.id, { question: event.target.value })
                      }
                      placeholder="Enter question"
                    />

                    <div className="quiz-option-grid create-options">
                      {['A', 'B', 'C', 'D'].map((key) => (
                        <label key={key} htmlFor={`${item.id}-${key}`} className="quiz-option-edit">
                          Option {key}
                          <input
                            id={`${item.id}-${key}`}
                            className="quiz-input"
                            type="text"
                            value={item.options[key]}
                            onChange={(event) =>
                              updateCreateQuestion(item.id, {
                                options: {
                                  ...item.options,
                                  [key]: event.target.value,
                                },
                              })
                            }
                            placeholder={`Option ${key}`}
                          />
                        </label>
                      ))}
                    </div>

                    <label htmlFor={`correct-${item.id}`}>Correct Answer</label>
                    <select
                      id={`correct-${item.id}`}
                      className="quiz-input"
                      value={item.correctAnswer}
                      onChange={(event) =>
                        updateCreateQuestion(item.id, { correctAnswer: event.target.value })
                      }
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </article>
                ))}
              </div>

              {createError ? <p className="auth-error">{createError}</p> : null}

              <div className="quiz-session-actions">
                <button type="button" className="btn btn-light" onClick={addCreateQuestion}>
                  Add Question
                </button>
                <button type="button" className="btn btn-light" onClick={resetCreateForm}>
                  Reset
                </button>
                <button type="button" className="btn btn-primary" onClick={saveCreateQuiz}>
                  {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === TAB_MY ? (
        <section className="quiz-panel" aria-label="My quizzes">
          <h2>My Quizzes</h2>

          {!user ? (
            <div className="empty-courses">
              <h2>Login Required</h2>
              <p>Please login to access your quizzes.</p>
              <button type="button" className="btn btn-primary" onClick={onRequireAuth}>
                Login to Continue
              </button>
            </div>
          ) : myQuizzes.length === 0 ? (
            <div className="empty-courses">
              <h2>No quizzes yet</h2>
              <p>Create your first custom quiz in the Create Quiz tab.</p>
            </div>
          ) : (
            <div className="my-quiz-grid">
              {myQuizzes.map((quiz) => (
                <article key={quiz.id} className="course-card">
                  <h3>{quiz.title}</h3>
                  <p>{quiz.questions.length} questions</p>
                  <div className="quiz-session-actions compact">
                    <button type="button" className="btn btn-primary" onClick={() => startUserQuiz(quiz)}>
                      Start Quiz
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => beginEditQuiz(quiz)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => deleteQuiz(quiz.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </section>
  )
}

export default QuizPage
