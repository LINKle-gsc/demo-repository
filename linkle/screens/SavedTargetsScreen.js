import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Modal, ActivityIndicator, SafeAreaView, Image, Dimensions } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRandomSelection, useContactNavigation, useContactActions } from '../hooks';

const { width, height } = Dimensions.get('window'); // For image sizing and height

/**
 * SavedTargetsScreen - 저장된 타겟 연락처들을 관리하고 표시하는 메인 화면 컴포넌트
 * 
 * @description
 * 이 컴포넌트는 사용자가 저장한 연락처 목록을 보여주고, 다음과 같은 주요 기능을 제공합니다:
 * - 저장된 연락처 리스트 표시 (스와이프 리스트 형태)
 * - 연락처별 채팅 시작 기능
 * - 스와이프를 통한 연락처 삭제 기능
 * - 랜덤 연락처 선택 및 Linkle 시작 기능
 * - 새로운 연락처 추가 기능
 * - 빈 리스트 상태에 대한 안내 화면
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.targetContacts - 저장된 타겟 연락처 배열
 * @param {Array} props.targetContacts[].id - 연락처 고유 ID
 * @param {string} props.targetContacts[].name - 연락처 이름
 * @param {Array} props.targetContacts[].phoneNumbers - 연락처 전화번호 배열
 * @param {Function} props.onManageTargets - 새로운 연락처 추가/관리를 위한 콜백 함수
 * @param {Function} props.onRemoveTarget - 연락처 삭제를 위한 콜백 함수
 * @param {Object} props.navigation - React Navigation 네비게이션 객체
 * 
 * @returns {JSX.Element} 저장된 타겟 화면 컴포넌트
 * 
 * @example
 * ```jsx
 * <SavedTargetsScreen 
 *   targetContacts={contacts}
 *   onManageTargets={() => navigation.navigate('ContactSelection')}
 *   onRemoveTarget={(id) => removeContact(id)}
 *   navigation={navigation}
 * />
 * ```
 * 
 * @features
 * - **SwipeListView**: 연락처 리스트를 스와이프 가능한 형태로 표시
 * - **Random Selection**: 'Linkle!' 버튼을 통한 랜덤 연락처 선택
 * - **Delete Confirmation**: 연락처 삭제 시 확인 알림
 * - **Loading State**: Linkle 진행 중 로딩 모달 표시
 * - **Empty State**: 연락처가 없을 때 안내 이미지와 메시지 표시
 * - **Highlight Effect**: 랜덤 선택된 연락처 하이라이트 표시
 * 
 * @hooks
 * - useRandomSelection: 랜덤 선택 관련 상태와 로직 관리
 * - useContactNavigation: 네비게이션 관련 로직 관리
 * - useContactActions: 연락처 액션(삭제 등) 관리
 * 
 * @navigation
 * - Questions: 연락처 선택 시 질문 화면으로 이동 (연락처 이름을 파라미터로 전달)
 */
const SavedTargetsScreen = ({ targetContacts, onManageTargets, onRemoveTarget, navigation }) => {
  // 커스텀 훅들 사용
  const { isLinking, highlightedContactId, handleRandomSelect } = useRandomSelection(targetContacts, navigation);
  const { handleChatPress } = useContactNavigation(navigation);
  const { confirmDelete } = useContactActions(onRemoveTarget);

  /**
   * SwipeListView의 각 연락처 아이템 렌더링
   * @param {Object} data - 연락처 데이터 객체
   * @param {Object} data.item - 연락처 정보
   * @param {Object} rowMap - SwipeListView 행 맵 객체
   * @returns {JSX.Element} 연락처 아이템 컴포넌트
   * @description 연락처 이름, 전화번호, 채팅 버튼을 포함한 UI 렌더링
   */
  const renderItem = (data, rowMap) => (
    <View style={styles.contactItemFront}>
      <View style={styles.contactInfoWrapper}>
        <View style={styles.contactNameContainer}>
          <Text style={styles.contactName} numberOfLines={1} ellipsizeMode="tail">{data.item.name}</Text>
        </View>
        {data.item.phoneNumbers && data.item.phoneNumbers[0] && (
          <Text style={styles.contactPhone} numberOfLines={1} ellipsizeMode="tail">{data.item.phoneNumbers[0].number}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => handleChatPress(data.item.name)} style={styles.chatIconButton}>
        <Icon name="chatbubbles-outline" size={24} color="#B08D57" />
      </TouchableOpacity>
    </View>
  );

  /**
   * 스와이프 시 나타나는 숨겨진 아이템 렌더링 (삭제 버튼)
   * @param {Object} data - 연락처 데이터 객체
   * @param {Object} rowMap - SwipeListView 행 맵 객체
   * @returns {JSX.Element} 삭제 버튼 컴포넌트
   * @description 오른쪽 스와이프 시 나타나는 빨간색 삭제 버튼 UI
   */
  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.contactItemBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => confirmDelete(data.item)}
      >
        <Icon name="trash-outline" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );



  /**
   * 빈 리스트 상태 컴포넌트 렌더링
   * @returns {JSX.Element} 빈 상태 안내 컴포넌트
   * @description 저장된 연락처가 없을 때 표시되는 안내 메시지와 이미지
   */
  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyListText}>
        Wanna tap the +{'\n'}and Linkle with someone random?
      </Text>
      <Image
        source={require('../assets/all.png')}
        style={styles.emptyStateImage}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.viewContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerButtonPlaceholder} />
        <Text style={styles.headerTitle}>Linkle List({targetContacts.length})</Text>
        <TouchableOpacity onPress={onManageTargets} style={styles.headerButtonRight}>
          <Icon name="add-circle-outline" size={30} color="#B08D57" />
        </TouchableOpacity>
      </View>

      <SwipeListView
        data={targetContacts.map((contact, index) => ({ ...contact, key: `${index}` }))}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={targetContacts.length > 0 ? '0' : null}
        previewOpenValue={-40}
        previewOpenDelay={1000}
        disableRightSwipe={false}
        keyExtractor={item => item.id + '_target'}
        ListEmptyComponent={renderEmptyListComponent}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={targetContacts.length === 0 ? styles.emptyListContainer : null}
      />

      {targetContacts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleRandomSelect}
          activeOpacity={0.7}
          disabled={isLinking}
        >
          <Text style={styles.fabText}>Linkle!</Text>
        </TouchableOpacity>
      )}

      <Modal
        transparent={true}
        animationType="fade"
        visible={isLinking}
        onRequestClose={() => setIsLinking(false)}
      >
        <View style={styles.lottieOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.lottieText}>랜덤 선택 중...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: '#FFFCF4',
    paddingTop: Constants.statusBarHeight,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    backgroundColor: '#FFFCF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C0',
  },
  headerButtonPlaceholder: {
    width: 30,
    padding: 5,
  },
  headerButtonRight: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#4A4031',
  },
  list: {
    flexGrow: 1,
    backgroundColor: '#FFFCF4',
  },
  contactItemFront: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C0',
    backgroundColor: '#FFFCF4',
    height: 'auto',
  },
  contactItemBack: {
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactInfoWrapper: {
    flex: 1,
    marginRight: 10,
  },
  contactNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
    color: '#4A4031',
  },
  contactPhone: {
    fontSize: 13,
    color: '#7A705F',
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFCF4',
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7A705F',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyStateImage: {
    width: width * 0.6,
    height: width * 0.6 * (3 / 4), // TODO: Assuming a 4:3 aspect ratio, adjust as needed
    resizeMode: 'contain',
  },
  chatIconButton: {
    padding: 8,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: '#FF3B30',
    right: 0,
  },
  fab: {
    position: 'absolute',
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#B08D57',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 60,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lottieOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
});

export default SavedTargetsScreen; 