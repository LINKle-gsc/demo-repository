import { StyleSheet } from 'react-native';

export const baseText = {
  fontFamily: 'System',
  color: '#222',
};

export const baseInput = {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 5,
  backgroundColor: '#fff',
  color: '#222',
  fontSize: 18,
  padding: 10,
};

export const baseContainer = {
  flex: 1,
  backgroundColor: '#fff',
};

export const commonStyles = StyleSheet.create({
  container: {
    ...baseContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...baseInput,
    marginBottom: 20,
    width: 250,
  },
  title: {
    ...baseText,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
}); 