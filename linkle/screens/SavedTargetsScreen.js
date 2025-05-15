import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';
// import LottieView from 'lottie-react-native'; // LottieView 임시 주석 처리

// SavedTargetsScreen 컴포넌트 정의
const SavedTargetsScreen = ({ targetContacts, onManageTargets, onRemoveTarget, navigation }) => {
  const [isLinking, setIsLinking] = useState(false);

  const handleChatPress = (contactName) => {
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
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => onRemoveTarget(item.id) }
      ],
      { cancelable: false }
    );
  };

  const handleRandomSelect = () => {
    if (targetContacts && targetContacts.length > 0) {
      setIsLinking(true);
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * targetContacts.length);
        const selectedContact = targetContacts[randomIndex];
        handleChatPress(selectedContact.name);
        setIsLinking(false);
      }, 2500);
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
    <SafeAreaView style={styles.viewContainer}>
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

      {/* Updated Random Select FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleRandomSelect}
        activeOpacity={0.7}
        disabled={isLinking}
      >
        <Text style={styles.fabText}>Linkle!</Text>
      </TouchableOpacity>

      {/* Loading Modal with ActivityIndicator */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLinking}
      >
        <View style={styles.lottieOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.lottieText}>Linkle하는중...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// SavedTargetsScreen에 필요한 스타일 (DeviceContactsScreen과 유사한 헤더 스타일 적용)
const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 배경색 추가
    paddingTop: Constants.statusBarHeight, // 상태 표시줄 높이만큼 패딩 추가
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
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
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
  }
});

export default SavedTargetsScreen; 