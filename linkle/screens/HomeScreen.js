import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, Button, SafeAreaView } from 'react-native';
import { commonStyles } from '../styles/CommonStyles';

export default function HomeScreen({ navigation }) {
  const [name, setName] = React.useState('');
  return (
    <SafeAreaView style={commonStyles.container}>
      <Text style={commonStyles.title}>LINKle</Text>
      <TextInput
        style={commonStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="이름을 입력하세요"
      />
      <View style={{ marginBottom: 60 }}> 
        <Button
          title="질문 시작하기"
          onPress={() => navigation.navigate('Questions', { name })}
          disabled={!name.trim()}
        />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
} 