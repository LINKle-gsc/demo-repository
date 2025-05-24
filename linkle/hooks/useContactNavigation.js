import { Alert } from 'react-native';

/**
 * useContactNavigation - 연락처 관련 네비게이션 로직을 관리하는 커스텀 훅
 * 
 * @description
 * 이 훅은 다음과 같은 기능을 제공합니다:
 * - 채팅 시작을 위한 네비게이션 처리
 * - 네비게이션 에러 핸들링
 * 
 * @param {Object} navigation - React Navigation 객체
 * @returns {Object} 네비게이션 관련 함수들
 */
export const useContactNavigation = (navigation) => {
    /**
     * 채팅 시작 버튼 클릭 핸들러
     * @param {string} contactName - 선택된 연락처의 이름
     * @description Questions 화면으로 네비게이션하여 해당 연락처와의 채팅을 시작
     */
    const handleChatPress = (contactName) => {
        if (navigation) {
            navigation.navigate('Questions', { name: contactName });
        } else {
            console.error("Navigation prop is not available in SavedTargetsScreen");
            Alert.alert("Error", "Cannot navigate to Question screen.");
        }
    };

    /**
     * 특정 화면으로 네비게이션
     * @param {string} screenName - 이동할 화면 이름
     * @param {Object} params - 전달할 파라미터 (선택사항)
     */
    const navigateToScreen = (screenName, params = {}) => {
        if (navigation) {
            navigation.navigate(screenName, params);
        } else {
            console.error(`Navigation prop is not available. Cannot navigate to ${screenName}`);
            Alert.alert("Error", `Cannot navigate to ${screenName}.`);
        }
    };

    return {
        handleChatPress,
        navigateToScreen
    };
}; 