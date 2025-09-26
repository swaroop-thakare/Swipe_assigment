const OpenAI = require('openai');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || 'JFViwQlwoSEqwMxWsZJcVAFNvQ67cXy50U40FDdB-';
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 1000;
    
    if (this.apiKey && this.apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: this.apiKey
      });
      this.isAvailable = true;
      console.log('✅ AI service initialized with API key');
    } else {
      this.openai = null;
      this.isAvailable = false;
      console.warn('⚠️  OpenAI API key not configured. Using fallback AI simulation.');
    }
  }

  async generateQuestions(role = 'full-stack developer', difficulty = 'mixed') {
    if (!this.isAvailable) {
      return this.getFallbackQuestions();
    }

    try {
      const prompt = `Generate 6 interview questions for a ${role} position. 
      Requirements:
      - 2 Easy questions (20 seconds each) - basic concepts, simple problem-solving
      - 2 Medium questions (60 seconds each) - practical scenarios, moderate complexity
      - 2 Hard questions (120 seconds each) - complex problem-solving, system design, advanced concepts
      
      Focus on: React, Node.js, JavaScript, system design, problem-solving, communication
      
      Return as JSON array with this structure:
      [
        {
          "id": "q1",
          "text": "Question text here",
          "difficulty": "easy|medium|hard",
          "timeLimit": 20|60|120,
          "category": "Technical|Behavioral|System Design"
        }
      ]`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      const questions = JSON.parse(content);
      
      // Validate and format questions
      return questions.map((q, index) => ({
        id: `q${index + 1}`,
        text: q.text,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        category: q.category || 'Technical',
        aiGenerated: true
      }));

    } catch (error) {
      console.error('Error generating questions:', error);
      return this.getFallbackQuestions();
    }
  }

  getFallbackQuestions() {
    return [
      {
        id: 'q1',
        text: 'Tell me about yourself and your background in full-stack development.',
        difficulty: 'easy',
        timeLimit: 20,
        category: 'Introduction',
        aiGenerated: false
      },
      {
        id: 'q2',
        text: 'What are your greatest strengths as a developer?',
        difficulty: 'easy',
        timeLimit: 20,
        category: 'Strengths',
        aiGenerated: false
      },
      {
        id: 'q3',
        text: 'Describe a challenging project you worked on and how you overcame the obstacles.',
        difficulty: 'medium',
        timeLimit: 60,
        category: 'Problem Solving',
        aiGenerated: false
      },
      {
        id: 'q4',
        text: 'How do you handle working under pressure and tight deadlines?',
        difficulty: 'medium',
        timeLimit: 60,
        category: 'Work Style',
        aiGenerated: false
      },
      {
        id: 'q5',
        text: 'Explain a complex technical concept to a non-technical audience.',
        difficulty: 'hard',
        timeLimit: 120,
        category: 'Communication',
        aiGenerated: false
      },
      {
        id: 'q6',
        text: 'Describe a time when you had to lead a team through a difficult situation. What was your approach?',
        difficulty: 'hard',
        timeLimit: 120,
        category: 'Leadership',
        aiGenerated: false
      }
    ];
  }

  async scoreAnswer(question, answer, timeSpent) {
    try {
      const prompt = `Score this interview answer on a scale of 0-100.

Question: "${question.text}"
Difficulty: ${question.difficulty}
Time Limit: ${question.timeLimit} seconds
Time Spent: ${timeSpent} seconds

Answer: "${answer}"

Consider:
1. Technical accuracy and depth
2. Communication clarity
3. Problem-solving approach
4. Time management (using most of the time effectively)
5. Difficulty level appropriateness

Return JSON with this structure:
{
  "score": 85,
  "feedback": "Detailed feedback about strengths and areas for improvement",
  "strengths": ["List of strengths"],
  "improvements": ["List of areas to improve"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      
      return {
        score: Math.max(0, Math.min(100, result.score)),
        feedback: result.feedback,
        strengths: result.strengths || [],
        improvements: result.improvements || []
      };

    } catch (error) {
      console.error('Error scoring answer:', error);
      // Fallback scoring
      return this.fallbackScoring(question, answer, timeSpent);
    }
  }

  async generateSummary(candidate, questions, answers, scores) {
    try {
      const prompt = `Generate a comprehensive interview summary for this candidate.

Candidate: ${candidate.name}
Email: ${candidate.email}
Role: Full-Stack Developer

Interview Results:
${questions.map((q, i) => `
Question ${i + 1} (${q.difficulty}): ${q.text}
Answer: ${answers[i]?.answer || 'No answer'}
Score: ${scores[i] || 'Not scored'}
`).join('\n')}

Overall Performance: ${scores.reduce((a, b) => a + b, 0) / scores.length}/100

Generate a professional summary including:
1. Overall performance assessment
2. Technical strengths and weaknesses
3. Communication skills
4. Problem-solving ability
5. Recommendations for hiring decision
6. Areas for improvement if hired

Keep it concise but comprehensive (300-500 words).`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('Error generating summary:', error);
      return this.fallbackSummary(candidate, scores);
    }
  }

  async extractProfileFromResume(resumeText) {
    try {
      const prompt = `Extract the following information from this resume text:

Name, Email, Phone Number

Resume Text:
${resumeText}

Return JSON with this structure:
{
  "name": "Full Name or null",
  "email": "email@example.com or null", 
  "phone": "phone number or null",
  "confidence": 0.95
}

If any field is not found or unclear, set it to null.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);

    } catch (error) {
      console.error('Error extracting profile:', error);
      return { name: null, email: null, phone: null, confidence: 0 };
    }
  }

  // Fallback methods when AI fails
  fallbackScoring(question, answer, timeSpent) {
    let score = 50; // Base score
    
    // Length factor
    if (answer.length > 50) score += 20;
    else if (answer.length > 20) score += 10;
    
    // Time factor
    const timeRatio = timeSpent / question.timeLimit;
    if (timeRatio > 0.7 && timeRatio < 1.1) score += 15;
    else if (timeRatio > 1.1) score += 5;
    
    // Difficulty factor
    if (question.difficulty === 'easy') score += Math.random() * 15;
    else if (question.difficulty === 'medium') score += Math.random() * 20;
    else if (question.difficulty === 'hard') score += Math.random() * 25;
    
    return {
      score: Math.min(100, Math.max(0, score)),
      feedback: `Answer shows ${answer.length > 50 ? 'good' : 'limited'} detail. Time management was ${timeRatio > 0.7 ? 'effective' : 'could be improved'}.`,
      strengths: answer.length > 50 ? ['Detailed response'] : [],
      improvements: answer.length < 20 ? ['Provide more detail'] : []
    };
  }

  fallbackSummary(candidate, scores) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    let performance = 'Needs Improvement';
    if (avgScore >= 80) performance = 'Excellent';
    else if (avgScore >= 60) performance = 'Good';
    else if (avgScore >= 40) performance = 'Fair';
    
    return `Candidate: ${candidate.name}
Performance: ${performance} (${avgScore.toFixed(1)}/100)

${performance === 'Excellent' ? 'Strong candidate with excellent technical skills and communication.' :
  performance === 'Good' ? 'Solid candidate with good potential and room for growth.' :
  performance === 'Fair' ? 'Candidate shows promise but needs development in key areas.' :
  'Candidate requires significant improvement in technical and communication skills.'}

Recommendation: ${avgScore >= 60 ? 'Consider for next round' : 'Not recommended for this role'}`;
  }
}

module.exports = new AIService();
