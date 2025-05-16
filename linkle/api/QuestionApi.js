import Constants from 'expo-constants';

const GEMINI_API_KEY = (Constants.expoConfig?.extra?.geminiApiKey || '').trim();
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Gemini API에 대화 추천을 요청하고, 파싱된 리스트를 반환합니다.
 * @param {Object} params
 * @param {string[]} params.answers - 사용자의 답변 배열
 * @param {string} params.name - 친구 이름
 * @returns {Promise<{ok: true, starters: string[], topics: string[], rawText: string} | {ok: false, reason: string}>}
 */
export async function requestGeminiSuggestions({ answers, name }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 시스템 프롬프트를 영어 중심으로 수정하고, 최종 결과물(스타터, 토픽) 영어로 명시
  const systemPrompt = `You are an expert conversation facilitator helping a user start a meaningful chat with their friend, ${name}.
Based on the user's answers below about their relationship with ${name}, please recommend 3-5 conversation starters and 3-5 interesting topics.

**Output Format (Crucial):**
- Clearly distinguish between the user and the friend named ${name}.
- Never refer to the user as ${name} under any circumstances.
- Provide ONLY two lists: one for starters and one for topics.
- Each list item MUST begin with a hyphen ('-').
- Do NOT include any extra explanations, numbering, or other text.
- If ${name}'s name should be in a starter or topic, use the actual name "${name}" instead of a placeholder.
- **All conversation starters and topics MUST be in English.**

[Conversation Starters]
- (Starter 1 in English)
- (Starter 2 in English)
- (Starter 3 in English)
...

[Conversation Topics]
- (Topic 1 in English)
- (Topic 2 in English)
- (Topic 3 in English)
...

User's answers regarding ${name}:
${answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}`;

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  try {
    // const prompt = `${systemPrompt}\n\n${promptText}`; // promptText는 이미 systemPrompt에 통합됨
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }], // 수정된 systemPrompt 사용
          },
        ],
        // generationConfig: { responseMimeType: "application/json" } // 이 API는 특정 JSON 구조를 강제하지 않음
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        reason: `Gemini API 오류 (Suggestions): ${response.status} ${response.statusText} - ${errorText}`,
      };
    }
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[No response text]';

    const starters = [];
    const topics = [];
    let currentSection = null; // 변수명 변경 (section -> currentSection)
    rawText.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('[conversation starters]')) { // 소문자 비교 추가
        currentSection = 'starters';
        return;
      }
      if (trimmed.toLowerCase().startsWith('[conversation topics]')) { // 소문자 비교 추가
        currentSection = 'topics';
        return;
      }
      if (trimmed.startsWith('-')) {
        const itemText = trimmed.replace(/^-\s*/, '');
        if (itemText) { // 빈 항목 추가 방지
          if (currentSection === 'starters') starters.push(itemText);
          else if (currentSection === 'topics') topics.push(itemText);
        }
      }
    });

    // 만약 starters나 topics가 비어있다면, rawText에서 파싱이 제대로 안된 것일 수 있음.
    // 이 경우, 사용자에게 rawText라도 보여주거나, 다른 fallback 처리 고려.
    if (starters.length === 0 && topics.length === 0 && rawText !== '[No response text]') {
      console.warn("Could not parse starters/topics, but rawText is available:", rawText);
      // 예시: topics에 rawText의 일부를 넣어주거나, 특정 메시지 전달
      // topics.push("Could not parse specific topics, please refer to the raw response if needed.");
    }

    return { ok: true, starters, topics, rawText };
  } catch (error) {
    clearTimeout(timeoutId);
    return { ok: false, reason: error.message || 'Network error or unknown error during suggestions generation' };
  }
}

// requestInitialQuestions 및 requestNextQuestion 함수는 이제 사용되지 않으므로 제거하거나 주석 처리합니다.
/*
export async function requestInitialQuestions(name) { ... }
export async function requestNextQuestion(name, previousQuestion, previousAnswer) { ... }
*/

/**
 * Gemini API에 이전 대화 내용과 기본 질문, 그리고 개선 지침을 전달하여
 * 맥락에 맞게 개선된 다음 질문 하나를 받아옵니다.
 * @param {string} name - 친구 이름
 * @param {string} baseQuestionToRefine - 개선의 기반이 될 기본 질문 템플릿
 * @param {string} immediatePreviousQuestionText - 바로 이전에 물었던 실제 질문 내용
 * @param {string} immediatePreviousAnswerText - 이전 질문에 대한 사용자의 답변
 * @param {string} refinementPromptVariable - 질문 개선 방식에 대한 사용자 정의 지침
 * @param {string | null} firstQuestionText - (옵셔널) 첫 번째 질문의 실제 텍스트 (Q3+ 생성 시 제공)
 * @param {string | null} firstAnswerText - (옵셔널) 첫 번째 질문에 대한 답변 (Q3+ 생성 시 제공)
 * @returns {Promise<{ok: true, refinedQuestion: string} | {ok: false, reason: string}>}
 */
export async function requestRefinedQuestion(name, baseQuestionToRefine, immediatePreviousQuestionText, immediatePreviousAnswerText, refinementPromptVariable, firstQuestionText, firstAnswerText) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let firstInteractionContext = "";
  if (firstQuestionText && firstAnswerText) {
    firstInteractionContext = `
[Initial Conversation Context]
First question: ${firstQuestionText}
First answer: ${firstAnswerText}
`;
  }

  // 시스템 프롬프트를 영어 중심으로 수정, 최종 질문 영어로 명시
  const systemPrompt = `You are an AI conversation designer tasked with making a user's chat with their friend (${name}) more natural and meaningful.

User's friend's name: "${name}"
${firstInteractionContext}
[Previous turn in the conversation]
Previous question to ${name}: ${immediatePreviousQuestionText}
User's answer regarding ${name}: ${immediatePreviousAnswerText}

[Base intent for the next question]:
${baseQuestionToRefine} 

[Guideline for refining the question]:
${refinementPromptVariable} // This is already in English as per QuestionScreen.js

Considering all the information above (especially "Initial Conversation Context" and "Previous turn"), generate ONE new question based on the "Base intent for the next question".
This new question must follow the "Guideline for refining the question" and should naturally continue the conversation from the previous turn.
It must include the friend's name, "${name}".
**The refined question must be in English.**

Please provide the response ONLY in the following JSON format, with no other text:
{ "refinedQuestion": "The final refined question content (in English)" }

Example (the actual content will vary greatly based on input, but the response must be in English):
{ "refinedQuestion": "So, ${name}, what were some of the specific feelings or thoughts you had during that experience?" }`;

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (RefinedQuestion): ${response.status} ${response.statusText} - ${errorText}`);
      return {
        ok: false,
        reason: `Gemini API 오류: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    let rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonText) {
      return { ok: false, reason: 'API로부터 유효한 다음 질문 데이터를 받지 못했습니다 (No text part).' };
    }

    rawJsonText = rawJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
      const parsedResponse = JSON.parse(rawJsonText);
      if (parsedResponse && typeof parsedResponse.refinedQuestion === 'string' && parsedResponse.refinedQuestion.trim() !== '') {
        return { ok: true, refinedQuestion: parsedResponse.refinedQuestion };
      } else {
        console.warn("Parsed data is not a valid refined question object:", parsedResponse);
        return { ok: false, reason: 'API 응답이 유효한 다음 질문 형식이 아닙니다.' };
      }
    } catch (parseError) {
      console.error("Error parsing refined question JSON:", parseError, "Raw text:", rawJsonText);
      return { ok: false, reason: `다음 질문 파싱 오류: ${parseError.message}` };
    }

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error in requestRefinedQuestion:", error);
    return { ok: false, reason: error.message || '네트워크 오류 또는 알 수 없는 다음 질문 생성 오류' };
  }
}

/**
 * Gemini API에 전체 대화 내용을 전달하여 간결한 요약문을 생성합니다.
 * @param {string} name - 친구 이름
 * @param {Array<{type: string, text: string}>} conversationHistory - 전체 대화 기록 (질문과 답변)
 * @returns {Promise<{ok: true, summary: string} | {ok: false, reason: string}>}
 */
export async function requestConversationSummary(name, conversationHistory) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 대화 기록을 문자열로 변환
  const formattedConversation = conversationHistory.map(entry => {
    if (entry.type === 'question') {
      return `Q: ${entry.text}`;
    }
    return `A: ${entry.text}`;
  }).join('\n');

  const systemPrompt = `You are an AI assistant that summarizes a conversation between a user and a series of questions about their friend, ${name}.

The following is the conversation history:
${formattedConversation}

Please provide a concise summary of what the user shared about ${name} through their answers. 
This summary will be shown to the user to remind them of the context before showing topic suggestions.
Keep the summary brief (1-2 sentences) and in English.

Respond ONLY with a JSON object in the following format, with no other text:
{ "summary": "Generated concise summary in English about what the user shared regarding ${name}." }

Example:
{ "summary": "You shared how you first met ${name} and a fun memory you have together." }`;

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (Summary): ${response.status} ${response.statusText} - ${errorText}`);
      return {
        ok: false,
        reason: `Gemini API 오류 (Summary): ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    let rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonText) {
      return { ok: false, reason: 'API로부터 유효한 요약 데이터를 받지 못했습니다 (No text part).' };
    }

    rawJsonText = rawJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
      const parsedResponse = JSON.parse(rawJsonText);
      if (parsedResponse && typeof parsedResponse.summary === 'string' && parsedResponse.summary.trim() !== '') {
        return { ok: true, summary: parsedResponse.summary };
      } else {
        console.warn("Parsed data is not a valid summary object:", parsedResponse);
        return { ok: false, reason: 'API 응답이 유효한 요약 형식이 아닙니다.' };
      }
    } catch (parseError) {
      console.error("Error parsing summary JSON:", parseError, "Raw text:", rawJsonText);
      return { ok: false, reason: `요약 파싱 오류: ${parseError.message}` };
    }

  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error in requestConversationSummary:", error);
    return { ok: false, reason: error.message || '네트워크 오류 또는 알 수 없는 요약 생성 오류' };
  }
} 