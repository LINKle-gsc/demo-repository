import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 화면 구성용 컴포넌트
import QuestionScreen from './screens/QuestionScreen';
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import SavedTargetsScreen from './screens/SavedTargetsScreen';
import DeviceContactsScreen from './screens/DeviceContactsScreen';

// 네이티브 스크린 최적화
enableScreens();

// 네비게이션 스택 생성
const Stack = createNativeStackNavigator();

// 연락처 관련 상수
const SAVED_TARGET_CONTACTS_KEY = '@randomCallTargetContacts';
const VIEW_TYPES = {
  SAVED_TARGETS: 'SAVED_TARGETS',
  DEVICE_CONTACTS: 'DEVICE_CONTACTS',
};

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState({});
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [targetContacts, setTargetContacts] = useState([]);

  useEffect(() => {
    console.log("App useEffect triggered - Initial load");
    loadSavedTargetContacts();
    requestInitialPermission();
  }, []);

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
      Alert.alert("Permission Required", "Contacts permission is needed.");
      return null;
    }
    console.log("loadDeviceContacts function called");
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      console.log("Device contacts loaded. Count:", data ? data.length : 0);
      if (data && data.length > 0) {
        setContacts(data);
        return data;
      } else {
        setContacts([]);
        console.log("No contacts found on device.");
        return [];
      }
    } catch (error) {
      console.error("Error loading device contacts:", error);
      Alert.alert("Error", "Failed to load device contacts. " + error.message);
      return null;
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

  const handlePlusButtonPress = async (navigation) => {
    let currentPermissionStatus = permissionStatus;
    if (currentPermissionStatus !== 'granted') {
      console.log("Requesting permission before navigating to device contacts view...");
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      currentPermissionStatus = status;
    }

    if (currentPermissionStatus !== 'granted') {
      Alert.alert("Permission Denied", "Contacts permission is required to manage targets from the device list.");
      return;
    }

    const loadedDeviceContacts = await loadDeviceContacts();

    if (loadedDeviceContacts !== null) {
      const newSelected = {};
      targetContacts.forEach(target => {
        if (Array.isArray(loadedDeviceContacts) && loadedDeviceContacts.find(c => c.id === target.id)) {
          newSelected[target.id] = true;
        }
      });
      setSelectedContacts(newSelected);

      navigation.navigate('DeviceContacts');
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SavedTargets">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: '홈' }}
        />
        <Stack.Screen 
          name="Questions" 
          component={QuestionScreen} 
          options={{ title: '질문하기' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: '추천 결과' }}
        />
        <Stack.Screen 
          name="SavedTargets"
          options={{ headerShown: false }}
        >
          {({ navigation }) => (
            <SavedTargetsScreen 
              targetContacts={targetContacts}
              onManageTargets={() => handlePlusButtonPress(navigation)}
              onRemoveTarget={removeTargetContact}
              navigation={navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="DeviceContacts"
          options={{ headerShown: false }}
        >
          {({ navigation }) => (
            <DeviceContactsScreen
              contacts={contacts} 
              selectedContacts={selectedContacts}
              onToggleContact={toggleContactSelectionInDeviceScreen}
              onSaveChanges={() => {
                saveTargetsFromDeviceScreen();
                navigation.navigate('SavedTargets');
              }}
              onGoBack={() => navigation.navigate('SavedTargets')}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
