import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn } = useAuth();

  const validateEmailExpression = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!validateEmailExpression(email)) {
        setErrorMessage('Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !validateEmailExpression(email)) {
      setErrorMessage('Please enter a valid email address to reset password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('Password reset link sent to your email!');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GridShare</Text>
        <Text style={styles.subtitle}>Peer-to-Peer Energy Trading</Text>
      </View>

      <View style={styles.form}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',  
  },
  form: {
    gap: 16,
    width: '100%',        
    maxWidth: 400,        
    alignSelf: 'center', 
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
   
    minHeight: 52,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
   
    minHeight: 52,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
   
    minHeight: 48,
  },
  linkText: {
    color: '#10b981',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#7f1d1d30',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef444450',
    marginBottom: 8,
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#10b98130',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b98150',
    marginBottom: 8,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
