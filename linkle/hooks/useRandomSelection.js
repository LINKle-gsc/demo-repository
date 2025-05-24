import { useState } from 'react';
import { Alert } from 'react-native';

/**
 * useRandomSelection - 랜덤 연락처 선택 관련 상태와 로직을 관리하는 커스텀 훅
 * 
 * @description
 * 이 훅은 다음과 같은 기능을 제공합니다:
 * - 랜덤 선택 진행 상태 관리
 * - 하이라이트된 연락처 ID 관리
 * - 랜덤 선택 로직 및 확인 다이얼로그 처리
 * 
 * @param {Array} targetContacts - 타겟 연락처 배열
 * @param {Object} navigation - React Navigation 객체
 * @returns {Object} 랜덤 선택 관련 상태와 함수들
 */
export const useRandomSelection = (targetContacts, navigation) => {
    const [isLinking, setIsLinking] = useState(false);
    const [highlightedContactId, setHighlightedContactId] = useState(null);

    /**
     * 랜덤 연락처 선택 및 Linkle 시작
     * @description 3초간 로딩 UI를 표시한 후 저장된 연락처 중 랜덤하게 선택하여 확인 후 Questions 화면으로 이동
     */
    const handleRandomSelect = () => {
        if (targetContacts && targetContacts.length > 0) {
            // 즉시 로딩 시작
            setIsLinking(true);

            // 3초 후에 랜덤 선택 실행
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * targetContacts.length);
                const selectedContact = targetContacts[randomIndex];

                // 로딩 종료
                setIsLinking(false);

                if (selectedContact) {
                    Alert.alert(
                        "Confirm Selection",
                        `'${selectedContact.name}'님과 Linkle 하시겠습니까?`,
                        [
                            {
                                text: "취소",
                                style: "cancel",
                                onPress: () => {
                                    setHighlightedContactId(null);
                                }
                            },
                            {
                                text: "Linkle 시작",
                                onPress: () => {
                                    if (selectedContact) {
                                        setHighlightedContactId(selectedContact.id);
                                    }
                                    if (navigation && selectedContact) {
                                        navigation.navigate('Questions', { name: selectedContact.name });
                                    }
                                }
                            }
                        ],
                        { cancelable: true, onDismiss: () => setHighlightedContactId(null) }
                    );
                }
            }, 3000); // 3초 대기
        } else {
            Alert.alert("No Targets", "No targets are saved, so a random selection cannot be made.");
        }
    };

    /**
     * 하이라이트된 연락처 ID 초기화
     */
    const clearHighlight = () => {
        setHighlightedContactId(null);
    };

    return {
        isLinking,
        highlightedContactId,
        handleRandomSelect,
        clearHighlight,
        setIsLinking,
        setHighlightedContactId
    };
}; 