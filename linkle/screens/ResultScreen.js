import React, { useState } from 'react';
import { Text, View, Button, SafeAreaView, Share, ScrollView, TouchableOpacity } from 'react-native';
import { resultStyles } from '../styles/ResultStyles';

function ResultList({ title, items, selected = [], onSelect, selectable = false }) {
  return (
    <>
      <Text style={resultStyles.heading}>{title}</Text>
      {items.map((item, idx) => (
        selectable ? (
          <TouchableOpacity key={idx} onPress={() => onSelect(idx)}>
            <Text style={selected.includes(idx) ? resultStyles.selectedItem : resultStyles.item}>
              {idx + 1}: {item}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text key={idx} style={resultStyles.item}>
            {idx + 1}: {item}
          </Text>
        )
      ))}
    </>
  );
}

export default function ResultScreen({ route }) {
  const { starters = [], topics = [], rawText = '', name = '' } = route.params || {};
  const [selectedStarters, setSelectedStarters] = useState([]);

  return (
    <SafeAreaView style={[resultStyles.safeArea, { flex: 1, backgroundColor: '#FFFFFF' }]}>
      <ScrollView contentContainerStyle={[resultStyles.scrollContent, { paddingBottom: 60 }]}>
        {/* {rawText ? (
          <Text style={resultStyles.resultText}>{rawText}</Text>
        ) : null}  */}
        <ResultList
          title={`이렇게 ${name}님과의 대화를 시작해볼까요?`}
          items={starters}
          selected={selectedStarters}
          onSelect={idx => setSelectedStarters(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
          selectable={true}
        />
        <ResultList
          title="이런 주제로 대화해보시는 건 어떠세요?"
          items={topics}
          selectable={false}
        />
        <Button title="공유" onPress={() => {
          const message =
            selectedStarters.map(i => `${starters[i]}`).join('\n')
          Share.share({ message });
        }}/>
      </ScrollView>
    </SafeAreaView>
  );
} 