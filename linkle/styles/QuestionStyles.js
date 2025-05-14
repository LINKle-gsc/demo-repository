import { StyleSheet } from 'react-native';

const baseText = {
  fontFamily: 'System',
  color: '#222',
};

const baseInput = {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 5,
  backgroundColor: '#fff',
  color: '#222',
  fontSize: 18,
  padding: 10,
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  question: {
    ...baseText,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    ...baseInput,
    marginBottom: 20,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    ...baseText,
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  item: {
    ...baseText,
    fontSize: 16,
    marginVertical: 5,
  },
  selectedItem: {
    ...baseText,
    fontSize: 16,
    marginVertical: 5,
    color: '#007AFF',
  },
  resultText: {
    ...baseText,
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
  },
}); 