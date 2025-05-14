import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import QuestionScreen from './screens/QuestionScreen';
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import React from 'react';

// 네이티브 스크린 활성화
enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
