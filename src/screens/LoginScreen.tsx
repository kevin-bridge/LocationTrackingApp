import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import {useDispatch} from 'react-redux';
import Toast from 'react-native-toast-message';
import StorageService from '../services/StorageService';
import {setUser} from '../store/slices/authSlice';
import {API_ENDPOINTS} from '../config/api';
import {MMKV} from 'react-native-mmkv';
import ApiService from '../services/ApiService';
import {Colors, Spacing, BorderRadius, Typography, Shadows} from '../theme';

const storage = new MMKV();
const LAST_EMAIL_KEY = 'last_login_email';
const LAST_PASSWORD_KEY = 'last_login_password';

const LoginScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const dispatch = useDispatch();

  // Load last credentials when screen mounts
  useEffect(() => {
    const loadLastCredentials = () => {
      const lastEmail = storage.getString(LAST_EMAIL_KEY);
      const lastPassword = storage.getString(LAST_PASSWORD_KEY);

      if (lastEmail) setEmail(lastEmail);
      if (lastPassword) setPassword(lastPassword);
    };

    loadLastCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter email and password',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login with email:', email);
      const api = ApiService.getInstance();
      const response = await api.post(API_ENDPOINTS.AUTH.SIGNIN, {
        email,
        password,
      });

      const {access_token, id_token, refresh_token} = response.data;
      console.log('Login successful, fetching user profile...');

      // Fetch user profile using the id_token (not access_token)
      const userResponse = await api.get(API_ENDPOINTS.AUTH.ME, {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      });

      const user = userResponse.data;
      console.log('User profile fetched:', user.email);

      // Save tokens and user data
      await StorageService.saveAuthTokens(access_token, id_token, refresh_token);
      StorageService.saveUserData(user);
      dispatch(
        setUser({
          user,
          accessToken: access_token,
          idToken: id_token,
          refreshToken: refresh_token,
        }),
      );

      // Save credentials to local storage on successful login
      storage.set(LAST_EMAIL_KEY, email);
      storage.set(LAST_PASSWORD_KEY, password);

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Logged in as ${user.email}`,
        visibilityTime: 2000,
      });

      console.log('Login complete, navigating to Map');
      navigation.replace('Map');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = ApiService.getErrorMessage(error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tagline}>Track your journeys with ease</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                ]}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  passwordFocused && styles.inputFocused,
                ]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Signup')}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>📍</Text>
                </View>
                <Text style={styles.featureText}>Real-time tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>📊</Text>
                </View>
                <Text style={styles.featureText}>Journey history</Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  logo: {
    width: '85%',
    height: '85%',
  },
  tagline: {
    marginTop: Spacing.md,
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  welcomeText: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitleText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 56,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  button: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    fontSize: Typography.bodySmall,
    color: Colors.textTertiary,
  },
  secondaryButton: {
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxxl,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
});

export default LoginScreen;
