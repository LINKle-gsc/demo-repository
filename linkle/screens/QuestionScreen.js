import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, SafeAreaView } from 'react-native';

const QUESTIONS = [
  "당신의 이름은 무엇인가요?",
  "당신의 나이는 몇 살인가요?",
  "당신의 직업은 무엇인가요?"
];

export default function QuestionScreen({ navigation }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(''));

  const handleAnswerChange = (text) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = text;
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigation.navigate('Home', { answers });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.question}>{QUESTIONS[currentQuestionIndex]}</Text>
        <TextInput
          style={styles.input}
          value={answers[currentQuestionIndex]}
          onChangeText={handleAnswerChange}
          placeholder="답변을 입력하세요"
          placeholderTextColor="#aaa"
        />
        <View style={styles.buttonContainer}>
          <Button
            title="이전"
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          />
          <Button
            title={currentQuestionIndex === QUESTIONS.length - 1 ? "완료" : "다음"}
            onPress={handleNext}
          />
        </View>
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
}); 