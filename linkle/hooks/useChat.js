import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 채팅 메시지 관리 및 스크롤 제어를 위한 커스텀 훅
 * 
 * @param {string} name - 대화 상대방의 이름
 * @param {string} firstQuestion - 첫 번째 질문 템플릿
 * @returns {Object} 채팅 관련 상태와 함수들
 * @returns {Array} chatMessages - 채팅 메시지 배열
 * @returns {Function} setChatMessages - 채팅 메시지 설정 함수
 * @returns {Function} addMessage - 새 메시지 추가 함수
 * @returns {Function} resetChat - 채팅 초기화 함수
 * @returns {Object} flatListRef - FlatList 참조 객체
 */
export function useChat(name, firstQuestion) {
    const [chatMessages, setChatMessages] = useState([]);
    const flatListRef = useRef(null);

    /**
     * 새로운 메시지를 채팅에 추가하는 함수
     */
    const addMessage = useCallback((message) => {
        setChatMessages(prevMessages => [...prevMessages, message]);
    }, []);

    /**
     * 채팅을 초기화하고 첫 번째 질문을 설정하는 함수
     */
    const resetChat = useCallback(() => {
        if (name && firstQuestion) {
            const initialQuestionText = firstQuestion.replaceAll('{name}', name);
            setChatMessages([{ id: 'q0', type: 'question', text: initialQuestionText }]);
            return initialQuestionText;
        }
        setChatMessages([]);
        return '';
    }, [name, firstQuestion]);

    /**
     * 채팅 메시지가 업데이트될 때마다 스크롤을 맨 아래로 이동
     */
    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [chatMessages]);

    /**
     * 이름이 변경될 때 채팅 초기화
     */
    useEffect(() => {
        if (name) {
            resetChat();
        }
    }, [name, firstQuestion]);

    return {
        chatMessages,
        setChatMessages,
        addMessage,
        resetChat,
        flatListRef
    };
} 