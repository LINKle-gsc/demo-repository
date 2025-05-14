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

  // 시스템 프롬프트 생성
  const systemPrompt = `당신은 사람 간의 친밀한 대화를 자연스럽게 이끌어주는 대화 전문가입니다.\n아래는 한 사용자가 지인(${name})과의 관계에 대해 답변한 내용입니다.\n각 답변을 참고하여, 두 사람이 어색하지 않게 대화를 시작할 수 있는 멘트(스타터)와\n흥미롭고 자연스럽게 이어갈 수 있는 대화 주제(토픽)를 각각 3~5개씩 추천해 주세요.\n\n**아래와 같이 반드시 두 개의 리스트로만 출력해 주세요.**\n- 각 리스트는 반드시 '-'(하이픈)으로 시작하는 줄로만 구성해 주세요.\n- 불필요한 설명, 번호, 기타 텍스트는 절대 포함하지 마세요. 이름이 들어가야 하는 경우 placeholder 대신 지인의 이름(${name})을 사용합니다.\n\n[대화 시작 멘트]\n- (멘트1)\n- (멘트2)\n- (멘트3)\n...\n\n[대화 주제]\n- (주제1)\n- (주제2)\n- (주제3)\n...\n\n아래는 사용자의 답변입니다.`.replace(/\$\{name\}/g, name);
  const promptText = answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n');
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  try {
    const prompt = `${systemPrompt}\n\n${promptText}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        reason: `Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`,
      };
    }
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[응답 없음]';

    // 파싱 로직: [대화 시작 멘트] ~ [대화 주제] ~ 끝
    const starters = [];
    const topics = [];
    let section = null;
    rawText.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('[대화 시작 멘트]')) {
        section = 'starters';
        return;
      }
      if (trimmed.startsWith('[대화 주제]')) {
        section = 'topics';
        return;
      }
      if (trimmed.startsWith('-')) {
        if (section === 'starters') starters.push(trimmed.replace(/^-\s*/, ''));
        else if (section === 'topics') topics.push(trimmed.replace(/^-\s*/, ''));
      }
    });

    return { ok: true, starters, topics, rawText };
  } catch (error) {
    clearTimeout(timeoutId);
    return { ok: false, reason: error.message || '네트워크 오류' };
  }
} 