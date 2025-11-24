import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { API_BASE } from '../config';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSendReset = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        setMessage(data?.message || "Failed to send reset email");
        setMessageType("error");
      } else {
        setMessage(
          data?.message ||
            "Password reset link sent to your email. Check your inbox!"
        );
        setMessageType("success");
        setStep(2);
        setEmail("");
      }
    } catch (err) { 
      setMessage("An error occurred. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setEmail("");
    setMessage("");
    setMessageType("");
    setStep(1);
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={!!isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                {step === 1 ? (
                  <>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                      Enter your email address and we'll send you a link to
                      reset your password.
                    </Text>

                    <TextInput
                      style={styles.input}
                      placeholder="yourname@gmail.com"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                    />

                    {message ? (
                      <Text
                        style={[
                          styles.message,
                          messageType === "error"
                            ? styles.messageError
                            : styles.messageSuccess,
                        ]}
                      >
                        {message}
                      </Text>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        isLoading && { opacity: 0.7 },
                      ]}
                      onPress={handleSendReset}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Send Reset Link
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleClose}
                      disabled={isLoading}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.successIconContainer}>
                      <Text style={styles.successIcon}>✓</Text>
                    </View>
                    <Text style={styles.title}>Check Your Email</Text>
                    <Text style={styles.subtitle}>
                      We've sent a password reset link to your email. Click the
                      link to create a new password. The link expires in 24
                      hours.
                    </Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleClose}
                    >
                      <Text style={styles.primaryButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#000",
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  messageError: {
    color: "#d9534f",
  },
  messageSuccess: {
    color: "#28a745",
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  successIcon: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
});
