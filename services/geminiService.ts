
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedExercise, CourseStructure } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const quizSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: {
                type: Type.STRING,
                enum: ['MULTIPLE_CHOICE', 'FILL_IN_THE_BLANK', 'MATCHING', 'ORDERING'],
                description: "The type of exercise."
            },
            question: {
                type: Type.STRING,
                description: "Instruction for the user (e.g., 'Select the correct answer', 'Complete the sentence', 'Match the pairs', 'Order the sentence').",
            },
            concept: {
                type: Type.STRING,
                description: "The specific topic tag. Max 3 words.",
            },
            explanation: {
                type: Type.STRING,
                description: "Short explanation of the solution.",
            },
            // MCQ & Fill Blank
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "For MCQ: 4 choices. For Fill-Blank: 3 wrong words + 1 correct word mixed.",
            },
            correctAnswer: {
                type: Type.STRING,
                description: "For MCQ/Fill-Blank: The correct string. For Fill-Blank, the sentence should include '[BLANK]' where this word goes.",
            },
            // Matching
            pairs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING },
                        match: { type: Type.STRING }
                    }
                },
                description: "For MATCHING only. Generate 4 pairs of related concepts (e.g. Term -> Definition).",
            },
            // Ordering
            segments: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "For ORDERING only. A sentence or process broken into 3-5 logical parts in the CORRECT order.",
            }
        },
        required: ["type", "question", "concept", "explanation"],
    }
};

const courseStructureSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        courseTitle: { type: Type.STRING },
        units: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    sections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: {
                                    type: Type.STRING,
                                    description: "Detailed cheat-sheet content. Definitions, formulas, dates, key facts."
                                }
                            },
                            required: ["title", "description"]
                        }
                    }
                },
                required: ["title", "description", "sections"]
            }
        }
    },
    required: ["courseTitle", "units"]
};

export const generateQuiz = async (
    sectionTitle: string,
    sectionDescription: string,
    difficulty: string,
    lessonTopic: string = "General"
): Promise<GeneratedExercise[]> => {
    if (!apiKey) {
        throw new Error("API Key is missing");
    }

    // Determine question count and Bloom's Taxonomy focus based on difficulty
    let questionCount = 3;
    let typeDistribution = "";
    let bloomFocus = "";

    switch (difficulty) {
        case 'Easy':
            questionCount = 3;
            typeDistribution = "Mix of 70% MULTIPLE_CHOICE, 30% MATCHING (simple pairs).";
            bloomFocus = "REMEMBER & UNDERSTAND (Recall facts and basic concepts: define, duplicate, list, memorize, repeat, state).";
            break;
        case 'Medium':
            questionCount = 5;
            typeDistribution = "Mix of 40% MULTIPLE_CHOICE, 40% FILL_IN_THE_BLANK, 20% MATCHING.";
            bloomFocus = "APPLY & ANALYZE (Use information in new situations; Draw connections among ideas: implement, solve, differentiate, organize, relate).";
            break;
        case 'Hard':
            questionCount = 7;
            typeDistribution = "Mix of 30% FILL_IN_THE_BLANK, 30% ORDERING (complex sentences), 20% MATCHING, 20% MULTIPLE_CHOICE.";
            bloomFocus = "EVALUATE & CREATE (Justify a stand or decision; Produce new or original work: appraise, argue, defend, judge, design, assemble, construct).";
            break;
        default:
            questionCount = 5;
            typeDistribution = "Balanced mix of all types.";
            bloomFocus = "Mix of all Bloom's Taxonomy levels.";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a quiz based *only* on the provided reference text.
      
      REFERENCE TEXT:
      "${sectionDescription}"
      
      METADATA:
      - Section Context: ${sectionTitle}
      - Lesson Focus: ${lessonTopic}
      - Difficulty: ${difficulty}
      - Bloom's Level: ${bloomFocus}
      - Quantity: Generate exactly ${questionCount} exercises.
      
      INSTRUCTIONS:
      ${typeDistribution}
      
      TYPE RULES:
      1. MULTIPLE_CHOICE: Standard question. 'correctAnswer' is the answer string. 'options' contains 4 choices.
      2. FILL_IN_THE_BLANK: 'question' must be a sentence with exactly one '[BLANK]' placeholder (e.g. "The sky is [BLANK]."). 'correctAnswer' is the missing word. 'options' contains the correct word + 3 distractors.
      3. MATCHING: 'pairs' must contain 4 pairs. 'question' should be "Match the following". Ignore options/correctAnswer fields.
      4. ORDERING: 'segments' must contain a sentence broken into 3-5 parts in the CORRECT order. 'question' should be "Arrange the sentence". Ignore options/correctAnswer fields.

      VARIATION RULES:
      - VARY THE EXERCISE TYPES according to the difficulty distribution.
      - Ensure questions are complete sentences.
      `,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");

        return JSON.parse(text) as GeneratedExercise[];
    } catch (error) {
        console.error("Gemini API Error:", error);
        // Fallback data
        return [
            {
                type: 'MULTIPLE_CHOICE',
                question: "There was an error generating the quiz questions.",
                concept: "Error",
                options: ["Retry", "Cancel", "Ignore", "Report"],
                correctAnswer: "Retry",
                explanation: "Please try again later."
            }
        ];
    }
};

export const generateCourseFromDocument = async (base64Data: string, mimeType: string, subject: string, language: string): Promise<CourseStructure> => {
    if (!apiKey) throw new Error("API Key is missing");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                {
                    text: `Analyze the provided document and create a single, comprehensive learning unit for: "${subject}" (Language: ${language}).
                    
                    REQUIREMENTS:
                    1. Generate exactly ONE Unit. Do not create multiple units.
                    2. The Unit Title should reflect the main topic of the document.
                    3. Divide the content into logical Sections within this single Unit.
                    
                    CRITICAL:
                    - Do NOT generate a list of topics.
                    - The 'description' for each SECTION is the most important field. It must be a detailed "Cheat Sheet" containing actual facts, dates, formulas, vocab, or definitions from the source document.
                    - The questions will be generated purely from this description later, so make it comprehensive.
                    `
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: courseStructureSchema
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");

        return JSON.parse(text) as CourseStructure;
    } catch (error) {
        console.error("Gemini Course Gen Error:", error);
        throw error;
    }
}
