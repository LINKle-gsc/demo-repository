import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 온보딩 이미지 데이터 (파일 이름 및 경로는 실제 파일에 맞게 조정 필요)
const onboardingSlides = [
  { key: '1', image: require('../assets/onboarding/onboarding1.png') },
  { key: '2', image: require('../assets/onboarding/onboarding2.png') },
  { key: '3', image: require('../assets/onboarding/onboarding3.png') },
  { key: '4', image: require('../assets/onboarding/onboarding4.png') }, // 마지막 이미지
];

// 온보딩 이미지 배경색과 유사한 색상 또는 기본 배경색
const SCREEN_BACKGROUND_COLOR = '#FFFCF4'; // 배경색 변경

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleLetsLinklePress = () => {
    if (onComplete) {
      onComplete(); // onComplete 함수 호출
    }
  };

  // 현재 보이는 슬라이드의 인덱스를 업데이트하는 함수
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // 각 슬라이드 아이템 렌더링
  const renderItem = ({ item, index }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      {/* 마지막 슬라이드일 경우 버튼 표시 */}
      {index === onboardingSlides.length - 1 && (
        <TouchableOpacity style={styles.letsLinkleButton} onPress={handleLetsLinklePress}>
          <Text style={styles.letsLinkleButtonText}>Let's Linkle!</Text>
          <Image source={require('../assets/heartClip.png')} style={styles.letsLinkleButtonIcon} />
        </TouchableOpacity>
      )}
    </View>
  );

  // 페이지네이션 (슬라이드 바) 렌더링
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {onboardingSlides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            currentIndex === index ? styles.paginationDotActive : {},
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false} // 끝에서 바운스 효과 제거
        />
        {renderPagination()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    width: width,
    flex: 1, // 이미지가 슬라이드 영역을 꽉 채우도록
    alignItems: 'center',
    justifyContent: 'center', // 이미지를 중앙에 배치
  },
  image: {
    width: width, // 화면 너비 전체 사용
    height: '100%',      // 슬라이드 높이 전체 사용
  },
  paginationContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90, // 버튼보다 위로, 이미지 위에 위치하도록 조정
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(74, 64, 49, 0.4)', // 비활성 점 색상 (어두운 베이지 반투명)
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: '#4A4031', // 활성 점 색상 (진한 베이지)
  },
  letsLinkleButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30, // 페이지네이션과 겹치지 않도록 위치 조정, 더 낮게
    backgroundColor: '#B08D57', // 버튼 배경색 (베이지 테마 강조색)
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  letsLinkleButtonText: {
    color: '#FFFFFF', // 버튼 텍스트 색상 (흰색)
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  letsLinkleButtonIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#FFFFFF', // 아이콘 색상 (흰색)
  },
});

export default OnboardingScreen; 