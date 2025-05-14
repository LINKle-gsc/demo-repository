import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import QuestionScreen from './screens/QuestionScreen';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation }) {
  const [name, setName] = React.useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LINKle</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="이름을 입력하세요"
      />
      <Button
        title="질문 시작하기"
        onPress={() => navigation.navigate('Questions', { name })}
        disabled={!name.trim()}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: 250,
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#222',
  },
});
