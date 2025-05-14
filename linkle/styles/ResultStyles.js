import { StyleSheet } from 'react-native';

export const resultStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#222',
  },
  item: {
    fontSize: 16,
    marginVertical: 5,
    color: '#222',
  },
  selectedItem: {
    fontSize: 16,
    marginVertical: 5,
    color: '#007AFF',
  },
  resultText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
  },
}); 