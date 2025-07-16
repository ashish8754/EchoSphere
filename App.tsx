import React, { useEffect, useState } from 'react';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { store, RootState } from './src/store';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';

// Simple navigation state management for testing
type Screen = 'welcome' | 'login' | 'register' | 'home';

function AuthTestApp(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const { user, isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);

  // Simple navigation object for our auth screens
  const navigation = {
    navigate: (screen: string) => {
      if (screen === 'Login') setCurrentScreen('login');
      if (screen === 'Register') setCurrentScreen('register');
      if (screen === 'Home') setCurrentScreen('home');
    }
  };

  // Auto-navigate to home when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentScreen('home');
    }
  }, [isAuthenticated, user]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen navigation={navigation} />;
      case 'register':
        return <RegisterScreen navigation={navigation} />;
      case 'home':
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Welcome to EchoSphere!</Text>
            <Text style={styles.subtitle}>Hello, {user?.display_name}!</Text>
            <Text style={styles.description}>
              Authentication successful! 🎉
            </Text>
            <Text style={styles.userInfo}>
              Email: {user?.email}
            </Text>
            <Text style={styles.userInfo}>
              Boost Mode: {user?.boost_mode_enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                setCurrentScreen('welcome');
                // In a real app, we'd dispatch logout action here
              }}
            >
              <Text style={styles.buttonText}>Back to Welcome</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>EchoSphere</Text>
            <Text style={styles.subtitle}>Real connections, amplified on demand</Text>
            <Text style={styles.description}>
              Authentication system ready for testing! 🚀
            </Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error.message}</Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setCurrentScreen('login')}
              >
                <Text style={styles.buttonText}>Test Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setCurrentScreen('register')}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Registration</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.instructions}>
              Make sure to set up your Supabase credentials in .env file first!
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderScreen()}
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AuthTestApp />
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
    marginBottom: 24,
  },
  userInfo: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 32,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default App;
