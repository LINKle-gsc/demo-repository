import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { requestGeminiSuggestions, requestConversationSummary } from '../api/QuestionApi';

/**
 * 질문 완료 후 결과 생성을 처리하는 커스텀 훅
 * 
 * @param {string} name - 대화 상대방의 이름
 * @param {number} totalQuestions - 총 질문 개수
 * @returns {Object} 완료 처리 관련 상태와 함수들
 */
export function useCompletion(name, totalQuestions) {
    const [isLoadingCompletion, setIsLoadingCompletion] = useState(false);

    /**
     * 모든 질문 완료 후 결과를 생성하고 다음 화면으로 이동하는 함수
     * @param {Array} chatMessages - 채팅 메시지 배열
     * @param {Object} navigation - 네비게이션 객체
     * @returns {Promise<void>}
     */
    const processCompletion = useCallback(async (chatMessages, navigation) => {
        setIsLoadingCompletion(true);

        const collectedAnswers = chatMessages
            .filter(msg => msg.type === 'answer')
            .map(msg => msg.text);

        if (collectedAnswers.length !== totalQuestions) {
            Alert.alert("답변 미완료", `모든 질문(${totalQuestions}개)에 답변해주세요.`);
            setIsLoadingCompletion(false);
            return;
        }

        try {
            // 1. 대화 요약 요청
            const summaryResponse = await requestConversationSummary(name, chatMessages);
            const conversationSummary = summaryResponse.ok
                ? summaryResponse.summary
                : "Could not retrieve conversation summary.";

            // 2. 대화 주제 및 스타터 요청
            const suggestionsResult = await requestGeminiSuggestions({
                answers: collectedAnswers,
                name
            });

            setIsLoadingCompletion(false);

            if (suggestionsResult.ok) {
                navigation.navigate('TopicResult', {
                    starters: suggestionsResult.starters,
                    topics: suggestionsResult.topics,
                    rawText: suggestionsResult.rawText,
                    name,
                    conversationSummary: conversationSummary
                });
            } else {
                Alert.alert('Linkle 생성 실패', suggestionsResult.reason || '결과를 가져오는데 실패했습니다.');
            }
        } catch (error) {
            setIsLoadingCompletion(false);
            console.error("Error during completion process:", error);
            Alert.alert('오류 발생', '결과를 처리하는 중 문제가 발생했습니다.');
        }
    }, [name, totalQuestions]);

    return {
        isLoadingCompletion,
        processCompletion
    };
} 