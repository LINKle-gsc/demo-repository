import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedTargetsScreen from './screens/SavedTargetsScreen';
import DeviceContactsScreen from './screens/DeviceContactsScreen';

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
    console.log("App useEffect triggered - Initial load");
    loadSavedTargetContacts(); // 앱 시작 시 저장된 타겟 로드
    requestInitialPermission(); // 앱 시작 시 권한 상태 확인 및 요청 (UI 블록 방지)
  }, []);

  useEffect(() => {
    // DeviceContactsScreen으로 전환될 때, 그리고 targetContacts나 contacts가 변경될 때 selectedContacts 업데이트
    if (currentView === VIEW_TYPES.DEVICE_CONTACTS && contacts.length > 0) {
      console.log("Updating selectedContacts for DeviceContactsScreen");
      const newSelected = {};
      targetContacts.forEach(target => {
        if (contacts.find(c => c.id === target.id)) {
            newSelected[target.id] = true;
        }
      });
      setSelectedContacts(newSelected);
    } else if (currentView !== VIEW_TYPES.DEVICE_CONTACTS) {
        // 다른 뷰로 전환 시 selectedContacts 초기화 (선택 사항)
        // setSelectedContacts({});
    }
  }, [targetContacts, currentView, contacts]); 

  const requestInitialPermission = async () => {
    console.log("Requesting initial contacts permission...");
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);
    console.log("Initial contacts permission status:", status);
    if (status !== 'granted') {
      console.log('Initial contacts permission denied or not determined.');
      // 첫 로드 시에는 바로 Alert을 띄우지 않을 수 있음 (사용자가 버튼을 눌러 시도하도록 유도)
    }
  };

  const loadSavedTargetContacts = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SAVED_TARGET_CONTACTS_KEY);
      const saved = jsonValue != null ? JSON.parse(jsonValue) : [];
      setTargetContacts(saved);
      console.log("Loaded saved target contacts:", saved.length);
    } catch (e) {
      console.error("Failed to load target contacts from AsyncStorage", e);
      Alert.alert("Error", "Failed to load previously saved target contacts.");
    }
  };

  const loadDeviceContacts = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert("Permission Required", "Contacts permission is needed. Please check settings or grant via button.");
      return false;
    }
    console.log("loadDeviceContacts function called");
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      console.log("Device contacts loaded. Count:", data ? data.length : 0);
      if (data && data.length > 0) {
        setContacts(data);
      } else {
        setContacts([]);
        console.log("No contacts found on device.");
      }
      return true;
    } catch (error) {
      console.error("Error loading device contacts:", error);
      Alert.alert("Error", "Failed to load device contacts. " + error.message);
      return false;
    }
  };

  const toggleContactSelectionInDeviceScreen = (id) => {
    setSelectedContacts(prevSelected => ({
      ...prevSelected,
      [id]: !prevSelected[id],
    }));
  };

  const saveTargetsFromDeviceScreen = async () => {
    const newTargetContacts = contacts.filter(contact => selectedContacts[contact.id]);
    try {
      const jsonValue = JSON.stringify(newTargetContacts);
      await AsyncStorage.setItem(SAVED_TARGET_CONTACTS_KEY, jsonValue);
      setTargetContacts(newTargetContacts);
      console.log('Target contacts updated in AsyncStorage:', newTargetContacts.length);
      Alert.alert("Targets Updated", `Successfully updated ${newTargetContacts.length} call targets!`);
      setCurrentView(VIEW_TYPES.SAVED_TARGETS);
    } catch (e) {
      console.error("Failed to save target contacts to AsyncStorage", e);
      Alert.alert("Error", "Failed to update target contacts.");
    }
  };
  
  const removeTargetContact = async (contactIdToRemove) => {
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

  const switchToDeviceContactsView = async () => {
    if (permissionStatus !== 'granted') {
      console.log("Requesting permission before switching to device contacts view...");
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Contacts permission is required to manage targets from device list.");
        return;
      }
    }
    const loaded = await loadDeviceContacts();
    if (loaded) {
        setCurrentView(VIEW_TYPES.DEVICE_CONTACTS);
    } else {
        Alert.alert("Load Failed", "Could not load device contacts. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {currentView === VIEW_TYPES.SAVED_TARGETS && (
        <SavedTargetsScreen 
          targetContacts={targetContacts}
          onManageTargets={switchToDeviceContactsView}
          onRemoveTarget={removeTargetContact}
        />
      )}
      {currentView === VIEW_TYPES.DEVICE_CONTACTS && (
        <DeviceContactsScreen
          contacts={contacts}
          selectedContacts={selectedContacts}
          onToggleContact={toggleContactSelectionInDeviceScreen}
          onSaveChanges={saveTargetsFromDeviceScreen}
          onGoBack={() => setCurrentView(VIEW_TYPES.SAVED_TARGETS)}
        />
      )}
      {/* Optional: Loading or permission status indicator if needed */}
      {/* {permissionStatus === null && <Text style={styles.permissionText}>Checking permissions...</Text>} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Android StatusBar 고려
    backgroundColor: '#f0f0f0', // 전체 앱 배경색
  },
  // 예시: permissionText 스타일이 필요하다면 여기에 남겨둘 수 있습니다.
  // permissionText: {
  //   textAlign: 'center',
  //   marginTop: 10,
  //   marginBottom: 10,
  //   fontSize: 14,
  //   color: 'gray',
  // },
});
