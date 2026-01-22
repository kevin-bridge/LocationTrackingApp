import React, {useState} from 'react';
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
import Toast from 'react-native-toast-message';
import {API_ENDPOINTS} from '../config/api';
import {ConfirmSignupRequest} from '../types';
import ApiService from '../services/ApiService';
import {Colors, Spacing, BorderRadius, Typography, Shadows} from '../theme';

const ConfirmSignupScreen = ({navigation, route}: any) => {
  const {email} = route.params || {};
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  const handleConfirm = async () => {
    if (!confirmationCode) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the confirmation code',
      });
      return;
    }

    setIsLoading(true);
    try {
      const confirmData: ConfirmSignupRequest = {
        email,
        confirmation_code: confirmationCode,
      };

      console.log('Attempting to confirm signup for:', email);
      const api = ApiService.getInstance();
      await api.post(API_ENDPOINTS.AUTH.CONFIRM_SIGNUP, confirmData);

      console.log('Confirmation successful');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account confirmed! You can now sign in.',
        visibilityTime: 3000,
        onHide: () => {
          navigation.navigate('Login');
        },
      });
    } catch (error: any) {
      console.error('Confirmation error:', error);
      const errorMessage = ApiService.getErrorMessage(error);
      Toast.show({
        type: 'error',
        text1: 'Confirmation Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      console.log('Resending confirmation code to:', email);
      const api = ApiService.getInstance();
      await api.post(API_ENDPOINTS.AUTH.RESEND_CONFIRMATION, {email});

      console.log('Confirmation code resent successfully');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Confirmation code has been resent to your email.',
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      const errorMessage = ApiService.getErrorMessage(error);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Icon Section */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📧</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmation Code</Text>
              <TextInput
                style={[
                  styles.codeInput,
                  codeFocused && styles.inputFocused,
                ]}
                placeholder="000000"
                placeholderTextColor={Colors.textTertiary}
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                editable={!isLoading && !isResending}
                maxLength={6}
                onFocus={() => setCodeFocused(true)}
                onBlur={() => setCodeFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={isLoading || isResending}
              activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Verify Account</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={isLoading || isResending}
                activeOpacity={0.7}>
                {isResending ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <Text style={styles.resendButtonText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Back to Sign In */}
            <TouchableOpacity
              style={styles.backToSignIn}
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading || isResending}
              activeOpacity={0.7}>
              <Text style={styles.backToSignInText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityIconText}>🔒</Text>
            </View>
            <Text style={styles.securityText}>
              Your information is secure and encrypted
            </Text>
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
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 36,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emailText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  formSection: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  codeInput: {
    height: 64,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: 28,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 12,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  button: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
  resendSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  resendText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  resendButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  resendButtonText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  backToSignIn: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backToSignInText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: Spacing.sm,
  },
  securityIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityIconText: {
    fontSize: 14,
  },
  securityText: {
    fontSize: Typography.caption,
    color: Colors.textTertiary,
  },
});

export default ConfirmSignupScreen;
