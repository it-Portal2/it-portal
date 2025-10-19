// lib/analysis-utils.ts
interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
}

// Get question type distribution for debugging
export function getQuestionTypeDistribution(questions: QuestionAnswer[]): Record<string, number> {
  return questions.reduce((acc, qa) => {
    const type = extractQuestionTypeFromId(qa.id || '');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Question Type Detection from ID
export function extractQuestionTypeFromId(questionId: string): "technical" | "behavioral" | "scenario" | "leadership" {
  const lowerQId = questionId.toLowerCase();
  
  if (lowerQId.includes('technical')) {
    return "technical";
  } else if (lowerQId.includes('behavioral')) {
    return "behavioral";
  } else if (lowerQId.includes('scenario')) {
    return "scenario";
  } else if (lowerQId.includes('leadership')) {
    return "leadership";
  }
  
  return "technical"; // Default fallback
}

// Validate question structure
export function validateQuestionStructure(questions: any[]): boolean {
  return questions.every(q => 
    q.id && 
    typeof q.id === 'string' && 
    q.question && 
    typeof q.question === 'string' && 
    q.answer && 
    typeof q.answer === 'string'
  );
}
