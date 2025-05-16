import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, TextInput, SafeAreaView } from 'react-native';
import { CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';

// DeviceContactsScreen 컴포넌트 정의
const DeviceContactsScreen = ({
  contacts: initialContacts,
  selectedContacts,
  onToggleContact,
  onSaveChanges,
  onGoBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어에 따라 연락처 필터링
  const filteredContacts = initialContacts.filter(contact => {
    const normalizedSearchTerm = searchTerm.normalize().toLowerCase(); // 검색어 정규화 및 소문자화
    
    // 이름 검색 로직 수정
    const nameMatch = contact.name && 
                      contact.name.normalize().toLowerCase().includes(normalizedSearchTerm);
    
    // 전화번호 검색 로직 (숫자 이외의 문자 제거 후 비교)
    const phoneSearchTermDigits = normalizedSearchTerm.replace(/\D/g, '');
    const phoneMatch = phoneSearchTermDigits.length > 0 && // 검색어에 숫자가 있을 경우에만 전화번호 검색 시도
                       contact.phoneNumbers && 
                       contact.phoneNumbers.some(phone => 
                         phone.number && phone.number.replace(/\D/g, '').includes(phoneSearchTermDigits)
                       );
    return nameMatch || phoneMatch;
  });

  return (
    <SafeAreaView style={styles.viewContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButtonLeft}>
          <Icon name="chevron-back-outline" size={30} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Targets</Text>
        <TouchableOpacity 
          onPress={onSaveChanges} 
          style={styles.headerButtonRight} 
          disabled={initialContacts.length === 0 && Object.keys(selectedContacts).length === 0}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}> 
        <Icon name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or number..."
          placeholderTextColor="#8E8E93"
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <CheckBox
              checked={!!selectedContacts[item.id]}
              onPress={() => onToggleContact(item.id)}
              containerStyle={styles.checkboxContainer}
            />
            <View style={styles.contactInfoContainer}>
                <Text style={styles.contactNameText}>{item.name}</Text>
                {item.phoneNumbers && item.phoneNumbers[0] && (
                <Text style={styles.contactPhoneText}>{item.phoneNumbers[0].number}</Text>
                )}
            </View>
          </View>
        )}
        ListEmptyComponent={
            <Text style={styles.emptyListText}>
                {initialContacts.length === 0 
                    ? "No contacts found on device or permission denied."
                    : "No contacts match your search."}
            </Text>
        }
        style={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

// DeviceContactsScreen에 필요한 스타일
const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Constants.statusBarHeight,
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
  headerButtonLeft: {
    padding: 5,
  },
  headerButtonRight: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#000',
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? '#EFEFF4' : '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 8 : 0,
    marginHorizontal: Platform.OS === 'ios' ? 0 : 10,
    marginVertical: Platform.OS === 'ios' ? 0 : 5,
    borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
    borderBottomColor: Platform.OS === 'ios' ? '#D1D1D6' : 'transparent',
    borderRadius: Platform.OS === 'android' ? 5 : 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: Platform.OS === 'ios' ? 30 : 40,
    fontSize: 16,
    backgroundColor: 'transparent',
    paddingHorizontal: Platform.OS === 'android' ? 10 : 0,
  },
  list: {
    flexGrow: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
    marginRight: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  contactInfoContainer: {
    flex: 1, 
    justifyContent: 'center',
  },
  contactNameText: {
    fontSize: 17,
    fontWeight: '500',
  },
  contactPhoneText: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
    paddingHorizontal: 20,
  },
});

export default DeviceContactsScreen; 