import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase/supabaseClient';
import { API_BASE } from '../config';

const PRESET_REASONS = [
  { code: 'spam', label: 'Spam or misleading' },
  { code: 'harassment', label: 'Harassment or hate' },
  { code: 'scam', label: 'Scams or fraud' },
  { code: 'ip_violation', label: 'Intellectual property violation' },
  { code: 'prohibited_item', label: 'Prohibited or restricted item' },
  { code: 'fake_item', label: 'Counterfeit / inauthentic' },
  { code: 'wrong_category', label: 'Wrong category / tagging' },
  { code: 'privacy', label: 'Privacy / personal data exposure' },
  { code: 'other', label: 'Other' },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  defaultReason = '',
  defaultDetails = '',
  onSubmitted,
}) {
  const [reasonOption, setReasonOption] = useState('spam');
  const [customReason, setCustomReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  // Initialize defaults when opening
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
      setLoading(false);
      if (defaultReason) {
        const preset = PRESET_REASONS.find((r) => r.code === defaultReason);
        if (preset) {
          setReasonOption(defaultReason);
          setCustomReason('');
        } else {
          setReasonOption('other');
          setCustomReason(defaultReason);
        }
      } else {
        setReasonOption('spam');
        setCustomReason('');
      }
      setDetails(defaultDetails || '');
    }
  }, [isOpen, defaultReason, defaultDetails]);

  const submit = async () => {
    try {
      setError('');
      setSuccess(false);
      setLoading(true);

      const finalReason = reasonOption === 'other' ? customReason.trim() : reasonOption;
      if (!finalReason && !details.trim()) {
        setError('Please provide a reason or details.');
        setLoading(false);
        return;
      }

      // Get auth token from Supabase
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      const refreshToken = data?.session?.refresh_token;

      if (!accessToken) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': `access_token=${accessToken}; refresh_token=${refreshToken}`,
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: finalReason || null,
          details: details?.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        if (res.status === 409) {
          setError(json?.error || 'You already have an open report for this item.');
        } else {
          setError(json?.error || `Failed to submit report (HTTP ${res.status})`);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      onSubmitted?.(json.data);
      // Close after slight delay
      setTimeout(() => onClose?.(), 800);
    } catch (e) {
      setError(e?.message || 'Failed to submit report');
      setLoading(false);
    }
  };

  const selectedReasonLabel = PRESET_REASONS.find((r) => r.code === reasonOption)?.label || 'Select reason';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Report Content</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Reason Section */}
            <View style={styles.group}>
              <Text style={styles.label}>Reason</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                disabled={loading}
              >
                <Text style={styles.dropdownText}>{selectedReasonLabel}</Text>
                <Ionicons
                  name={showReasonDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#7b7f86"
                />
              </TouchableOpacity>

              {showReasonDropdown && (
                <ScrollView style={styles.dropdownMenu} scrollEnabled nestedScrollEnabled>
                  {PRESET_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.code}
                      style={[
                        styles.dropdownItem,
                        reasonOption === reason.code && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setReasonOption(reason.code);
                        setShowReasonDropdown(false);
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          reasonOption === reason.code && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {reasonOption === 'other' && (
                <TextInput
                  style={styles.input}
                  placeholder="Type a short summary"
                  value={customReason}
                  onChangeText={setCustomReason}
                  maxLength={200}
                  editable={!loading}
                  placeholderTextColor="#aaa"
                />
              )}
            </View>

            {/* Details Section */}
            <View style={styles.group}>
              <Text style={styles.label}>Details (optional)</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Add more context (links, timestamps, what happened)"
                value={details}
                onChangeText={setDetails}
                maxLength={5000}
                editable={!loading}
                multiline
                numberOfLines={5}
                placeholderTextColor="#aaa"
              />
              <Text style={styles.hint}>{details.length}/5000</Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>Report submitted. Thank you.</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Divider */}
          <View style={styles.footerDivider} />

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#A68C7B" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '70%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  group: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#7b7f86',
    textTransform: 'uppercase',
    letterSpacing: 0.06,
    marginBottom: 8,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e6e6ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#e6e6ea',
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: '#fff',
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF5EB',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#A68C7B',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#e6e6ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    textAlign: 'right',
    fontSize: 12,
    color: '#8a8f98',
    marginTop: 6,
  },
  errorBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: 8,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    fontWeight: '500',
  },
  successBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#c3e6cb',
    borderRadius: 8,
  },
  successText: {
    color: '#1e7e34',
    fontSize: 13,
    fontWeight: '500',
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#dfe3e8',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#A68C7B',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#A68C7B',
    borderWidth: 1,
    borderColor: '#A68C7B',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
