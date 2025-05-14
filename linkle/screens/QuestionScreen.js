import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, SafeAreaView, Alert, ActivityIndicator, Share, FlatList, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

// 질문 상수
const QUESTIONS = [
  "당신과 {name}님은 어떤 관계인가요?",
  "당신과 {name}님은 언제 처음 알게 되셨나요?",
  "당신과 {name}님은 어떻게 만났나요?",
  "당신과 {name}님과의 재밌는 에피소드가 있나요?",
  "당신은 {name}님과 어떤 대화를 하고 싶으신가요?",
  "당신과 {name}님과는 얼마나 자주 연락하시나요?"
];

// API 관련 상수
const GEMINI_API_KEY = (Constants.expoConfig?.extra?.geminiApiKey || '').trim();
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const REQUEST_TIMEOUT_MS = 10000;

// API 호출 함수 (명확한 네이밍, 단일 책임)
async function sendAnswersToGeminiApi(answers, name = '') {
  console.log('[Gemini] 함수 진입');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 시스템 프롬프트 생성
  const systemPrompt = `당신은 사람 간의 친밀한 대화를 자연스럽게 이끌어주는 대화 전문가입니다.\n\n아래는 한 사용자가 친구(${name})와의 관계에 대해 답변한 내용입니다.\n각 답변을 참고하여, 두 사람이 어색하지 않게 대화를 시작할 수 있는 멘트(스타터)와 흥미롭고 자연스럽게 이어갈 수 있는 대화 주제(토픽)를 각각 3~5개씩 추천해 주세요.\n\n- 대화 시작 멘트(스타터)는 실제로 바로 사용할 수 있는 문장 형태로 제시해 주세요.\n- 대화 주제(토픽)는 한 문장 또는 키워드 형태로 제시해 주세요.\n- 추천 결과는 아래와 같은 형식으로 출력해 주세요.\n\n[대화 시작 멘트]\n- (멘트1)\n- (멘트2)\n- (멘트3)\n...\n\n[대화 주제]\n- (주제1)\n- (주제2)\n- (주제3)\n...\n\n아래는 사용자의 답변입니다.`;

  // 질문 배열을 prompt 텍스트로 합치기
  const promptText = answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n');
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

  console.log('[Gemini] API KEY:', GEMINI_API_KEY);
  console.log('[Gemini] URL:', url);
  console.log('[Gemini] systemPrompt:', systemPrompt);
  console.log('[Gemini] promptText:', promptText);

  try {
    console.log('[Gemini] fetch 요청 시작');
    const prompt = `${systemPrompt}\n\n${promptText}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log('[Gemini] fetch 응답 수신, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Gemini] 오류 응답 본문:', errorText);
      return {
        ok: false,
        reason: `Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`
      };
    }
    const data = await response.json();
    console.log('[Gemini] 응답 JSON:', data);
    // 응답 구조에서 텍스트만 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[응답 없음]';
    console.log('[Gemini] 최종 추출 텍스트:', text);
    return { ok: true, data: text };
  } catch (error) {
    clearTimeout(timeoutId);
    console.log('[Gemini] 예외 발생:', error);
    return { ok: false, reason: error.message || '네트워크 오류' };
  }
}

export default function QuestionScreen({ navigation, route }) {
  const name = route?.params?.name || '';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('questions'); // 'questions' or 'result'
  const [starters, setStarters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedStarters, setSelectedStarters] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [resultText, setResultText] = useState('');

  const handleAnswerChange = (text) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = text;
    setAnswers(newAnswers);
  };

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;

  // 완료 버튼 클릭 시
  const handleComplete = async () => {
    setIsLoading(true);
    const result = await sendAnswersToGeminiApi(answers, name);
    setIsLoading(false);

    if (result.ok) {
      // Parse result.data into two sections
      const lines = result.data.split(/\n\n+/);
      const findSection = (label) => lines.findIndex(l => l.trim().startsWith(label));
      const startersIdx = findSection('[대화 시작 멘트]');
      const topicsIdx = findSection('[대화 주제]');
      const parseList = (section) =>
        section.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^\-\s*/, '').trim());
      const newStarters = startersIdx !== -1 ? parseList(lines[startersIdx + 1] || '') : [];
      const newTopics = topicsIdx !== -1 ? parseList(lines[topicsIdx + 1] || '') : [];
      setStarters(newStarters);
      setTopics(newTopics);
      setResultText(result.data); // 전체 결과 텍스트 저장
      setStage('result');
    } else {
      Alert.alert('오류', result.reason);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    if (!isLastQuestion) setCurrentQuestionIndex(currentQuestionIndex + 1);
    else handleComplete();
  };

  // 질문 텍스트와 placeholder에 name 치환 적용
  const questionText = QUESTIONS[currentQuestionIndex].replaceAll('{name}', name);
  const placeholderText = `답변을 입력하세요. 예: ${name}`;

  // Conditionally render based on stage
  if (stage === 'questions') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.question}>{questionText}</Text>
          <TextInput
            style={styles.input}
            value={answers[currentQuestionIndex]}
            onChangeText={handleAnswerChange}
            placeholder={placeholderText}
            placeholderTextColor="#aaa"
            editable={!isLoading}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="이전"
              onPress={handlePrevious}
              disabled={isFirstQuestion || isLoading}
            />
            <Button
              title={isLastQuestion ? "완료" : "다음"}
              onPress={handleNext}
              disabled={isLoading}
            />
          </View>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }
  // stage === 'result'
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {resultText ? (
          <Text style={styles.resultText}>{resultText}</Text>
        ) : null}
        <Text style={styles.heading}>이렇게 {name}님과의 대화를 시작해볼까요?</Text>
        {starters.map((item, idx) => (
          <TouchableOpacity key={idx} onPress={() => {
            setSelectedStarters(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
          }}>
            <Text style={selectedStarters.includes(idx) ? styles.selectedItem : styles.item}>[ ] {idx+1}. {item}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.heading}>이런 주제로 대화해보시는 건 어떠세요?</Text>
        {topics.map((item, idx) => (
          <TouchableOpacity key={idx} onPress={() => {
            setSelectedTopics(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
          }}>
            <Text style={selectedTopics.includes(idx) ? styles.selectedItem : styles.item}>[ ] {idx+1}. {item}</Text>
          </TouchableOpacity>
        ))}
        <Button title="공유" onPress={() => {
          const message =
            '대화 시작:\n' + selectedStarters.map(i => `- ${starters[i]}`).join('\n') +
            '\n\n주제:\n' + selectedTopics.map(i => `- ${topics[i]}`).join('\n');
          Share.share({ message });
        }}/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 30,
    textAlign: 'center',
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#222',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: { fontSize: 20, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
  item: { fontSize: 16, marginVertical: 5, color: '#222' },
  selectedItem: { fontSize: 16, marginVertical: 5, color: '#007AFF' },
  resultText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
  },
}); 