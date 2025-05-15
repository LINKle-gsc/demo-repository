import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Platform, TextInput, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
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
  const [filteredContacts, setFilteredContacts] = useState(initialContacts);

  useEffect(() => {
    setFilteredContacts(
      initialContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, initialContacts]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* StatusBar can be configured here if needed, e.g., barStyle="dark-content" */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButtonLeft}>
          <Icon name="chevron-back-outline" size={30} color="#B08D57" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Linkles</Text>
        <TouchableOpacity 
          onPress={onSaveChanges} 
          style={styles.headerButtonRight} 
          disabled={Object.keys(selectedContacts).length === 0} // Disable if no contacts are selected
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}> 
        <Icon name="search-outline" size={20} color="#A9A9A9" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#A9A9A9"
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
              checkedColor="#B08D57"
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFCF4',
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    backgroundColor: '#FFFCF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C0',
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
    color: '#4A4031',
  },
  saveButtonText: {
    color: '#B08D57',
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F5ED',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 8 : 10,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: Platform.OS === 'ios' ? 30 : 40,
    fontSize: 16,
    color: '#4A4031',
  },
  list: {
    flexGrow: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C0',
    backgroundColor: '#FFFCF4',
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
    marginRight: 15,
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
    color: '#4A4031',
  },
  contactPhoneText: {
    fontSize: 13,
    color: '#7A705F',
    marginTop: 2,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#7A705F',
    paddingHorizontal: 20,
  },
});

export default DeviceContactsScreen; 