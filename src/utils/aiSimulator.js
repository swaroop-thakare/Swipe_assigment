// AI Simulator for generating questions and scoring
export const generateQuestions = () => {
  return [
    {
      id: 1,
      text: "Tell me about yourself and your background.",
      difficulty: "easy",
      timeLimit: 20,
      category: "Introduction"
    },
    {
      id: 2,
      text: "What are your greatest strengths?",
      difficulty: "easy",
      timeLimit: 20,
      category: "Strengths"
    },
    {
      id: 3,
      text: "Describe a challenging project you worked on and how you overcame the obstacles.",
      difficulty: "medium",
      timeLimit: 60,
      category: "Problem Solving"
    },
    {
      id: 4,
      text: "How do you handle working under pressure and tight deadlines?",
      difficulty: "medium",
      timeLimit: 60,
      category: "Work Style"
    },
    {
      id: 5,
      text: "Explain a complex technical concept to a non-technical audience.",
      difficulty: "hard",
      timeLimit: 120,
      category: "Communication"
    },
    {
      id: 6,
      text: "Describe a time when you had to lead a team through a difficult situation. What was your approach?",
      difficulty: "hard",
      timeLimit: 120,
      category: "Leadership"
    }
  ]
}

export const scoreAnswer = (question, answer, timeSpent) => {
  if (!answer || answer.trim().length < 10) {
    return Math.floor(Math.random() * 30) + 10 // 10-40 for poor answers
  }

  let score = 50 // Base score

  // Length factor (longer answers generally score better)
  const lengthScore = Math.min(answer.length / 10, 20)
  score += lengthScore

  // Time factor (using most of the time is good)
  const timeRatio = timeSpent / question.timeLimit
  if (timeRatio > 0.7 && timeRatio < 1.1) {
    score += 15 // Good time usage
  } else if (timeRatio > 1.1) {
    score += 5 // Over time but still gets some points
  }

  // Difficulty factor
  if (question.difficulty === 'easy') {
    score += Math.floor(Math.random() * 15) + 5
  } else if (question.difficulty === 'medium') {
    score += Math.floor(Math.random() * 20) + 10
  } else if (question.difficulty === 'hard') {
    score += Math.floor(Math.random() * 25) + 15
  }

  // Random variation
  score += Math.floor(Math.random() * 10) - 5

  return Math.min(Math.max(score, 0), 100)
}

export const generateSummary = (candidate, questions, answers, scores) => {
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const totalTime = answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0)
  
  let summary = `Candidate: ${candidate.name}\n\n`
  summary += `Overall Performance: ${averageScore.toFixed(1)}/100\n\n`
  
  // Performance level
  if (averageScore >= 80) {
    summary += "Performance Level: Excellent\n"
    summary += "This candidate demonstrated strong communication skills, thoughtful responses, and good time management throughout the interview.\n\n"
  } else if (averageScore >= 60) {
    summary += "Performance Level: Good\n"
    summary += "The candidate showed solid performance with room for improvement in some areas.\n\n"
  } else if (averageScore >= 40) {
    summary += "Performance Level: Fair\n"
    summary += "The candidate needs improvement in communication and depth of responses.\n\n"
  } else {
    summary += "Performance Level: Needs Improvement\n"
    summary += "The candidate struggled with the interview questions and may need additional preparation.\n\n"
  }

  // Question-by-question analysis
  summary += "Question Analysis:\n"
  questions.forEach((question, index) => {
    const answer = answers[index]
    const score = scores[index]
    summary += `\n${index + 1}. ${question.text}\n`
    summary += `   Difficulty: ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}\n`
    summary += `   Score: ${score}/100\n`
    if (answer?.answer) {
      summary += `   Response Length: ${answer.answer.length} characters\n`
      summary += `   Time Used: ${answer.timeSpent}s / ${question.timeLimit}s\n`
    }
  })

  summary += `\nTotal Interview Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n`
  summary += `Interview Date: ${new Date().toLocaleDateString()}\n`

  return summary
}
