import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { authService } from '../../services/supabaseAuthService';
import { AuthValidation } from '../../services/authService';
import { setUser, setLoading, setError } from '../../store/slices/authSlice';

interface RegisterScreenProps {
  navigation: any; // We'll type this properly when we add navigation
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Email validation
    if (!AuthValidation.validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    const passwordValidation = AuthValidation.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Display name validation
    if (!AuthValidation.validateDisplayName(formData.displayName)) {
      errors.push('Display name must be between 2 and 50 characters');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        display_name: formData.displayName,
      });

      dispatch(setUser(result.user));

      if (result.needsVerification) {
        Alert.alert(
          'Registration Successful',
          'Please check your email to verify your account before signing in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('EmailVerification', { email: formData.email }),
            },
          ]
        );
      } else {
        Alert.alert('Registration Successful', 'Welcome to EchoSphere!');
      }
    } catch (error: any) {
      dispatch(setError({
        message: error.message || 'Registration failed',
        code: error.code,
        status: error.status,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResendVerification = async () => {
    if (!AuthValidation.validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await authService.resendVerification(formData.email);
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Join EchoSphere</Text>
          <Text style={styles.subtitle}>Create your account for authentic connections</Text>
        </View>

        <View style={styles.form}>
          {/* Display Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={formData.displayName}
              onChangeText={(text) => setFormData({ ...formData, displayName: text })}
              placeholder="Enter your display name"
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text.toLowerCase() })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <View style={styles.errorContainer}>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {/* API Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Resend Verification */}
          <TouchableOpacity style={styles.resendButton} onPress={handleResendVerification}>
            <Text style={styles.resendButtonText}>Resend Verification Email</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordToggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#666666',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});