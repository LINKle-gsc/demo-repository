/**
 * 커스텀 훅들을 모아서 export하는 인덱스 파일
 * 각 화면에서 사용하는 모든 훅들을 중앙에서 관리합니다.
 */

// SavedTargetsScreen 관련 훅들
export { useRandomSelection } from './useRandomSelection';
export { useContactNavigation } from './useContactNavigation';
export { useContactActions } from './useContactActions';

// QuestionScreen 관련 훅들
export { useChat } from './useChat';
export { useQuestions } from './useQuestions';
export { useCompletion } from './useCompletion';