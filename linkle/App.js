import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Platform, Alert, TouchableOpacity } from 'react-native';
import * as Contacts from 'expo-contacts';
import { CheckBox } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_TARGET_CONTACTS_KEY = '@randomCallTargetContacts';

// 화면 타입을 위한 상수
const VIEW_TYPES = {
  SAVED_TARGETS: 'SAVED_TARGETS',
  DEVICE_CONTACTS: 'DEVICE_CONTACTS',
};

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState({});
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [targetContacts, setTargetContacts] = useState([]);
  const [currentView, setCurrentView] = useState(VIEW_TYPES.SAVED_TARGETS); // 현재 화면 상태

  useEffect(() => {
    console.log("App useEffect triggered");
    loadSavedTargetContacts(); // 앱 시작 시 저장된 타겟 먼저 로드

    // 권한 요청 및 기기 연락처 로드 (필요 시점에만 로드하도록 변경 가능)
    (async () => {
      console.log("Requesting contacts permission...");
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      console.log("Contacts permission status:", status);
      if (status === 'granted') {
        console.log("Permission granted.");
        // 앱 시작 시 기기 연락처를 바로 로드하지 않고, 사용자가 버튼을 눌렀을 때 로드하도록 변경 가능
        // loadDeviceContacts(); 
      } else {
        console.log('Contacts permission denied or not determined.');
        // Alert.alert( // 초기 화면에서는 알림 최소화
        //   "Permission Denied",
        //   "Cannot access contacts. Please grant permission in settings.",
        //   [{ text: "OK" }]
        // );
      }
    })();
  }, []);

  // targetContacts가 변경될 때마다 selectedContacts 업데이트 (기기 연락처 뷰에 반영 위함)
  useEffect(() => {
    if (currentView === VIEW_TYPES.DEVICE_CONTACTS) {
      const newSelected = {};
      targetContacts.forEach(target => {
        newSelected[target.id] = true;
      });
      // 기기 연락처 목록(contacts)에 있는 항목 중에서 targetContacts에 있는 것들만 selected로 설정
      // 이렇게 하면 기기 연락처 목록을 다시 볼 때 이전에 선택했던 (그리고 저장했던) 항목들이 체크되어 있음
      const currentDeviceContactIds = contacts.map(c => c.id);
      const relevantSelected = {};
      targetContacts.forEach(target => {
        if (currentDeviceContactIds.includes(target.id)) {
            relevantSelected[target.id] = true;
        }
      });
      setSelectedContacts(relevantSelected);
    }
  }, [targetContacts, currentView, contacts]);


  const loadSavedTargetContacts = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SAVED_TARGET_CONTACTS_KEY);
      const savedContacts = jsonValue != null ? JSON.parse(jsonValue) : [];
      setTargetContacts(savedContacts);
      console.log("Loaded saved target contacts:", savedContacts);
    } catch (e) {
      console.error("Failed to load target contacts from AsyncStorage", e);
      Alert.alert("Error", "Failed to load previously saved target contacts.");
    }
  };

  const loadDeviceContacts = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert("Permission Required", "Contacts permission is needed to load device contacts. Please grant it via the button or settings.");
      return;
    }
    console.log("loadDeviceContacts function called");
    try {
      console.log("Calling Contacts.getContactsAsync...");
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      console.log("Contacts.getContactsAsync returned. Data length:", data ? data.length : 'null/undefined');

      if (data && data.length > 0) {
        setContacts(data);
        // 기기 연락처를 로드했을 때, 현재 저장된 타겟들을 selectedContacts에 반영
        const newSelected = {};
        targetContacts.forEach(target => {
            if (data.find(c => c.id === target.id)) { // 로드된 기기 연락처 목록에 해당 ID가 있을 때만
                 newSelected[target.id] = true;
            }
        });
        setSelectedContacts(newSelected);

      } else {
        setContacts([]); // 데이터가 없으면 빈 배열로 설정
        console.log("No contacts found or data is empty.");
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "Failed to load contacts. " + error.message);
    }
  };

  const toggleContactSelection = (id) => {
    setSelectedContacts(prevSelected => ({
      ...prevSelected,
      [id]: !prevSelected[id],
    }));
  };

  const saveSelectedContactsAsTargets = async () => {
    // 현재 selectedContacts (체크박스로 선택된 ID들)를 기준으로 targetContacts를 업데이트
    // 즉, contacts (전체 기기 연락처)에서 selectedContacts에 있는 ID들만 필터링하여 새로운 targetContacts로 만듦.
    const newTargetContacts = contacts.filter(contact => selectedContacts[contact.id]);

    try {
      const jsonValue = JSON.stringify(newTargetContacts);
      await AsyncStorage.setItem(SAVED_TARGET_CONTACTS_KEY, jsonValue);
      setTargetContacts(newTargetContacts); // 상태 업데이트
      setSelectedContacts({}); // 선택 초기화 (기기 연락처 뷰에서 나가면 초기화되는 효과)
      console.log('Target contacts updated in AsyncStorage:', newTargetContacts);
      Alert.alert("Targets Updated", `Successfully updated ${newTargetContacts.length} call targets!`);
      setCurrentView(VIEW_TYPES.SAVED_TARGETS); // 저장 후 메인 뷰로 돌아가기
    } catch (e) {
      console.error("Failed to save target contacts to AsyncStorage", e);
      Alert.alert("Error", "Failed to update target contacts.");
    }
  };
  
  const handleRemoveTarget = async (contactIdToRemove) => {
    const newTargetContacts = targetContacts.filter(contact => contact.id !== contactIdToRemove);
    try {
      const jsonValue = JSON.stringify(newTargetContacts);
      await AsyncStorage.setItem(SAVED_TARGET_CONTACTS_KEY, jsonValue);
      setTargetContacts(newTargetContacts);
      Alert.alert("Target Removed", "Contact removed from call targets.");
    } catch (e) {
      console.error("Failed to remove target contact from AsyncStorage", e);
      Alert.alert("Error", "Failed to remove target contact.");
    }
  };


  const requestPermissionAndLoadDeviceContacts = async () => {
    console.log("Requesting contacts permission (manual)...");
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);
    console.log("Contacts permission status (manual):", status);
    if (status === 'granted') {
      console.log("Permission granted (manual), loading contacts...");
      await loadDeviceContacts(); // 기기 연락처 로드
      setCurrentView(VIEW_TYPES.DEVICE_CONTACTS); // 기기 연락처 뷰로 전환
    } else {
      console.log('Contacts permission denied or not determined (manual).');
      Alert.alert(
        "Permission Denied",
        "Cannot access contacts. Please grant permission in settings.",
        [{ text: "OK" }]
      );
    }
  };

  const renderSavedTargetsView = () => (
    <View style={styles.viewContainer}>
      <Text style={styles.title}>Saved Call Targets ({targetContacts.length})</Text>
      <TouchableOpacity 
        style={styles.navigationButton} 
        onPress={requestPermissionAndLoadDeviceContacts}
      >
        <Text style={styles.navigationButtonText}>Manage Call Targets (Load Device Contacts)</Text>
      </TouchableOpacity>
      <FlatList
        data={targetContacts}
        keyExtractor={item => item.id + '_target'}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <View style={{flex: 1}}>
                <Text style={styles.contactName}>{item.name}</Text>
                {item.phoneNumbers && item.phoneNumbers[0] && (
                <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                )}
            </View>
            <TouchableOpacity onPress={() => handleRemoveTarget(item.id)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyListText}>No call targets saved yet. Click above to add.</Text>}
        style={styles.list}
      />
    </View>
  );

  const renderDeviceContactsView = () => (
    <View style={styles.viewContainer}>
      <Text style={styles.title}>Select Call Targets from Device</Text>
      <TouchableOpacity style={styles.navigationButton} onPress={() => setCurrentView(VIEW_TYPES.SAVED_TARGETS)}>
        <Text style={styles.navigationButtonText}>Back to Saved Targets</Text>
      </TouchableOpacity>
      <Button title="Update Saved Targets" onPress={saveSelectedContactsAsTargets} disabled={contacts.length === 0} />
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <CheckBox
              checked={!!selectedContacts[item.id]}
              onPress={() => toggleContactSelection(item.id)}
              containerStyle={styles.checkboxContainer}
            />
            <Text style={styles.contactName}>{item.name}</Text>
            {item.phoneNumbers && item.phoneNumbers[0] && (
              <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyListText}>No contacts found on device or permission denied. Please grant permission.</Text>}
        style={styles.list}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {currentView === VIEW_TYPES.SAVED_TARGETS && renderSavedTargetsView()}
      {currentView === VIEW_TYPES.DEVICE_CONTACTS && renderDeviceContactsView()}
      {!permissionStatus && ( // 초기 권한 상태 로딩 중 표시 (옵션)
        <Text style={styles.permissionText}>Checking permissions...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Android StatusBar 고려
    backgroundColor: '#f0f0f0',
  },
  viewContainer: { // 각 뷰를 위한 컨테이너
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  navigationButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    color: 'gray',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Remove 버튼을 오른쪽으로 밀기 위해
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    elevation: 1, // Android 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkboxContainer: { // 체크박스 컨테이너 스타일 추가
    padding: 0,
    margin: 0,
    marginRight: 5, // 이름과의 간격
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  list: {
    flexGrow: 1, // 목록이 남은 공간을 채우도록
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#777',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30', // 빨간색 계열
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
