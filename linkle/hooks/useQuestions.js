import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { requestRefinedQuestion } from '../api/QuestionApi';

/**
 * 질문 생성 및 답변 처리를 위한 커스텀 훅
 * 
 * @param {string} name - 대화 상대방의 이름
 * @param {number} totalQuestions - 총 질문 개수
 * @param {string[]} baseQuestionTemplates - 기본 질문 템플릿 배열
 * @param {string} refinementPrompt - 질문 개선 프롬프트
 * @returns {Object} 질문 관련 상태와 함수들
 */
export function useQuestions(name, totalQuestions, baseQuestionTemplates, refinementPrompt) {
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [currentInputValue, setCurrentInputValue] = useState('');
    const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);
    const [firstQuestionActualText, setFirstQuestionActualText] = useState('');
    const [firstAnswerActualText, setFirstAnswerActualText] = useState('');

    /**
     * 첫 번째 질문 텍스트를 설정하는 함수
     * @param {string} questionText - 질문 텍스트
     */
    const setFirstQuestion = useCallback((questionText) => {
        setFirstQuestionActualText(questionText);
    }, []);

    /**
     * 상태를 초기화하는 함수
     */
    const resetQuestionState = useCallback(() => {
        setActiveQuestionIndex(0);
        setCurrentInputValue('');
        setIsLoadingNextQuestion(false);
        setFirstQuestionActualText('');
        setFirstAnswerActualText('');
    }, []);

    /**
     * 답변을 처리하고 다음 질문을 생성하는 함수
     * @param {string} userAnswer - 사용자 답변
     * @param {string} currentQuestionText - 현재 질문 텍스트
     * @param {Function} addMessage - 메시지 추가 함수
     * @returns {Promise<boolean>} 성공 여부
     */
    const handleAnswerAndGenerateNext = useCallback(async (userAnswer, currentQuestionText, addMessage) => {
        if (!userAnswer.trim()) return false;

        // 첫 번째 질문에 대한 답변인 경우 저장
        if (activeQuestionIndex === 0) {
            setFirstAnswerActualText(userAnswer.trim());
        }

        // 답변 메시지 추가
        const newAnswer = {
            id: 'a' + activeQuestionIndex,
            type: 'answer',
            text: userAnswer.trim()
        };
        addMessage(newAnswer);

        const nextQuestionCycleIndex = activeQuestionIndex + 1;

        if (nextQuestionCycleIndex < totalQuestions) {
            setIsLoadingNextQuestion(true);

            try {
                const baseQuestionTemplateIndex = nextQuestionCycleIndex - 1;

                if (baseQuestionTemplateIndex < baseQuestionTemplates.length) {
                    const baseQuestionToRefine = baseQuestionTemplates[baseQuestionTemplateIndex].replaceAll('{name}', name);

                    // API에 전달할 첫 번째 질문/답변 (Q3부터 유효)
                    const q1TextForApi = activeQuestionIndex >= 1 ? firstQuestionActualText : null;
                    const a1TextForApi = activeQuestionIndex >= 1 ? firstAnswerActualText : null;

                    const response = await requestRefinedQuestion(
                        name,
                        baseQuestionToRefine,
                        currentQuestionText,
                        userAnswer.trim(),
                        refinementPrompt,
                        q1TextForApi,
                        a1TextForApi
                    );

                    let nextQuestionText = baseQuestionToRefine; // 기본값

                    if (response.ok && response.refinedQuestion) {
                        nextQuestionText = response.refinedQuestion;
                    } else {
                        Alert.alert('다음 질문 생성 실패', response.reason || '다음 질문을 받아오는데 실패했습니다. 기본 질문으로 표시합니다.');
                    }

                    // 다음 질문 추가
                    addMessage({
                        id: 'q' + nextQuestionCycleIndex,
                        type: 'question',
                        text: nextQuestionText
                    });

                    setActiveQuestionIndex(nextQuestionCycleIndex);

                } else {
                    console.error("BASE_QUESTIONS_TEMPLATES 인덱스 오류", baseQuestionTemplateIndex);
                    Alert.alert("오류", "질문 목록 구성에 문제가 있습니다.");
                    setIsLoadingNextQuestion(false);
                    return false;
                }
            } catch (error) {
                Alert.alert('질문 생성 오류', '다음 질문을 생성하는 중 오류가 발생했습니다. 기본 질문으로 표시합니다.');
                console.error("Error fetching refined question:", error);

                // 오류 발생 시 기본 질문 사용
                const baseQuestionTemplateIndexOnError = nextQuestionCycleIndex - 1;
                if (baseQuestionTemplateIndexOnError < baseQuestionTemplates.length) {
                    const baseQuestionToRefineOnError = baseQuestionTemplates[baseQuestionTemplateIndexOnError].replaceAll('{name}', name);
                    addMessage({
                        id: 'q' + nextQuestionCycleIndex,
                        type: 'question',
                        text: baseQuestionToRefineOnError
                    });
                    setActiveQuestionIndex(nextQuestionCycleIndex);
                } else {
                    console.error("Catch - BASE_QUESTIONS_TEMPLATES 인덱스 오류", baseQuestionTemplateIndexOnError);
                    Alert.alert("오류", "질문 목록 구성에 문제가 있어 다음 질문을 표시할 수 없습니다.");
                }
            }

            setIsLoadingNextQuestion(false);
        } else {
            setActiveQuestionIndex(nextQuestionCycleIndex); // 모든 질문 완료
        }

        setCurrentInputValue('');
        return true;
    }, [activeQuestionIndex, firstQuestionActualText, firstAnswerActualText, name, totalQuestions, baseQuestionTemplates, refinementPrompt]);

    /**
     * 모든 질문이 완료되었는지 확인하는 함수
     * @returns {boolean} 완료 여부
     */
    const isAllQuestionsCompleted = useCallback(() => {
        return activeQuestionIndex >= totalQuestions;
    }, [activeQuestionIndex, totalQuestions]);

    return {
        activeQuestionIndex,
        currentInputValue,
        setCurrentInputValue,
        isLoadingNextQuestion,
        firstQuestionActualText,
        firstAnswerActualText,
        setFirstQuestion,
        resetQuestionState,
        handleAnswerAndGenerateNext,
        isAllQuestionsCompleted
    };
} 