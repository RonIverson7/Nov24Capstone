import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase/supabaseClient';
import { API_BASE } from '../config';

const PaymentMethodModal = ({ visible, onClose, onSave, currentMethod }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [method, setMethod] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [mayaNumber, setMayaNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

  const bankOptions = [
    'BDO',
    'BPI',
    'Metrobank',
    'UnionBank',
    'Landbank',
    'PNB',
    'Security Bank',
    'RCBC',
    'Chinabank',
    'EastWest',
  ];

  // Load current payment method when modal opens
  useEffect(() => {
    if (visible && currentMethod) {
      setMethod(currentMethod.method || '');
      setGcashNumber(currentMethod.gcashNumber || '');
      setMayaNumber(currentMethod.mayaNumber || '');
      setBankName(currentMethod.bankName || '');
      setBankAccountName(currentMethod.bankAccountName || '');
      setBankAccountNumber(currentMethod.bankAccountNumber || '');
      setError('');
    }
  }, [visible, currentMethod]);

  const maskPhone = (v) => {
    if (!v) return '';
    const digits = String(v).replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, digits.length - 4).replace(/\d/g, '•')}${digits.slice(-4)}`;
  };

  const maskAccount = (v) => {
    if (!v) return '';
    const digits = String(v).replace(/\s/g, '');
    if (digits.length <= 4) return digits;
    return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  };

  const validateForm = () => {
    if (!method) {
      setError('Please select a payout method');
      return false;
    }
    if (method === 'gcash' && !gcashNumber.trim()) {
      setError('Please enter your GCash number');
      return false;
    }
    if (method === 'maya' && !mayaNumber.trim()) {
      setError('Please enter your Maya number');
      return false;
    }
    if (method === 'bank') {
      if (!bankName || !bankAccountName.trim() || !bankAccountNumber.trim()) {
        setError('Please complete your bank details');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');

      // Get auth token from Supabase
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const payload = { paymentMethod: method };
      if (method === 'gcash') payload.gcashNumber = gcashNumber.trim();
      if (method === 'maya') payload.mayaNumber = mayaNumber.trim();
      if (method === 'bank') {
        payload.bankName = bankName;
        payload.bankAccountName = bankAccountName.trim();
        payload.bankAccountNumber = bankAccountNumber.trim();
      }

      const response = await fetch(`${API_BASE}/payouts/payment-info`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save payment method');
      }

      Alert.alert('Success', 'Payment method saved successfully');
      onSave && onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save payment method');
      Alert.alert('Error', err.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    if (!method) return false;
    if (method === 'gcash') return !!gcashNumber.trim();
    if (method === 'maya') return !!mayaNumber.trim();
    if (method === 'bank') return !!bankName && !!bankAccountName.trim() && !!bankAccountNumber.trim();
    return false;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Method</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Payout Method</Text>
              <View style={styles.methodOptions}>
                {[
                  { value: 'gcash', label: 'GCash (PH)', icon: 'phone-portrait' },
                  { value: 'maya', label: 'Maya (PH)', icon: 'phone-portrait' },
                  { value: 'bank', label: 'Bank Transfer', icon: 'business' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.methodOption,
                      method === opt.value && styles.methodOptionActive,
                    ]}
                    onPress={() => setMethod(opt.value)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={24}
                      color={method === opt.value ? '#A68C7B' : '#999'}
                    />
                    <Text
                      style={[
                        styles.methodOptionText,
                        method === opt.value && styles.methodOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {method === opt.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#A68C7B" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* GCash Details */}
            {method === 'gcash' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>GCash Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09XXXXXXXXX"
                  keyboardType="phone-pad"
                  value={gcashNumber}
                  onChangeText={setGcashNumber}
                  editable={!saving}
                />
                {gcashNumber && (
                  <Text style={styles.maskedText}>
                    Masked: {maskPhone(gcashNumber)}
                  </Text>
                )}
              </View>
            )}

            {/* Maya Details */}
            {method === 'maya' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Maya Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09XXXXXXXXX"
                  keyboardType="phone-pad"
                  value={mayaNumber}
                  onChangeText={setMayaNumber}
                  editable={!saving}
                />
                {mayaNumber && (
                  <Text style={styles.maskedText}>
                    Masked: {maskPhone(mayaNumber)}
                  </Text>
                )}
              </View>
            )}

            {/* Bank Details */}
            {method === 'bank' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bank Details</Text>

                <Text style={styles.label}>Bank Name</Text>
                <TouchableOpacity 
                  style={styles.bankSelectButton}
                  onPress={() => setShowBankPicker(true)}
                  disabled={saving}
                >
                  <Text style={[styles.bankSelectText, !bankName && styles.bankSelectPlaceholder]}>
                    {bankName || 'Select a bank'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <Text style={styles.label}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name on account"
                  value={bankAccountName}
                  onChangeText={setBankAccountName}
                  editable={!saving}
                />

                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bank account number"
                  keyboardType="numeric"
                  value={bankAccountNumber}
                  onChangeText={setBankAccountNumber}
                  editable={!saving}
                />
                {bankAccountNumber && (
                  <Text style={styles.maskedText}>
                    Masked: {maskAccount(bankAccountNumber)}
                  </Text>
                )}
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#2196F3" />
              <Text style={styles.infoText}>
                Your payment information is encrypted and secure. We only use it to send your earnings.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!isFormValid() || saving) && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!isFormValid() || saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Payment Method</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={[styles.bankPickerOverlay, { paddingTop: insets.top }]}>
          <View style={styles.bankPickerHeader}>
            <TouchableOpacity onPress={() => setShowBankPicker(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.bankPickerTitle}>Select Bank</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.bankPickerList} showsVerticalScrollIndicator={false}>
            {bankOptions.map((bank) => (
              <TouchableOpacity
                key={bank}
                style={[
                  styles.bankPickerItem,
                  bankName === bank && styles.bankPickerItemActive,
                ]}
                onPress={() => {
                  setBankName(bank);
                  setShowBankPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.bankPickerItemText,
                    bankName === bank && styles.bankPickerItemTextActive,
                  ]}
                >
                  {bank}
                </Text>
                {bankName === bank && (
                  <Ionicons name="checkmark" size={24} color="#A68C7B" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  methodOptions: {
    gap: 12,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  methodOptionActive: {
    borderColor: '#A68C7B',
    backgroundColor: '#faf6f3',
  },
  methodOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
  },
  methodOptionTextActive: {
    color: '#A68C7B',
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  bankSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  bankSelectText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bankSelectPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  maskedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#A68C7B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Bank Picker Styles
  bankPickerOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bankPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bankPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  bankPickerList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bankPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bankPickerItemActive: {
    backgroundColor: '#faf6f3',
    borderColor: '#A68C7B',
  },
  bankPickerItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  bankPickerItemTextActive: {
    color: '#A68C7B',
    fontWeight: '600',
  },
});

export default PaymentMethodModal;
