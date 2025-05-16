import React, { useState } from 'react';
import { Text, View, SafeAreaView, Share, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// 반응형 크기 계산 헬퍼 함수
const wp = (percentage) => {
  const value = (percentage * width) / 100;
  return Math.round(value);
};
const hp = (percentage) => {
  const value = (percentage * height) / 100;
  return Math.round(value);
};

export default function MessageResultScreen({ route, navigation }) {
  const { starters = [], name = '' } = route.params || {};
  const [selectedStartersIndices, setSelectedStartersIndices] = useState([]);

  const displayStarters = starters.length > 0 ? starters : [
    "This is the first sample message.",
    "Here is another great suggestion to start a conversation!",
    "What about asking this interesting question?",
    "A fourth option to break the ice.",
    // "And one more for good measure."
  ];

  const toggleStarterSelection = (index) => {
    setSelectedStartersIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [index] // 단일 선택으로 변경 (하나만 선택 가능하게)
    );
  };

  const handleShare = () => {
    let messageToShare = "";
    if (selectedStartersIndices.length > 0) {
      messageToShare = displayStarters[selectedStartersIndices[0]]; // 단일 선택된 메시지
    } else if (displayStarters.length > 0) {
      messageToShare = displayStarters[0];
    }
    if (messageToShare) {
      Share.share({ message: messageToShare });
    } else {
      Share.share({ message: "Check out this message suggestion from Linkle!" });
    }
  };

  const navigateToHome = () => {
    navigation.navigate('SavedTargets');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButtonLeft}>
            <Icon name="chevron-back-outline" size={wp(7.5)} color="#B08D57" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Message Suggestions</Text>
          <TouchableOpacity onPress={navigateToHome} style={styles.headerButtonRight}>
            <Icon name="home-outline" size={wp(6.5)} color="#B08D57" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Choose a message you like</Text>
          <Text style={styles.subTitle}>... and tap the button to share!</Text>
        </View>

        {/* contentContainer 제거, ScrollView가 flex:1 차지하도록 */}
        <ScrollView 
          style={styles.startersListContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.startersListContentContainer}
        >
          {displayStarters.slice(0, 4).map((starter, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => toggleStarterSelection(index)}
              style={styles.starterItemTouchable}
              activeOpacity={0.7}
            >
              <View style={selectedStartersIndices.includes(index) ? styles.selectedStarterItemView : null}>
                <Text 
                  style={selectedStartersIndices.includes(index) 
                    ? styles.selectedStarterItemText 
                    : styles.starterItemText}
                >
                  {/* 번호 제거, 메시지만 표시 */}
                  {starter}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.connectButton} onPress={handleShare}  disabled={selectedStartersIndices.length === 0 && displayStarters.length > 0} activeOpacity={0.7}>
            <Text style={styles.connectButtonText}>Share this message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// TopicResultScreen.js의 디자인을 적용한 새로운 스타일
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF4',
    paddingTop: Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: Platform.OS === 'ios' ? hp(1.5) : hp(1.5),
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? hp(1.2) : hp(1.5),
    backgroundColor: '#FFFCF4',
    marginBottom: hp(1.5),
  },
  headerButtonLeft: {
    padding: wp(1.2),
  },
  headerTitle: {
    fontSize: wp(4.5),
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#4A4031',
  },
  headerButtonRight: {
    padding: wp(1.2),
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: hp(2),
    width: '100%',
  },
  mainTitle: {
    fontSize: wp(6.5),
    fontWeight: 'bold',
    color: '#4A4031',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subTitle: {
    fontSize: wp(4),
    color: '#7A705F',
    textAlign: 'center',
    marginBottom: hp(2.5),
  },
  startersListContainer: { // ScrollView 스타일
    flex: 1, 
    width: '100%',
    backgroundColor: '#F8F5ED',
    borderRadius: 15,
    marginBottom: hp(1.5), 
  },
  startersListContentContainer: { // ScrollView 내부 컨텐츠 정렬
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3), // 내부 좌우 패딩 살짝 줄임
  },
  starterItemTouchable: {
    paddingVertical: hp(1.8), // 터치 영역 확보
    borderBottomWidth: 1, 
    borderBottomColor: '#E0D8C0',
  },
  starterItemTouchableLast: { // 마지막 항목의 하단 보더 제거 (필요시)
    borderBottomWidth: 0,
  },
  starterItemText: {
    fontSize: wp(4),
    color: '#4A4031',
    lineHeight: wp(6),
  },
  selectedStarterItemView: { // 선택된 항목을 감싸는 View에 배경색 및 패딩 적용
    backgroundColor: '#B08D57',
    borderRadius: 8,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3.5),
  },
  selectedStarterItemText: { 
    fontSize: wp(4),
    color: '#FFFFFF', 
    fontWeight: '500',
    lineHeight: wp(6),
  },
  bottomButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? hp(5) : hp(2.5),
    paddingTop: hp(1.5),
  },
  connectButton: {
    backgroundColor: '#B08D57',
    paddingVertical: hp(2.2),
    paddingHorizontal: wp(5),
    borderRadius: 30,
    width: wp(85),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
}); 