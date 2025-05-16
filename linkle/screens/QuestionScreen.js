import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TextInput, Button, Alert, ActivityIndicator, Share, TouchableOpacity, ScrollView, StyleSheet as RNStyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestGeminiSuggestions, requestRefinedQuestion } from '../api/QuestionApi';
import { styles as commonStylesFromQuestionStyles } from '../styles/QuestionStyles'; // 기존 스타일 임포트 이름 변경
import Constants from 'expo-constants'; // For status bar height

const TOTAL_QUESTIONS = 5;
const FIRST_QUESTION = "When did you first get to know {name}?"

// Q2부터 Q5까지의 기본 질문 템플릿
const BASE_QUESTIONS_TEMPLATES = [
  "How did you and {name} meet?",
  "Do you have any fun memories or episodes with {name}?",
  "What kind of conversation would you like to have with {name}?",
  "How often do you and {name} stay in touch?"
];

// API에 전달할 질문 개선 지침
const REFINEMENT_PROMPT_VARIABLE = `이전 사용자의 답변 내용을 참고하고, 다음에 제시될 기본 질문의 핵심 의도는 유지하면서, 친구 ({name})와의 대화가 좀 더 개인적이고 깊이 있게 이어질 수 있도록 질문을 자연스럽게 개선해주세요. 개선된 질문에는 {name}의 이름이 포함되어야 합니다. 너무 길지 않게, 친근한 말투로 수정해주세요.`;

// 질문 입력 컴포넌트 분리
function QuestionInput({ question, value, onChange, placeholder, disabled }) {
  return (
    <>
      <Text style={commonStylesFromQuestionStyles.question}>{question}</Text>
      <TextInput
        style={commonStylesFromQuestionStyles.input}
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
      <Text style={commonStylesFromQuestionStyles.heading}>{title}</Text>
      {items.map((item, idx) => (
        <TouchableOpacity key={idx} onPress={() => onSelect(idx)}>
          <Text style={selected.includes(idx) ? commonStylesFromQuestionStyles.selectedItem : commonStylesFromQuestionStyles.item}>
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
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0); // 현재 몇 번째 *질문 사이클*인지 (0-4)
  const [chatMessages, setChatMessages] = useState([]);
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 답변 처리 및 다음 질문 개선 중 로딩
  // isLoadingQuestions는 첫 질문이 고정되므로 크게 필요하지 않음
  const [stage, setStage] = useState('questions'); 
  const [starters, setStarters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedStarters, setSelectedStarters] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [resultText, setResultText] = useState('');
  const flatListRef = useRef(null);

  // 첫 번째 질문과 답변을 저장하기 위한 상태
  const [firstQuestionActualText, setFirstQuestionActualText] = useState('');
  const [firstAnswerActualText, setFirstAnswerActualText] = useState('');

  // 네비게이션 헤더 높이 (대략적인 값, 실제 앱에 맞게 조절 필요)
  // StackNavigator의 기본 헤더를 사용하고 있다면 그 높이를 고려해야 합니다.
  // 현재 QuestionScreen은 App.js에서 options={{ title: '질문하기' }}로 기본 헤더를 사용 중입니다.
  // expo-constants statusBarHeight는 상태표시줄 높이이므로, 네비게이션 헤더 높이는 별도 계산 또는 고정값 사용.
  // React Navigation의 기본 헤더 높이는 플랫폼과 버전에 따라 다를 수 있으나, 대략 56(Android) ~ 44+StatusBar(iOS)dp.
  // 여기서는 iOS의 경우 Status Bar + Nav Bar를 합쳐서 대략적인 값을 줍니다.
  const headerHeight = Platform.OS === 'ios' ? 44 + Constants.statusBarHeight : Constants.statusBarHeight + 56; 

  useEffect(() => {
    if (name) {
      setChatMessages([]); 
      setActiveQuestionIndex(0); 
      const initialQuestionText = FIRST_QUESTION.replaceAll('{name}', name);
      setFirstQuestionActualText(initialQuestionText); // 첫 번째 질문 실제 텍스트 저장
      setFirstAnswerActualText(''); // 이름 변경 시 첫 번째 답변 초기화
      setChatMessages([{ id: 'q0', type: 'question', text: initialQuestionText }]);
    }
  }, [name]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (currentInputValue.trim() === '') return;

    const userAnswer = currentInputValue.trim();
    const currentQuestionMessage = chatMessages.filter(msg => msg.type === 'question').slice(-1)[0];
    const immediatePreviousQuestionText = currentQuestionMessage?.text || "";

    const newAnswer = { 
      id: 'a' + activeQuestionIndex,
      type: 'answer',
      text: userAnswer
    };
        
    // 첫 번째 질문에 대한 답변인 경우 저장
    if (activeQuestionIndex === 0) {
      setFirstAnswerActualText(userAnswer);
    }

    setChatMessages(prevMessages => [...prevMessages, newAnswer]);
    setCurrentInputValue('');
    
    const nextQuestionCycleIndex = activeQuestionIndex + 1; // 다음에 진행할 질문 사이클 (1-5)

    if (nextQuestionCycleIndex < TOTAL_QUESTIONS) {
      setIsLoading(true);
      try {
        // nextQuestionCycleIndex는 1, 2, 3, 4가 될 수 있음.
        // BASE_QUESTIONS_TEMPLATES의 인덱스는 0, 1, 2, 3이 됨.
        const baseQuestionTemplateIndex = nextQuestionCycleIndex - 1;
        
        // 배열 범위 확인 추가
        if (baseQuestionTemplateIndex < BASE_QUESTIONS_TEMPLATES.length) {
            const baseQuestionToRefine = BASE_QUESTIONS_TEMPLATES[baseQuestionTemplateIndex].replaceAll('{name}', name);
            
            // API에 전달할 첫 번째 질문/답변 (Q3부터 유효)
            const q1TextForApi = activeQuestionIndex >= 1 ? firstQuestionActualText : null;
            const a1TextForApi = activeQuestionIndex >= 1 ? firstAnswerActualText : null;

            const response = await requestRefinedQuestion(
              name,
              baseQuestionToRefine,
              immediatePreviousQuestionText, // 바로 이전 질문
              userAnswer,                 // 바로 이전 답변 (현재 제출된 답변)
              REFINEMENT_PROMPT_VARIABLE,
              q1TextForApi,                // 첫 번째 질문 텍스트 (Q3부터 전달)
              a1TextForApi                 // 첫 번째 답변 텍스트 (Q3부터 전달)
            );

            if (response.ok && response.refinedQuestion) {
              setChatMessages(prevMessages => [...prevMessages, {
                id: 'q' + nextQuestionCycleIndex,
                type: 'question',
                text: response.refinedQuestion // API가 {name}을 이미 처리했다고 가정, 필요시 .replaceAll('{name}', name)
              }]);
              setActiveQuestionIndex(nextQuestionCycleIndex);
            } else {
              Alert.alert('다음 질문 생성 실패', response.reason || '다음 질문을 받아오는데 실패했습니다. 기본 질문으로 표시합니다.');
              // API 실패 시, 기본 템플릿 질문이라도 보여주기
              setChatMessages(prevMessages => [...prevMessages, {
                id: 'q' + nextQuestionCycleIndex,
                type: 'question',
                text: baseQuestionToRefine // 기본 템플릿 사용
              }]);
              setActiveQuestionIndex(nextQuestionCycleIndex);
            }
        } else {
            // 이 경우는 발생하지 않아야 하지만, 안전장치로 추가
            console.error("BASE_QUESTIONS_TEMPLATES 인덱스 오류", baseQuestionTemplateIndex);
            Alert.alert("오류", "질문 목록 구성에 문제가 있습니다.");
            setIsLoading(false); // 로딩 중단
            return; // 함수 종료
        }
      } catch (error) {
        Alert.alert('질문 생성 오류', '다음 질문을 생성하는 중 오류가 발생했습니다. 기본 질문으로 표시합니다.');
        console.error("Error fetching refined question:", error);
        // 오류 발생 시에도 기본 질문 템플릿을 사용하려고 시도 (인덱스 확인 필요)
        const baseQuestionTemplateIndexOnError = nextQuestionCycleIndex - 1;
        if (baseQuestionTemplateIndexOnError < BASE_QUESTIONS_TEMPLATES.length) {
            const baseQuestionToRefineOnError = BASE_QUESTIONS_TEMPLATES[baseQuestionTemplateIndexOnError].replaceAll('{name}', name);
            setChatMessages(prevMessages => [...prevMessages, {
                id: 'q' + nextQuestionCycleIndex,
                type: 'question',
                text: baseQuestionToRefineOnError
            }]);
            setActiveQuestionIndex(nextQuestionCycleIndex);
        } else {
            console.error("Catch - BASE_QUESTIONS_TEMPLATES 인덱스 오류", baseQuestionTemplateIndexOnError);
            Alert.alert("오류", "질문 목록 구성에 문제가 있어 다음 질문을 표시할 수 없습니다.");
        }
      }
      setIsLoading(false);
    } else {
      setActiveQuestionIndex(nextQuestionCycleIndex); // 모든 질문 완료 (TOTAL_QUESTIONS 도달)
      // 이제 handleComplete를 누를 수 있게 됨
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    const collectedAnswers = chatMessages
      .filter(msg => msg.type === 'answer')
      .map(msg => msg.text);
    
    if (collectedAnswers.length !== TOTAL_QUESTIONS) {
        Alert.alert("답변 미완료", `모든 질문(${TOTAL_QUESTIONS}개)에 답변해주세요.`);
        setIsLoading(false);
        return;
    }

    const result = await requestGeminiSuggestions({ answers: collectedAnswers, name });
    setIsLoading(false);

    if (result.ok) {
      navigation.navigate('TopicResult', {
        starters: result.starters,
        topics: result.topics,
        rawText: result.rawText,
        name,
      });
    } else {
      Alert.alert('Linkle 생성 실패', result.reason || '결과를 가져오는데 실패했습니다.');
    }
  };
  
  const renderChatItem = ({ item }) => {
    const messageStyle = item.type === 'question' ? styles.questionBubble : styles.answerBubble;
    const textStyle = item.type === 'question' ? styles.questionText : styles.answerText;
    const alignment = item.type === 'question' ? 'flex-start' : 'flex-end';

    return (
      <View style={[styles.messageRow, { justifyContent: alignment }]}>
        <View style={[styles.messageBubble, messageStyle]}>
          <Text style={textStyle}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const allQuestionsAnswered = activeQuestionIndex >= TOTAL_QUESTIONS;

  if (stage === 'questions') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={headerHeight}
        >
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatListContainer}
            ListEmptyComponent={chatMessages.some(msg => msg.type === 'question') ? <Text style={styles.emptyChatText}>대화를 시작해주세요.</Text> : <Text style={styles.emptyChatText}>질문을 불러올 수 없습니다.</Text>}
            style={{ flex: 1 }}
          />
          <View style={styles.inputContainer}>
            {allQuestionsAnswered ? (
              <TouchableOpacity
                onPress={handleComplete}
                disabled={isLoading}
                style={[styles.sendButton, styles.readyButton]}
                activeOpacity={0.7}
              >
                <Text style={styles.sendButtonText}>Ready to talk</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={currentInputValue}
                  onChangeText={setCurrentInputValue}
                  placeholder={"Say something about this…"}
                  placeholderTextColor="#A9A9A9"
                  editable={!isLoading} 
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={isLoading || currentInputValue.trim() === ''}
                  style={styles.sendButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {isLoading && ( 
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#B08D57" />
              <Text style={styles.loadingText}>다음 질문을 만들고 있어요...</Text>
            </View>
          )}
        </KeyboardAvoidingView>
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

// DeviceContactsScreen.js의 디자인을 적용한 새로운 스타일
const styles = RNStyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF4',
    paddingTop: Constants.statusBarHeight, 
  },
  chatListContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    maxWidth: '85%',
  },
  questionBubble: {
    backgroundColor: '#F8F5ED',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 6, 
  },
  answerBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0D8C0',
    alignSelf: 'flex-end',
    borderTopRightRadius: 6,
  },
  questionText: {
    color: '#4A4031',
    fontSize: 16,
    lineHeight: 22,
  },
  answerText: {
    color: '#B08D57',
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0D8C0', 
    backgroundColor: '#FFFCF4',
  },
  input: {
    flex: 1,
    height: 48,
    borderColor: '#E0D8C0', 
    borderWidth: 1,
    borderRadius: 24, 
    paddingHorizontal: 18,
    marginRight: 10,
    backgroundColor: '#FFFFFF', 
    fontSize: 16,
    color: '#4A4031',
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B08D57',
    borderRadius: 24,
    minWidth: 80,
  },
  readyButton: { 
    flex: 1,
    backgroundColor: '#B08D57', 
  },
  sendButtonText: {
    fontSize: 16,
    color: '#FFFFFF', 
    fontWeight: '600',
  },
  emptyChatText:{
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#7A705F',
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(255, 252, 244, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4A4031',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  container: {
    padding: 20,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

// CustomButton 컴포넌트는 QuestionScreen 내부에서 TouchableOpacity로 대체되었으므로 제거 가능
// 또는 필요 시 스타일만 참고
/*
const customButtonStyles = RNStyleSheet.create({
  // ... (이전 customButtonStyles 내용) ...
});
*/ 