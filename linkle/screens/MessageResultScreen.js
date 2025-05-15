import React, { useState } from 'react';
import { Text, View, SafeAreaView, Share, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions, Platform, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Icon
// import { resultStyles as originalResultStyles } from '../styles/ResultStyles'; // 기존 스타일 삭제 또는 주석 처리

const { width, height } = Dimensions.get('window');

// 메시지 추천 화면 스타일
const messageSuggestionStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF4', // 배경색 변경
  },
  container: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'space-between', // 상단부터 순차적으로 배치하도록 변경
    paddingTop: height * 0.05,
    paddingBottom: height * 0.05,
    paddingHorizontal: 20,
  },
  navigationHeader: { // 이전 버튼을 위한 컨테이너
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    flexDirection: 'row', // 아이콘과 텍스트를 나란히 배치
    alignItems: 'center',
    paddingVertical: 8,
    // paddingHorizontal: 12, // 아이콘과 텍스트 사이 간격은 marginLeft로
  },
  backButtonIconStyle: { // Renamed from backButtonIcon for clarity, as it's a style for Icon
    // fontSize is now size prop for Icon
    // color is now color prop for Icon
    marginRight: 5, 
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A4031', // Adjusted for beige theme
    fontWeight: '500',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20, 
  },
  mainTitle: {
    fontSize: 28, 
    fontWeight: 'bold',
    color: '#4A4031', // Adjusted for beige theme
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    color: '#7A705F', // Adjusted for beige theme
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20, // 메시지 목록과의 간격
  },
  contentContainer: { 
    flex: 1, 
    width: '100%',
    alignItems: 'center',
    // justifyContent: 'center', // 더 이상 중앙 정렬 필요 없음
  },
  // textholderContainer 및 textholderBackground 삭제
  startersListContainer: {
    flex: 1, 
    width: '100%',
    backgroundColor: 'rgba(248, 245, 237, 0.8)', // Lighter beige with opacity
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20, // 하단 버튼과의 간격
  },
  starterItemTouchable: {
    paddingVertical: 12, // Increased padding
    borderBottomWidth: 1, 
    borderBottomColor: '#E0D8C0', // Softer border for beige
  },
  starterItemText: {
    fontSize: 16, 
    color: '#4A4031', // Adjusted for beige theme
    lineHeight: 24,
  },
  selectedStarterItemText: {
    fontSize: 16, 
    color: '#FFFFFF', 
    fontWeight: 'bold',
    lineHeight: 24,
    backgroundColor: '#B08D57', // Accent color for selection background
    borderRadius: 5,
    paddingVertical: 6, // Added padding
    paddingHorizontal: 10, // Added padding
    overflow: 'hidden', // Ensure background respects borderRadius
  },
  // allPngImage 삭제
  connectButton: {
    backgroundColor: '#B08D57', // Accent color for button
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
    // marginTop: 10, // contentContainer의 marginBottom으로 대체 또는 유지
  },
  connectButtonText: {
    color: '#FFFFFF', // White text on accent button
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function MessageResultScreen({ route, navigation }) { // navigation prop 추가
  const { starters = [], name = '' } = route.params || {};
  const [selectedStartersIndices, setSelectedStartersIndices] = useState([]);

  const displayStarters = starters.length > 0 ? starters : [
    "This is the first sample message.",
    "Here is another great suggestion to start a conversation!",
    "What about asking this interesting question?",
    "A fourth option to break the ice.",
    "And one more for good measure."
  ];

  const toggleStarterSelection = (index) => {
    setSelectedStartersIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleShare = () => {
    let messageToShare = "";
    if (selectedStartersIndices.length > 0) {
      messageToShare = selectedStartersIndices.map(i => displayStarters[i]).join('\n\n');
    } else if (displayStarters.length > 0) {
      messageToShare = displayStarters[0]; // Default to sharing the first one if none selected
    }
    if (messageToShare) {
      Share.share({ message: messageToShare });
    } else {
      Share.share({ message: "Linkle에서 추천하는 대화 시작 메시지!"}); // Fallback if displayStarters is also empty
    }
  };

  return (
    <SafeAreaView style={messageSuggestionStyles.safeArea}>
      <View style={messageSuggestionStyles.container}>
        <View style={messageSuggestionStyles.navigationHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={messageSuggestionStyles.backButton}>
            <Icon 
              name="chevron-back-outline" 
              size={26} // Adjusted size
              color="#B08D57" // Accent color for beige theme
              style={messageSuggestionStyles.backButtonIconStyle} 
            />
            <Text style={messageSuggestionStyles.backButtonText}>주제 다시 선택</Text> 
          </TouchableOpacity>
        </View>

        <View style={messageSuggestionStyles.titleContainer}>
          <Text style={messageSuggestionStyles.mainTitle}>Choose a message you like</Text>
          <Text style={messageSuggestionStyles.subTitle}>... and hit the button!</Text>
        </View>

        <View style={messageSuggestionStyles.contentContainer}>
          {/* ImageBackground 및 textholderContainer 삭제 */}
          <ScrollView 
            style={messageSuggestionStyles.startersListContainer}
            showsVerticalScrollIndicator={false}
            // contentContainerStyle={{ paddingTop: 20, paddingBottom: 20}} // ScrollView 스타일에 이미 패딩 적용
          >
            {displayStarters.map((starter, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => toggleStarterSelection(index)}
                style={messageSuggestionStyles.starterItemTouchable}
              >
                <Text 
                  style={selectedStartersIndices.includes(index) 
                    ? messageSuggestionStyles.selectedStarterItemText 
                    : messageSuggestionStyles.starterItemText}
                >
                  {index + 1}. {starter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* all.png Image 삭제 */}
        </View>

        <TouchableOpacity style={messageSuggestionStyles.connectButton} onPress={handleShare}>
          <Text style={messageSuggestionStyles.connectButtonText}>Shall we connect?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 