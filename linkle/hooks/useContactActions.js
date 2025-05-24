import { Alert } from 'react-native';

/**
 * useContactActions - 연락처 액션 관련 로직을 관리하는 커스텀 훅
 * 
 * @description
 * 이 훅은 다음과 같은 기능을 제공합니다:
 * - 연락처 삭제 확인 다이얼로그 처리
 * - 연락처 관련 액션들의 중앙화된 관리
 * 
 * @param {Function} onRemoveTarget - 연락처 삭제 콜백 함수
 * @returns {Object} 연락처 액션 관련 함수들
 */
export const useContactActions = (onRemoveTarget) => {
    /**
     * 연락처 삭제 확인 다이얼로그 표시
     * @param {Object} item - 삭제할 연락처 객체
     * @param {string} item.name - 연락처 이름
     * @param {string} item.id - 연락처 ID
     * @description 삭제 확인 알림을 표시하고 사용자 확인 시 onRemoveTarget 콜백 호출
     */
    const confirmDelete = (item) => {
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete '${item.name}'?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => onRemoveTarget(item.id) }
            ],
            { cancelable: false }
        );
    };

    /**
     * 다중 연락처 삭제 확인 (확장 가능한 기능)
     * @param {Array} items - 삭제할 연락처 배열
     */
    const confirmMultipleDelete = (items) => {
        const count = items.length;
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete ${count} contact${count > 1 ? 's' : ''}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "OK",
                    onPress: () => {
                        items.forEach(item => onRemoveTarget(item.id));
                    }
                }
            ],
            { cancelable: false }
        );
    };

    return {
        confirmDelete,
        confirmMultipleDelete
    };
}; 