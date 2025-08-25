// pages/api/resume-analysis.js
export default async function handler(req, res) {
  // Set CORS headers for ALL requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileData, fileName, fileType, fileSize } = req.body;

    // Input validation
    if (!fileData) {
      return res.status(400).json({ 
        success: false,
        error: "No file data provided"
      });
    }

    if (fileType !== 'application/pdf') {
      return res.status(400).json({ 
        success: false,
        error: "Only PDF files are supported"
      });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false,
        error: "File too large (max 5MB)"
      });
    }

    // Import your functions dynamically
    const { analyzeResumeWithAI, generateInterviewQuestions } = await import('../../lib/gemini');

    // Step 1: Resume analysis
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType);

    // Step 2: Question generation
    const questions = await generateInterviewQuestions(resumeAnalysis);

    return res.status(200).json({
      success: true,
      resumeAnalysis,
      questions,
      questionsCount: questions.length
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return res.status(500).json({
      success: false,
      error: `Resume analysis failed: ${errorMessage}. Please try again.`
    });
  }
}
