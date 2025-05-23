import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

// 화면 구성용 컴포넌트
import QuestionScreen from './screens/QuestionScreen';
import SavedTargetsScreen from './screens/SavedTargetsScreen';
import DeviceContactsScreen from './screens/DeviceContactsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import TopicResultScreen from './screens/TopicResultScreen';
import MessageResultScreen from './screens/MessageResultScreen';

// 네이티브 스크린 최적화
enableScreens();

// 네비게이션 스택 생성
const Stack = createNativeStackNavigator();

// 연락처 관련 상수
const SAVED_TARGET_CONTACTS_KEY = '@randomCallTargetContacts';
const ONBOARDING_COMPLETED_KEY = '@onboardingCompleted';

// 스플래시 화면이 자동으로 숨겨지는 것을 방지
SplashScreen.preventAutoHideAsync(); // 주석 해제

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState({});
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [targetContacts, setTargetContacts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(null); // 온보딩 표시 여부 상태, null은 로딩 중

  useEffect(() => {
    async function prepareApp() {
      try {
        console.log("App useEffect triggered - Initial load and prepareApp");
        // 온보딩 완료 여부 확인
        const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        if (onboardingStatus === null) {
          setShowOnboarding(true);
          console.log("Onboarding not completed, setShowOnboarding(true)");
        } else {
          setShowOnboarding(false);
          console.log("Onboarding completed, setShowOnboarding(false)");
        }

        await loadSavedTargetContacts();
        await requestInitialPermission();

        console.log("Initial data loading complete.");

      } catch (e) {
        console.warn("Error during app preparation:", e);
        setShowOnboarding(true);
      } finally {
        setAppIsReady(true);
        console.log("App is ready, setting appIsReady to true.");
      }
    }

    prepareApp();
  }, []);

  // appIsReady 상태가 true가 되면 0.5초 후 스플래시 스크린을 숨깁니다.
  useEffect(() => {
    if (appIsReady && showOnboarding !== null) { // showOnboarding 상태도 로드 완료되었는지 확인
      console.log("appIsReady and showOnboarding determined, attempting to hide splash screen after 0.5s delay.");
      const timer = setTimeout(async () => {
        await SplashScreen.hideAsync();
        console.log("Splash screen hidden.");
      }, 500); // 지연 시간 단축
      return () => clearTimeout(timer);
    }
  }, [appIsReady, showOnboarding]);

  const requestInitialPermission = async () => {
    console.log("Requesting initial contacts permission...");
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);
    console.log("Initial contacts permission status:", status);
    if (status !== 'granted') {
      console.log('Initial contacts permission denied or not determined.');
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
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setShowOnboarding(false);
      console.log("Onboarding completed and status saved.");
    } catch (e) {
      console.error("Failed to save onboarding status", e);
      Alert.alert("Error", "Failed to save onboarding status.");
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

  // 앱 로딩 중이거나 온보딩 상태 결정 전에는 스플래시 화면이 계속 보이도록 함
  if (!appIsReady || showOnboarding === null) {
    return null; // 또는 로딩 스피너 컴포넌트
  }

  // 온보딩 화면을 보여줘야 하는 경우
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // 온보딩 완료 후 메인 앱 네비게이션
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SavedTargets">
        <Stack.Screen
          name="Questions"
          component={QuestionScreen}
          options={{ title: 'Revisit Memories' }}
        />
        <Stack.Screen
          name="TopicResult"
          component={TopicResultScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MessageResult"
          component={MessageResultScreen}
          options={{ headerShown: false }}
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
