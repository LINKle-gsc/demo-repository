import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Platform, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import { CheckBox } from 'react-native-elements'; // Assuming you might want to use this or similar

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState({});
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    console.log("App useEffect triggered");
    (async () => {
      console.log("Requesting contacts permission...");
      const { status } = await Contacts.requestPermissionsAsync();
      setPermissionStatus(status);
      console.log("Contacts permission status:", status);
      if (status === 'granted') {
        console.log("Permission granted, loading contacts...");
        loadContacts();
      } else {
        console.log('Contacts permission denied or not determined.');
        Alert.alert(
          "Permission Denied",
          "Cannot access contacts. Please grant permission in settings.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  const loadContacts = async () => {
    console.log("loadContacts function called");
    try {
      console.log("Calling Contacts.getContactsAsync...");
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      console.log("Contacts.getContactsAsync returned. Data length:", data ? data.length : 'null/undefined');

      if (data && data.length > 0) {
        console.log("First contact (if any):", JSON.stringify(data[0], null, 2));
        setContacts(data);
      } else {
        console.log("No contacts found or data is empty.");
        Alert.alert("No Contacts", "No contacts found on this device.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "Failed to load contacts. " + error.message, [{ text: "OK" }]);
    }
  };

  const toggleContactSelection = (id) => {
    setSelectedContacts(prevSelected => ({
      ...prevSelected,
      [id]: !prevSelected[id],
    }));
  };

  const saveSelectedContacts = () => {
    const trulySelected = Object.keys(selectedContacts).filter(id => selectedContacts[id]);
    console.log('Selected contacts to save:', trulySelected);
    Alert.alert("Contacts Saved", `Saved ${trulySelected.length} contacts! (IDs: ${trulySelected.join(', ')})`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact List</Text>
      <Text style={styles.permissionText}>Permission Status: {permissionStatus || 'Checking...'}</Text>
      <Button title="Request Permission & Load Contacts" onPress={() => {
        // Reset status and re-trigger useEffect logic or directly call permission request
        (async () => {
          console.log("Manually requesting contacts permission...");
          const { status } = await Contacts.requestPermissionsAsync();
          setPermissionStatus(status);
          console.log("Contacts permission status (manual):", status);
          if (status === 'granted') {
            console.log("Permission granted (manual), loading contacts...");
            loadContacts();
          } else {
            console.log('Contacts permission denied or not determined (manual).');
            Alert.alert(
              "Permission Denied",
              "Cannot access contacts. Please grant permission in settings.",
              [{ text: "OK" }]
            );
          }
        })();
      }} />
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <CheckBox
              checked={!!selectedContacts[item.id]}
              onPress={() => toggleContactSelection(item.id)}
            />
            <Text style={styles.contactName}>{item.name}</Text>
            {item.phoneNumbers && item.phoneNumbers[0] && (
              <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No contacts found or permission denied.</Text>}
      />
      <Button title="Save Selected Contacts" onPress={saveSelectedContacts} disabled={Object.values(selectedContacts).every(val => !val)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Adjust as needed for status bar etc.
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    color: 'gray',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  contactName: {
    fontSize: 18,
    marginLeft: 10,
    flex: 1,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  }
});
