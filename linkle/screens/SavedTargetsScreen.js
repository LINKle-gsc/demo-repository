import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert, Modal, ActivityIndicator, SafeAreaView, StatusBar, Image, Dimensions } from 'react-native'; // Added Image, Dimensions
import { SwipeListView } from 'react-native-swipe-list-view';
import Icon from 'react-native-vector-icons/Ionicons';
import Constants from 'expo-constants';
// import LottieView from 'lottie-react-native'; // LottieView import commented out for reversion

const { width } = Dimensions.get('window'); // For image sizing

// SavedTargetsScreen 컴포넌트 정의
const SavedTargetsScreen = ({ targetContacts, onManageTargets, onRemoveTarget, navigation }) => {
  const [isLinking, setIsLinking] = useState(false);
  // const lottieAnimationRef = useRef(null); // Not used in reverted version

  // `общийСтиль` and `fixedStyles` are removed. The `styles` object at the bottom will be used.

  const handleChatPress = (contactName) => {
    if (navigation) {
      navigation.navigate('Questions', { name: contactName });
    } else {
      console.error("Navigation prop is not available in SavedTargetsScreen");
      Alert.alert("Error", "Cannot navigate to Question screen.");
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete '${item.name}'?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => onRemoveTarget(item.id) }
      ],
      { cancelable: false }
    );
  };

  const handleRandomSelect = () => {
    if (targetContacts && targetContacts.length > 0) {
      setIsLinking(true); 
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * targetContacts.length);
        const selectedContact = targetContacts[randomIndex];
        if (navigation && selectedContact) {
          navigation.navigate('Questions', { name: selectedContact.name });
        }
        setIsLinking(false); 
      }, 2000); 
    } else {
      Alert.alert("No Targets", "No targets are saved, so a random selection cannot be made.");
    }
  };

  const renderItem = (data, rowMap) => (
    <View style={styles.contactItemFront}>
        <View style={styles.contactInfoWrapper}>
            <Text style={styles.contactName} numberOfLines={1} ellipsizeMode="tail">{data.item.name}</Text>
            {data.item.phoneNumbers && data.item.phoneNumbers[0] && (
            <Text style={styles.contactPhone} numberOfLines={1} ellipsizeMode="tail">{data.item.phoneNumbers[0].number}</Text>
            )}
        </View>
        <TouchableOpacity onPress={() => handleChatPress(data.item.name)} style={styles.chatIconButton}>
          <Icon name="chatbubbles-outline" size={24} color="#B08D57" />
        </TouchableOpacity>
     </View>
  );

  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.contactItemBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => confirmDelete(data.item)}
      >
        <Icon name="trash-outline" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
  
  const closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  // Empty state component for SwipeListView
  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyListText}>
        Wanna tap the + and Linkle with someone random?
      </Text>
      <Image 
        source={require('../assets/all.png')} 
        style={styles.emptyStateImage} 
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.viewContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerButtonPlaceholder} />
        <Text style={styles.headerTitle}>Linkle List({targetContacts.length})</Text>
        <TouchableOpacity onPress={onManageTargets} style={styles.headerButtonRight}>
          <Icon name="add-circle-outline" size={30} color="#B08D57" />
        </TouchableOpacity>
      </View>

      <SwipeListView
        data={targetContacts.map((contact, index) => ({ ...contact, key: `${index}` }))}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        previewRowKey={targetContacts.length > 0 ? '0' : null}
        previewOpenValue={-40}
        previewOpenDelay={1000}
        disableRightSwipe={false}
        keyExtractor={item => item.id + '_target'}
        ListEmptyComponent={renderEmptyListComponent} // Use the new empty component
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {targetContacts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleRandomSelect}
          activeOpacity={0.7}
          disabled={isLinking}
        >
          <Text style={styles.fabText}>Linkle!</Text>
        </TouchableOpacity>
      )}

      <Modal
        transparent={true}
        animationType="fade"
        visible={isLinking} 
        onRequestClose={() => setIsLinking(false)}
      >
        <View style={styles.lottieOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.lottieText}>Linkle하는중...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Original styles (to be used by the component)
const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    backgroundColor: '#FFFCF4',
    paddingTop: Constants.statusBarHeight, 
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    backgroundColor: '#FFFCF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C0',
  },
  headerButtonPlaceholder: { 
    width: 30, 
    padding: 5,
  },
  headerButtonRight: {
    padding: 5, 
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#4A4031',
  },
  list: {
    flexGrow: 1,
    backgroundColor: '#FFFCF4', // Ensure list background is also beige
  },
  contactItemFront: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20, 
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C0',
    backgroundColor: '#FFFCF4',
    height: 'auto', 
  },
  contactItemBack: { 
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactInfoWrapper: {
    flex: 1,
    marginRight: 10,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
    color: '#4A4031',
  },
  contactPhone: {
    fontSize: 13,
    color: '#7A705F',
  },
  emptyContainer: { // Container for empty state content
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFCF4',
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7A705F',
    marginBottom: 20, // Add some space above the image
  },
  emptyStateImage: {
    width: width * 0.6, // Adjust width as needed
    height: width * 0.6 * (3/4), // Assuming a 4:3 aspect ratio, adjust as needed
    resizeMode: 'contain',
  },
  chatIconButton: { 
    padding: 8,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75, 
  },
  backRightBtnRight: {
    backgroundColor: '#FF3B30',
    right: 0,
  },
  fab: {
    position: 'absolute',
    width: 150,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#B08D57',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 60,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lottieOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  }
});

export default SavedTargetsScreen; 