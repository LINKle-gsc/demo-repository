import React, { useState } from 'react';
import { Text, View, TextInput, Button, SafeAreaView, Alert, ActivityIndicator, Share, TouchableOpacity, ScrollView, StyleSheet as RNStyleSheet } from 'react-native';
import { requestGeminiSuggestions } from '../api/QuestionApi';
import { styles } from '../styles/QuestionStyles';

// 질문 상수
const QUESTIONS = [
  "당신은 {name}님을 어떻게 부르나요?",
  "당신과 {name}님은 언제 처음 알게 되셨나요?",
  "당신과 {name}님은 어떻게 만났나요?",
  "당신과 {name}님과의 재밌는 에피소드가 있나요?",
  "당신은 {name}님과 어떤 대화를 하고 싶으신가요?",
  "당신과 {name}님과는 얼마나 자주 연락하시나요?"
];

// 질문 입력 컴포넌트 분리
function QuestionInput({ question, value, onChange, placeholder, disabled }) {
  return (
    <>
      <Text style={styles.question}>{question}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        editable={!disabled}
      />
    </>
  );
}

// 결과 리스트 컴포넌트 분리
function ResultList({ title, items, selected, onSelect }) {
  return (
    <>
      <Text style={styles.heading}>{title}</Text>
      {items.map((item, idx) => (
        <TouchableOpacity key={idx} onPress={() => onSelect(idx)}>
          <Text style={selected.includes(idx) ? styles.selectedItem : styles.item}>
            {idx + 1}: {item}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

// 커스텀 버튼 컴포넌트
function CustomButton({ title, onPress, disabled, style, textStyle }) {
  return (
    <TouchableOpacity
      style={[customButtonStyles.button, style, disabled && customButtonStyles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[customButtonStyles.buttonText, textStyle, disabled && customButtonStyles.disabledButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
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
    const result = await requestGeminiSuggestions({ answers, name });
    setIsLoading(false);

    if (result.ok) {
      navigation.navigate('Result', {
        starters: result.starters,
        topics: result.topics,
        rawText: result.rawText,
        name,
      });
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <QuestionInput
            question={questionText}
            value={answers[currentQuestionIndex]}
            onChange={handleAnswerChange}
            placeholder={placeholderText}
            disabled={isLoading}
          />
          <View style={[styles.buttonContainer, { paddingBottom: 60 }]}>
            <CustomButton
              title="이전"
              onPress={handlePrevious}
              disabled={isFirstQuestion || isLoading}
            />
            <CustomButton
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
        </ScrollView>
      </SafeAreaView>
    );
  }
  // stage === 'result'
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {resultText ? (
          <Text style={styles.resultText}>{resultText}</Text>
        ) : null}
        <ResultList
          title={`이렇게 ${name}님과의 대화를 시작해볼까요?`}
          items={starters}
          selected={selectedStarters}
          onSelect={idx => setSelectedStarters(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
        />
        <ResultList
          title="이런 주제로 대화해보시는 건 어떠세요?"
          items={topics}
          selected={selectedTopics}
          onSelect={idx => setSelectedTopics(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
        />
        <View style={{ marginBottom: 60 }}>
          <Button title="공유" onPress={() => {
            const message =
              '대화 시작:\n' + selectedStarters.map(i => `- ${starters[i]}`).join('\n') +
              '\n\n주제:\n' + selectedTopics.map(i => `- ${topics[i]}`).join('\n');
            Share.share({ message });
          }}/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 커스텀 버튼 스타일
const customButtonStyles = RNStyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,      // 세로 패딩 (기본 8에서 좀 더 키움)
    paddingHorizontal: 16,  // 가로 패딩 (기본 8에서 좀 더 키움)
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100, // 버튼의 최소 너비 설정으로 크기 확보
    marginHorizontal: 10, // 버튼 사이 간격
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16, // 폰트 크기 약간 키움
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A9A9A9', // 비활성화 시 배경색
  },
  disabledButtonText: {
    color: '#D3D3D3', // 비활성화 시 텍스트 색
  }
});

// QuestionStyles.js에 buttonContainer 스타일이 정의되어 있다고 가정합니다.
// 예시: styles.buttonContainer = {
//   flexDirection: 'row',
//   justifyContent: 'space-around', // 또는 'space-between'
//   width: '100%',
//   marginTop: 20,
// }; 