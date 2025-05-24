import React, { useState } from 'react';
import { Text, View, TextInput, Button, Share, TouchableOpacity, ScrollView, StyleSheet as RNStyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles as commonStylesFromQuestionStyles } from '../styles/QuestionStyles';
import { useChat, useQuestions, useCompletion } from '../hooks';
import Constants from 'expo-constants';

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
const REFINEMENT_PROMPT_VARIABLE = `Based on the user's previous answer, please refine the upcoming base question to make the conversation with user's friend ({name}) more personal and in-depth, while keeping the core intent of the base question. The refined question must include {name}'s name. Please keep it concise and use a friendly tone. Keep in mind that you are talking to the user, NOT to {name}. Do NOT start conversation with user's friend name ({name}).`;

/**
 * 결과 리스트를 렌더링하는 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.title - 리스트 제목
 * @param {string[]} props.items - 표시할 아이템 배열
 * @param {number[]} props.selected - 선택된 아이템의 인덱스 배열
 * @param {Function} props.onSelect - 아이템 선택 시 호출되는 콜백 함수
 * @returns {JSX.Element} 결과 리스트 컴포넌트
 */
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

/**
 * 질문-답변 화면을 구성하는 메인 컴포넌트
 * 사용자와의 대화형 질문을 통해 친구와의 관계 정보를 수집하고,
 * AI를 통해 대화 주제와 시작 문구를 생성합니다.
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.navigation - React Navigation의 navigation 객체
 * @param {Object} props.route - 라우트 매개변수를 포함한 route 객체
 * @param {string} props.route.params.name - 대화 상대방의 이름
 * @returns {JSX.Element} 질문 화면 컴포넌트
 * 
 * @example
 * // 네비게이션에서 사용
 * navigation.navigate('Questions', { name: '김민수' });
 */
export default function QuestionScreen({ navigation, route }) {
  const name = route?.params?.name || '';

  // 커스텀 훅들 사용
  const {
    chatMessages,
    addMessage,
    resetChat,
    flatListRef
  } = useChat(name, FIRST_QUESTION);

  const {
    currentInputValue,
    setCurrentInputValue,
    isLoadingNextQuestion,
    setFirstQuestion,
    resetQuestionState,
    handleAnswerAndGenerateNext,
    isAllQuestionsCompleted
  } = useQuestions(name, TOTAL_QUESTIONS, BASE_QUESTIONS_TEMPLATES, REFINEMENT_PROMPT_VARIABLE);

  const {
    isLoadingCompletion,
    processCompletion
  } = useCompletion(name, TOTAL_QUESTIONS);

  // 결과 화면용 상태들
  const [stage, setStage] = useState('questions');
  const [starters, setStarters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedStarters, setSelectedStarters] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [resultText, setResultText] = useState('');

  // 네비게이션 헤더 높이 계산
  const headerHeight = Platform.OS === 'ios' ? 44 + Constants.statusBarHeight : Constants.statusBarHeight + 56;

  React.useEffect(() => {
    if (name) {
      const initialQuestionText = resetChat();
      setFirstQuestion(initialQuestionText);
      resetQuestionState();
      setStarters([]);
      setTopics([]);
      setSelectedStarters([]);
      setSelectedTopics([]);
      setResultText('');
      setStage('questions');
    }
  }, [name, resetChat, setFirstQuestion, resetQuestionState]);

  /**
   * FlatList에서 각 채팅 메시지를 렌더링하는 함수
   * 질문과 답변을 구분하여 다른 스타일로 표시합니다.
   * 
   * @function renderChatItem
   * @param {Object} params - FlatList renderItem 매개변수
   * @param {Object} params.item - 렌더링할 메시지 객체
   * @param {string} params.item.id - 메시지 고유 ID
   * @param {'question'|'answer'} params.item.type - 메시지 타입
   * @param {string} params.item.text - 메시지 내용
   * @returns {JSX.Element} 렌더링된 채팅 메시지 컴포넌트
   * 
   * 스타일 적용:
   * - 질문: 왼쪽 정렬, 연한 배경색
   * - 답변: 오른쪽 정렬, 테두리가 있는 흰색 배경
   */
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

  /**
   * 사용자가 답변을 전송할 때 호출되는 함수
   * 커스텀 훅의 handleAnswerAndGenerateNext 함수를 사용합니다.
   */
  const handleSendMessage = async () => {
    const currentQuestionMessage = chatMessages.filter(msg => msg.type === 'question').slice(-1)[0];
    const currentQuestionText = currentQuestionMessage?.text || "";

    await handleAnswerAndGenerateNext(currentInputValue, currentQuestionText, addMessage);
  };

  const allQuestionsAnswered = isAllQuestionsCompleted();
  const isLoading = isLoadingNextQuestion || isLoadingCompletion; // 통합 로딩 상태

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
                onPress={() => processCompletion(chatMessages, navigation)}
                disabled={isLoading}
                style={[styles.sendButton, styles.readyButton]}
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
              {isLoadingCompletion ? (
                <Text style={styles.loadingText}>Generating summary & topics...</Text>
              ) : (
                <Text style={styles.loadingText}>Generating next question...</Text>
              )}
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
          }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * 스타일 상수
 * QuestionScreen 컴포넌트에서 사용하는 모든 스타일을 정의합니다.
 * 
 * 주요 스타일:
 * - safeArea: 안전 영역 설정
 * - chatListContainer: 채팅 리스트 컨테이너
 * - messageBubble: 메시지 말풍선 기본 스타일
 * - questionBubble: 질문 말풍선 스타일
 * - answerBubble: 답변 말풍선 스타일
 * - inputContainer: 입력 영역 컨테이너
 * - loadingOverlay: 로딩 오버레이
 */
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
  emptyChatText: {
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
