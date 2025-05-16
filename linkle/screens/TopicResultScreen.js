import React from 'react';
import { Text, View, SafeAreaView, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용을 위해 추가
import Constants from 'expo-constants'; // SafeArea 상단 패딩을 위해 추가

const { width, height } = Dimensions.get('window');

// 반응형 크기 계산 헬퍼 함수 (이전 코드에서 가져옴)
const wp = (percentage) => {
  const value = (percentage * width) / 100;
  return Math.round(value);
};

const hp = (percentage) => {
  const value = (percentage * height) / 100;
  return Math.round(value);
};

export default function TopicResultScreen({ route, navigation }) {
  // userAnswers 대신 conversationSummary를 받음
  const { topics = [], starters = [], name = '', conversationSummary = 'Your previous conversation about ' + name + ' led to these suggestions:' } = route.params || {};

  // 샘플 데이터도 영어로 변경하고, {name} 플레이스홀더 사용
  const displayTopics = topics.length > 0 ? topics : [
    `Here's a first sample topic to discuss with ${name}.`,
    "This is another interesting conversation topic.",
    "A third idea: Share a recent experience.",
    "And a fourth topic for your consideration.",
  ];

  const handleGoToMessageSuggestion = () => {
    navigation.navigate('MessageResult', {
      starters, // starters도 영어로 생성될 것으로 예상
      name,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButtonLeft}>
            <Icon name="chevron-back-outline" size={wp(7.5)} color="#B08D57" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Topic Suggestions</Text>
          <View style={styles.headerButtonRightPlaceholder} />{/* 오른쪽 정렬을 위한 빈 공간*/}
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Let's start with these topics!</Text>
        </View>

        <ScrollView 
          style={styles.topicListContainer} 
          contentContainerStyle={styles.topicListContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.infoText}>
            {/* conversationSummary를 사용하는 부분은 이전과 동일 */}
            {`Based on your conversation (e.g., "${route.params?.conversationSummary || 'your previous discussion'}"), here are some topic suggestions for ${route.params?.name || 'your friend'}:`}
          </Text>
          {(route.params?.topics || []).length > 0 ? 
            (route.params?.topics || []).slice(0, 4).map((topic, index) => (
              <View key={index} style={styles.topicItemWrapper}>
                <Text style={styles.topicItemNumber}>{index + 1}.</Text>
                <Text style={styles.topicItemText}>{topic}</Text>
              </View>
            )) :
            [
              `Here's a first sample topic to discuss with ${route.params?.name || 'your friend'}.`,
              "This is another interesting conversation topic.",
              "A third idea: Share a recent experience.",
              "And a fourth topic for your consideration.",
            ].slice(0, 4).map((topic, index) => (
                <View key={index} style={styles.topicItemWrapper}>
                  <Text style={styles.topicItemNumber}>{index + 1}.</Text>
                  <Text style={styles.topicItemText}>{topic}</Text>
                </View>
            ))
          }
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={() => navigation.navigate('MessageResult', { starters: route.params?.starters || [], name: route.params?.name || '' })} activeOpacity={0.7}>
            <Text style={styles.nextButtonText}>Ready for message ideas?</Text> 
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: wp(5),
    paddingBottom: Platform.OS === 'ios' ? hp(1.5) : hp(1.5), // iOS와 Android 모두 최소한의 패딩
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? hp(1.2) : hp(1.5),
    backgroundColor: '#FFFCF4', // 화면 배경색과 동일
    // borderBottomWidth: 1, // 필요시 구분선 추가
    // borderBottomColor: '#E0D8C0',
    marginBottom: hp(1.5), // 타이틀과의 간격을 살짝 줄임
  },
  headerButtonLeft: {
    padding: wp(1.2),
  },
  headerTitle: {
    fontSize: wp(4.5),
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#4A4031', // DeviceContactsScreen 헤더 타이틀 색상
  },
  headerButtonRightPlaceholder: { // 오른쪽 버튼 공간 확보용 (실제 버튼 없음)
    width: wp(7.5),
    padding: wp(1.2),
  },
  titleContainer: {
    alignItems: 'center',
    // marginVertical: hp(2), // infoText가 ScrollView로 이동함에 따라 조정될 수 있음
    width: '100%', // 너비 채우도록
  },
  infoText: { // 새로 추가된 안내 문구 스타일
    fontSize: wp(4.6),
    color: '#7A705F',
    textAlign: 'center',
    marginBottom: hp(2.5), // 메인 타이틀과의 간격
    paddingHorizontal: wp(1), // 내부 컨테이너 패딩 고려하여 조정
    lineHeight: wp(6.2),
  },
  mainTitle: {
    fontSize: wp(6.5), 
    fontWeight: 'bold',
    color: '#4A4031',
    textAlign: 'center',
    marginTop: hp(2), // header와의 간격
    marginBottom: hp(2.5), // topicListContainer와의 간격 (infoText가 위로 갔으므로)
  },
  topicListContainer: { 
    flex: 1, // 중요: 남은 공간을 모두 채움
    width: '100%',
    backgroundColor: '#F8F5ED',
    borderRadius: 15,
    paddingTop: hp(2.5), // infoText를 위한 상단 패딩
    paddingBottom: hp(1.5), // 목록 하단 패딩
    paddingHorizontal: wp(5),
    marginBottom: hp(1.5), 
  },
  topicListContentContainer: { // ScrollView 내부 컨텐츠 정렬
    // alignItems: 'flex-start', // 기본값이므로 불필요
  },
  topicItemWrapper: {
    flexDirection: 'row',
    marginBottom: hp(2), // 항목 간 간격 늘림
    alignItems: 'flex-start', // 번호와 텍스트 상단 정렬
  },
  topicItemNumber: {
    fontSize: wp(4.7),
    fontWeight: '600',
    color: '#B08D57', // 강조 색상
    marginRight: wp(3), // 간격 조정
    minWidth: wp(6.5), // 번호 너비 확보
    paddingTop: Platform.OS === 'ios' ? 2 : 0, // iOS에서 줄 정렬 미세 조정
  },
  topicItemText: {
    fontSize: wp(4.7),
    color: '#4A4031',
    lineHeight: wp(7.0),
    flexShrink: 1, // 텍스트가 길 경우 줄바꿈되도록
  },
  bottomButtonContainer: {
    width: '100%', // 너비 전체 차지
    alignItems: 'center', // 버튼 중앙 정렬
    // 안드로이드 네비게이션 바를 피하기 위해 여기에 하단 마진을 충분히 줌
    marginBottom: Platform.OS === 'android' ? hp(5) : hp(2.5), // Android: 5%, iOS: 2.5% (조정된 값)
    paddingTop: hp(1.5), // 버튼과 ScrollView(topicListContainer) 사이의 간격
  },
  nextButton: {
    backgroundColor: '#B08D57', // DeviceContactsScreen 강조 색상
    paddingVertical: hp(2.2),
    paddingHorizontal: wp(5),
    borderRadius: 30, // 둥근 모서리
    width: wp(85), // 너비 조정
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
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
}); 