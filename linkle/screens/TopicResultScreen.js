import React from 'react';
import { Text, View, SafeAreaView, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용을 위해 추가
import Constants from 'expo-constants'; // SafeArea 상단 패딩을 위해 추가

const { width, height } = Dimensions.get('window');

export default function TopicResultScreen({ route, navigation }) {
  const { topics = [], starters = [], name = '' } = route.params || {};

  const displayTopics = topics.length > 0 ? topics : [
    "첫 번째 샘플 주제입니다. {name}님과 이야기해보세요.",
    "두 번째 흥미로운 대화 주제입니다.",
    "세 번째 이야기 거리: 최근의 경험 공유",
    "네 번째 논의할 만한 토픽입니다.",
  ].map(t => t.replace('{name}', name));

  const handleGoToMessageSuggestion = () => {
    navigation.navigate('MessageResult', {
      starters,
      name,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButtonLeft}>
            <Icon name="chevron-back-outline" size={30} color="#B08D57" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Topic Suggestions</Text>
          <View style={styles.headerButtonRightPlaceholder} />{/* 오른쪽 정렬을 위한 빈 공간*/}
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Let's start with this topic!</Text>
          <Text style={styles.subTitle}>Don't worry, {name}, it's all set!</Text>
        </View>

        <ScrollView 
          style={styles.topicListContainer} 
          contentContainerStyle={styles.topicListContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {displayTopics.slice(0, 4).map((topic, index) => (
            <View key={index} style={styles.topicItemWrapper}>
              <Text style={styles.topicItemNumber}>{index + 1}.</Text>
              <Text style={styles.topicItemText}>{topic}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.nextButton} onPress={handleGoToMessageSuggestion} activeOpacity={0.7}>
          <Text style={styles.nextButtonText}>Are you ready?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// DeviceContactsScreen.js의 디자인을 적용한 새로운 스타일
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF4',
    paddingTop: Constants.statusBarHeight, // Android/iOS 상태바 높이 고려
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // 하단 여백
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    backgroundColor: '#FFFCF4', // 화면 배경색과 동일
    // borderBottomWidth: 1, // 필요시 구분선 추가
    // borderBottomColor: '#E0D8C0',
    marginBottom: 15, // 타이틀과의 간격
  },
  headerButtonLeft: {
    padding: 5, // 아이콘 터치 영역 확보
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#4A4031', // DeviceContactsScreen 헤더 타이틀 색상
  },
  headerButtonRightPlaceholder: { // 오른쪽 버튼 공간 확보용 (실제 버튼 없음)
    width: 30, // 아이콘 너비와 유사하게
    padding:5,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: height * 0.03, // 상하 여백 조정
  },
  mainTitle: {
    fontSize: width * 0.07, // 화면 너비에 비례
    fontWeight: 'bold',
    color: '#4A4031', 
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: width * 0.045, // 화면 너비에 비례
    color: '#7A705F', // DeviceContactsScreen 보조 텍스트 색상
    textAlign: 'center',
    marginBottom: height * 0.04, // 주제 목록과의 간격
  },
  topicListContainer: { // ScrollView 스타일
    flex: 1, // 남은 공간을 모두 차지하도록
    width: '100%',
    backgroundColor: '#F8F5ED', // DeviceContactsScreen 검색창 배경과 유사
    borderRadius: 15,
    padding: 20, // 내부 여백
    marginBottom: height * 0.05, // 하단 버튼과의 간격
  },
  topicListContentContainer: { // ScrollView 내부 컨텐츠 정렬
    // alignItems: 'flex-start', // 기본값이므로 불필요
  },
  topicItemWrapper: {
    flexDirection: 'row',
    marginBottom: 15, // 항목 간 간격
    alignItems: 'flex-start', // 번호와 텍스트 상단 정렬
  },
  topicItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B08D57', // 강조 색상
    marginRight: 10,
    minWidth: 25, // 번호 너비 확보
  },
  topicItemText: {
    fontSize: 16,
    color: '#4A4031',
    lineHeight: 24, // 가독성을 위한 줄 간격
    flexShrink: 1, // 텍스트가 길 경우 줄바꿈되도록
  },
  nextButton: {
    backgroundColor: '#B08D57', // DeviceContactsScreen 강조 색상
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30, // 둥근 모서리
    width: width * 0.85, // 너비 조정
    alignItems: 'center',
    // 그림자 효과 (DeviceContactsScreen과 유사하게 또는 필요에 따라)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // Android 그림자
  },
  nextButtonText: {
    color: '#FFFFFF', // 흰색 텍스트
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 