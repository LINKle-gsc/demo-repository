import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TextInput, Button, Alert, ActivityIndicator, Share, TouchableOpacity, ScrollView, StyleSheet as RNStyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestGeminiSuggestions } from '../api/QuestionApi';
import { styles as commonStyles } from '../styles/QuestionStyles';
import Constants from 'expo-constants'; // For status bar height

// 질문 상수
const QUESTIONS = [
  "How do you usually call {name}?",
  "When did you first get to know {name}?",
  "How did you and {name} meet?",
  "Do you have any fun memories or episodes with {name}?",
  "What kind of conversation would you like to have with {name}?",
  "How often do you and {name} stay in touch?"
];

// 질문 입력 컴포넌트 분리
function QuestionInput({ question, value, onChange, placeholder, disabled }) {
  return (
    <>
      <Text style={commonStyles.question}>{question}</Text>
      <TextInput
        style={commonStyles.input}
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
      <Text style={commonStyles.heading}>{title}</Text>
      {items.map((item, idx) => (
        <TouchableOpacity key={idx} onPress={() => onSelect(idx)}>
          <Text style={selected.includes(idx) ? commonStyles.selectedItem : commonStyles.item}>
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
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('questions'); // 'questions' or 'result'
  const [starters, setStarters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedStarters, setSelectedStarters] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [resultText, setResultText] = useState('');
  const flatListRef = useRef(null);

  // 네비게이션 헤더 높이 (대략적인 값, 실제 앱에 맞게 조절 필요)
  // StackNavigator의 기본 헤더를 사용하고 있다면 그 높이를 고려해야 합니다.
  // 현재 QuestionScreen은 App.js에서 options={{ title: '질문하기' }}로 기본 헤더를 사용 중입니다.
  // expo-constants statusBarHeight는 상태표시줄 높이이므로, 네비게이션 헤더 높이는 별도 계산 또는 고정값 사용.
  // React Navigation의 기본 헤더 높이는 플랫폼과 버전에 따라 다를 수 있으나, 대략 56(Android) ~ 44+StatusBar(iOS)dp.
  // 여기서는 iOS의 경우 Status Bar + Nav Bar를 합쳐서 대략적인 값을 줍니다.
  const headerHeight = Platform.OS === 'ios' ? 44 + Constants.statusBarHeight : Constants.statusBarHeight + 56; 

  useEffect(() => {
    if (name && QUESTIONS.length > 0) {
      const firstQuestionText = QUESTIONS[0].replaceAll('{name}', name);
      setChatMessages([{ id: 'q0', type: 'question', text: firstQuestionText }]);
      setActiveQuestionIndex(0); // 첫번째 질문으로 명시적 설정
    }
  }, [name]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (currentInputValue.trim() === '') return;

    const newAnswer = { 
      id: `a${activeQuestionIndex}`,
      type: 'answer',
      text: currentInputValue.trim()
    };
    
    // 먼저 사용자 답변을 채팅에 표시
    setChatMessages(prevMessages => [...prevMessages, newAnswer]);
    setCurrentInputValue(''); // 입력창 비우기

    // 0.5초 지연 후 다음 질문 또는 완료 처리
    setTimeout(() => {
      const nextQuestionIndex = activeQuestionIndex + 1;
      if (nextQuestionIndex < QUESTIONS.length) {
        const nextQuestionText = QUESTIONS[nextQuestionIndex].replaceAll('{name}', name);
        setChatMessages(prevMessages => [...prevMessages, { 
          id: `q${nextQuestionIndex}`,
          type: 'question',
          text: nextQuestionText 
        }]);
        setActiveQuestionIndex(nextQuestionIndex);
      } else {
        setActiveQuestionIndex(nextQuestionIndex); // 모든 질문 완료 상태로 설정
      }
    }, 500); // 0.5초 지연
  };

  const handleComplete = async () => {
    setIsLoading(true);
    const collectedAnswers = chatMessages
      .filter(msg => msg.type === 'answer')
      .map(msg => msg.text);
    
    // 모든 질문에 대한 답변이 수집되었는지 확인 (선택적)
    if (collectedAnswers.length !== QUESTIONS.length) {
        Alert.alert("답변 미완료", "모든 질문에 답변해주세요.");
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
      Alert.alert('오류', result.reason);
    }
  };
  
  const renderChatItem = ({ item }) => {
    const messageStyle = item.type === 'question' ? chatStyles.questionBubble : chatStyles.answerBubble;
    const textStyle = item.type === 'question' ? chatStyles.questionText : chatStyles.answerText;
    const alignment = item.type === 'question' ? 'flex-start' : 'flex-end';

    return (
      <View style={[chatStyles.messageRow, { justifyContent: alignment }]}>
        <View style={[chatStyles.messageBubble, messageStyle]}>
          <Text style={textStyle}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const allQuestionsAnswered = activeQuestionIndex >= QUESTIONS.length;

  // Conditionally render based on stage
  if (stage === 'questions') {
    return (
      <SafeAreaView style={[commonStyles.safeArea, { flex: 1, backgroundColor: '#FFFCF4' }]}>
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
            contentContainerStyle={chatStyles.chatListContainer}
            ListEmptyComponent={<Text style={chatStyles.emptyChatText}>대화를 시작해주세요.</Text>}
            style={{ flex: 1 }}
          />
          <View style={chatStyles.inputContainer}>
            {allQuestionsAnswered ? (
              <CustomButton
                title="Ready to talk"
                onPress={handleComplete}
                disabled={isLoading}
                style={[chatStyles.sendButton, chatStyles.readyButton]}
                textStyle={chatStyles.sendButtonText}
              />
            ) : (
              <>
                <TextInput
                  style={chatStyles.input}
                  value={currentInputValue}
                  onChangeText={setCurrentInputValue}
                  placeholder={"Say something about this…"}
                  editable={!isLoading}
                  onSubmitEditing={handleSendMessage}
                />
                <CustomButton
                  title={"Send"}
                  onPress={handleSendMessage}
                  disabled={isLoading || currentInputValue.trim() === ''}
                  style={chatStyles.sendButton}
                  textStyle={chatStyles.sendButtonText}
                />
              </>
            )}
          </View>
          {isLoading && (
            <View style={commonStyles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  // stage === 'result'
  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <ScrollView contentContainerStyle={commonStyles.container}>
        {resultText ? (
          <Text style={commonStyles.resultText}>{resultText}</Text>
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

// 채팅 UI를 위한 새로운 스타일
const chatStyles = RNStyleSheet.create({
  chatListContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: '80%',
  },
  questionBubble: {
    backgroundColor: '#E0E0E0',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
  },
  answerBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
    borderTopRightRadius: 5,
  },
  questionText: {
    color: '#333333',
    fontSize: 16,
  },
  answerText: {
    color: '#007AFF',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#4A4031',
  },
  input: {
    flex: 1,
    height: 48,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#FFFCF4',
    fontSize: 16,
    color: '#333333',
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    minWidth: 'auto',
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  readyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  emptyChatText:{
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF'
  }
});

// 기존 커스텀 버튼 스타일 (QuestionScreen 외부에 있을 경우 필요 없음)
const customButtonStyles = RNStyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginHorizontal: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A9A9A9',
  },
  disabledButtonText: {
    color: '#D3D3D3',
  }
}); 