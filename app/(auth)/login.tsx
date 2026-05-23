import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Forgot password handler
  const handleForgotPassword = async () => {
    // Prevent multiple requests
    if (loading || cooldown > 0) return;

    // Validate email
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);

      /**
       * Replace this with actual API call if needed
       * Example:
       * await supabase.auth.resetPasswordForEmail(email);
       */

      await fakeResetPasswordApi();

      Alert.alert(
        'Success',
        'Password reset email sent successfully.'
      );

      // Start cooldown
      setCooldown(30);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to send password reset email.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Temporary mock API
  const fakeResetPasswordApi = async () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Enter email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[
          styles.button,
          (loading || cooldown > 0) && styles.disabledButton,
        ]}
        disabled={loading || cooldown > 0}
        onPress={handleForgotPassword}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {cooldown > 0
              ? `Retry in ${cooldown}s`
              : 'Forgot Password?'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#132f4c',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});