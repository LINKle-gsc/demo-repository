import React from 'react';
import { Text, View, SafeAreaView, TouchableOpacity, Image, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// 주제 추천 화면 스타일
const topicSuggestionStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF4',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? height * 0.05 : height * 0.02,
    paddingBottom: height * 0.08,
    paddingHorizontal: 20,
  },
  navigationHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 15,
    paddingLeft: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonIcon: {
    fontSize: 22,
    color: '#000000',
    marginRight: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 18,
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 30,
  },
  circlesContainer: {
    flex: 1,
    width: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  topicTextContainer: {
    flex: 1, 
    width: '100%',
    backgroundColor: 'rgba(248, 245, 237, 0.8) ', // 메시지 목록 배경색 변경 (반투명 흰색)
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20, // 하단 버튼과의 간격
  },
  topicItem: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.0)',
    padding: 5,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: width * 0.8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  nextButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function TopicResultScreen({ route, navigation }) {
  const { topics = [], starters = [], name = '' } = route.params || {};

  // 데모를 위해 topics가 없으면 기본값 설정
  const displayTopics = topics.length > 0 ? topics : [
    "we have arldjfkl;sa you remember?",
    "I was so glad about hey wohahahahahhah YEs",
    "This is a third sample topic for display.",
    "And a fourth one if needed.",
  ];

  const handleGoToMessageSuggestion = () => {
    navigation.navigate('MessageResult', { // 'MessageResultScreen'으로 변경될 수 있음
      starters,
      name,
      // 필요시 topics도 전달 가능
    });
  };

  return (
    <SafeAreaView style={topicSuggestionStyles.safeArea}>
      <View style={topicSuggestionStyles.container}>
        <View style={topicSuggestionStyles.navigationHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={topicSuggestionStyles.backButton}>
            <Text style={topicSuggestionStyles.backButtonIcon}>‹</Text>
            <Text style={topicSuggestionStyles.backButtonText}>이전</Text>
          </TouchableOpacity>
        </View>

        <View style={topicSuggestionStyles.titleContainer}>
          <Text style={topicSuggestionStyles.mainTitle}>Let's start with this topic!</Text>
          <Text style={topicSuggestionStyles.subTitle}>Don't worry, it's all set!</Text>
        </View>

        <View style={topicSuggestionStyles.circlesContainer}>
          {/* 원 이미지들 삭제 */}
          {/* <Image source={require('../assets/circles/circle_orange.png')} style={[topicSuggestionStyles.circleImage, topicSuggestionStyles.circle_orange]} /> */}
          {/* <Image source={require('../assets/circles/circle_blue.png')} style={[topicSuggestionStyles.circleImage, topicSuggestionStyles.circle_blue]} /> */}
          {/* <Image source={require('../assets/circles/circle_green.png')} style={[topicSuggestionStyles.circleImage, topicSuggestionStyles.circle_green]} /> */}
          
          <ScrollView 
            style={topicSuggestionStyles.topicTextContainer} 
            contentContainerStyle={{ alignItems: 'flex-start' }}
            showsVerticalScrollIndicator={false}
          >
            {displayTopics.slice(0, 4).map((topic, index) => (
              <Text key={index} style={topicSuggestionStyles.topicItem}>
                {index + 1}. {topic}
              </Text>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={topicSuggestionStyles.nextButton} onPress={handleGoToMessageSuggestion}>
          <Text style={topicSuggestionStyles.nextButtonText}>Are you ready?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 