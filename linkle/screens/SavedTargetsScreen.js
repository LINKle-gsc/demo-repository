import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Ionicons';

// SavedTargetsScreen 컴포넌트 정의
const SavedTargetsScreen = ({ targetContacts, onManageTargets, onRemoveTarget, navigation }) => {

  const handleChatPress = (contactName) => {
    // Alert.alert("Chat Feature", `Prepare chat with ${contactName} (Coming soon!)`); // 기존 알림 대신 네비게이션
    if (navigation) {
      navigation.navigate('Questions', { name: contactName });
    } else {
      console.error("Navigation prop is not available in SavedTargetsScreen");
      Alert.alert("Error", "Cannot navigate to Question screen.");
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete '${item.name}'?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: () => onRemoveTarget(item.id)
        }
      ],
      { cancelable: false }
    );
  };

  const handleRandomSelect = () => {
    if (targetContacts && targetContacts.length > 0) {
      const randomIndex = Math.floor(Math.random() * targetContacts.length);
      const selectedContact = targetContacts[randomIndex];
      handleChatPress(selectedContact.name); // 기존 알림 함수 재활용
    } else {
      Alert.alert("No Targets", "No targets are saved, so a random selection cannot be made.");
    }
  };

  const renderItem = (data, rowMap) => (
    <View style={styles.contactItemFront}>
        <View style={styles.contactInfoWrapper}>
            <Text style={styles.contactName} numberOfLines={1} ellipsizeMode="tail">{data.item.name}</Text>
            {data.item.phoneNumbers && data.item.phoneNumbers[0] && (
            <Text style={styles.contactPhone} numberOfLines={1} ellipsizeMode="tail">{data.item.phoneNumbers[0].number}</Text>
            )}
        </View>
        <TouchableOpacity onPress={() => handleChatPress(data.item.name)} style={styles.chatIconButton}>
          <Icon name="chatbubbles-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
    </View>
  );

  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.contactItemBack}>
        <TouchableOpacity
            style={[styles.backRightBtn, styles.backRightBtnRight]}
            onPress={() => confirmDelete(data.item)}
        >
            <Icon name="trash-outline" size={26} color="#FFF" />
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.viewContainer}>
      {/* Header View */}
      <View style={styles.headerContainer}>
        <View style={styles.headerButtonPlaceholder} />
        <Text style={styles.headerTitle}>Saved Targets ({targetContacts.length})</Text>
        <TouchableOpacity onPress={onManageTargets} style={styles.headerButtonRight}>
          <Icon name="add-circle-outline" size={30} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <SwipeListView
        data={targetContacts}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={targetContacts.length > 0 ? targetContacts[0].id + '_target' : '0'}
        previewOpenValue={-40}
        previewOpenDelay={1000}
        disableRightSwipe={true}
        keyExtractor={item => item.id + '_target'}
        ListEmptyComponent={<Text style={styles.emptyListText}>No call targets saved yet. Click '+' to add.</Text>}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Random Select FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleRandomSelect}
        activeOpacity={0.7}
      >
        <Icon name="shuffle-outline" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

// SavedTargetsScreen에 필요한 스타일 (DeviceContactsScreen과 유사한 헤더 스타일 적용)
const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0', // 배경색 추가
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D1D6',
    backgroundColor: Platform.OS === 'ios' ? '#F8F8F8' : '#FFFFFF',
  },
  headerButtonPlaceholder: { // 제목을 중앙에 두기 위한 왼쪽 공간 확보용
    width: 30, // 아이콘 너비와 유사하게
    padding: 5,
  },
  headerButtonRight: {
    padding: 5, // 아이콘 터치 영역 확보
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#000',
  },
  list: {
    flexGrow: 1,
    // paddingHorizontal: 20, // contactItem에서 패딩 관리
  },
  contactItemFront: { // 보이는 부분 스타일
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20, 
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    backgroundColor: '#fff', 
    height: 'auto', // 내용에 따라 높이 자동 조절
  },
  contactItemBack: { // 숨겨진 부분 스타일
    alignItems: 'center',
    backgroundColor: '#FF3B30', // 삭제 배경색
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // paddingLeft: 15, // 필요 없음
  },
  contactInfoWrapper: {
    flex: 1,
    marginRight: 10,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: '#555',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50, // 헤더 높이 고려
    fontSize: 16,
    color: '#777',
    paddingHorizontal: 20,
  },
  chatIconButton: { // 기존 removeIconButton에서 이름 변경
    padding: 8,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75, // rightOpenValue와 동일하게
  },
  backRightBtnRight: {
    backgroundColor: '#FF3B30',
    right: 0,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF', // iOS Blue, or choose another color
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 30,
    alignSelf: 'center',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android Shadow
    elevation: 5,
  },
});

export default SavedTargetsScreen; 