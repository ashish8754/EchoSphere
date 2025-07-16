import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { store } from './src/store';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.content}>
          <Text style={styles.title}>EchoSphere</Text>
          <Text style={styles.subtitle}>Real connections, amplified on demand</Text>
          <Text style={styles.description}>
            Project foundation setup complete! 🎉
          </Text>
        </View>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

export default App;
