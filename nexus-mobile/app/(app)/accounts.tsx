import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { API_BASE_URL } from '../../src/constants/api';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../../src/constants/fetchWithAuth';
import ExpandableSection from '../../src/components/ExpandableSection';
import BottomNavigation from '../../src/components/BottomNavigation';
import { PRIMARY, TEXT } from '../../src/constants/colors';
import { Account } from '../../src/types';
import AccountHealthBar from '../../src/components/AccountHealthBar';
import BackArrowHeader from '../../src/components/BackArrowHeader';
import PlaidErrorBoundary from '../../src/components/PlaidErrorBoundary';
import { useAuth } from '../../src/context/AuthContext';

// Lazy load PlaidLink to avoid native module crashes during app initialization
const PlaidLink = Platform.OS === 'ios' ? require('react-native-plaid-link-sdk').default : null;

const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

interface PlaidLinkSuccessMetadata {
  publicToken: string;
  metadata: {
    institution?: {
      name?: string;
      institution_id?: string;
    };
    accounts?: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
  };
}

interface PlaidLinkExitMetadata {
  error?: {
    error_code?: string;
    error_message?: string;
    error_type?: string;
  };
  metadata: {
    institution?: {
      name?: string;
      institution_id?: string;
    };
    request_id?: string;
    link_session_id?: string;
  };
}

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [linkLoading, setLinkLoading] = useState(false);
  const auth = useAuth();
  const user = auth?.user;
  const userId = user?.id;

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !user) {
        setLoading(false);
        setError('Unable to load user session. Please try logging in again.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [loading, user]);

  const fetchAllData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError('User not properly authenticated');
      return;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/accounts?userId=${userId}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
      
      setError(''); // Clear any previous errors
    } catch (error) {
      setAccounts([]);
      setError('Failed to load financial data');
      console.warn('Failed to fetch account data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (user?.authenticated) {
      fetchAllData();
    } else if (user?.authenticated === false) {
      // User is explicitly not authenticated
      setLoading(false);
      setError('Please log in to view your accounts');
    }
    // If user is null, keep loading while AuthContext initializes
  }, [user, fetchAllData]);

  const handleLinkAccountPress = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'User not properly authenticated. Please log in again.');
      return;
    }

    // Check if we're on iOS and PlaidLink is available
    if (Platform.OS !== 'ios' || !PlaidLink) {
      Alert.alert('Error', 'Plaid Link is currently only supported on iOS devices.');
      return;
    }
    
    setLinkLoading(true);
    try {
      // 1. Fetch the link_token from your backend with better error handling
      const res = await fetchWithAuth(`${API_BASE_URL}/api/plaid/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!data || !data.link_token) {
        throw new Error(data.error || 'Failed to retrieve Plaid link token.');
      }
      
      // 2. Create Plaid session with proper error handling
      try {
        await PlaidLink.create({ token: data.link_token });
      } catch (createError) {
        throw new Error(`Failed to initialize Plaid Link: ${createError}`);
      }
      
      // 3. Open Plaid with enhanced error handling
      try {
        await PlaidLink.open({
          onSuccess: async (success: PlaidLinkSuccessMetadata) => {
            setLinkLoading(true);
            try {
              if (!success?.publicToken) {
                throw new Error('No public token received from Plaid');
              }
              
              const exchangeRes = await fetchWithAuth(`${API_BASE_URL}/api/plaid/exchange_public_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  public_token: success.publicToken, 
                  userId,
                  metadata: success.metadata
                }),
              });
              
              if (!exchangeRes.ok) {
                throw new Error(`Failed to exchange token: ${exchangeRes.status}`);
              }
              
              Alert.alert('Success!', `Your account has been linked${success.metadata?.institution?.name ? ` from ${success.metadata.institution.name}` : ''}.`);
              await fetchAllData();
            } catch (exchangeError) {
              console.error('Token exchange failed:', exchangeError);
              Alert.alert('Error', 'Could not complete account linking. Please try again.');
            } finally {
              setLinkLoading(false);
            }
          },
          onExit: (exit: PlaidLinkExitMetadata) => {
            setLinkLoading(false);
            if (exit?.error) {
              console.warn('Plaid Link exit with error:', exit.error);
              if (exit.error.error_type === 'InvalidRequestError' || 
                  exit.error.error_type === 'InstitutionError') {
                Alert.alert(
                  'Connection Error', 
                  exit.error.error_message || 'Unable to connect to your bank. Please try again later.'
                );
              }
            }
          }
        });
      } catch (openError) {
        throw new Error(`Failed to open Plaid Link: ${openError}`);
      }
    } catch (error: unknown) {
      console.error('Plaid Link error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while preparing Plaid.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLinkLoading(false);
    }
  }, [userId, fetchAllData]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 10, color: TEXT, textAlign: 'center' }}>
          Loading your financial data...
        </Text>
        {error && (
          <Text style={{ marginTop: 10, color: 'red', textAlign: 'center', fontSize: 14 }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <PlaidErrorBoundary>
      <BackArrowHeader />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <View style={styles.topRow}>
            <Text style={styles.pageTitle}>Accounts</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={[styles.payBtnCard, { backgroundColor: '#ff6b6b' }]}
                onPress={() => router.push('/debug-accounts')}
              >
                <Text style={styles.payBtnCardText}>Debug</Text>
              </TouchableOpacity>
              {accounts.length > 0 && (
                <TouchableOpacity
                  style={styles.payBtnCard}
                  onPress={() => router.push('/(app)/pay')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.payBtnCardText}>Pay Cards</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {accounts.length > 0 ? (
            <ExpandableSection
              data={accounts}
              initialCount={5}
              title=""
              renderItem={(item: Account) => (
                <View key={item.id} style={styles.accountCard}>
                  <View style={styles.accountCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountName}>{item.name}</Text>
                      <Text style={styles.accountNumber}>•••• {item.mask || item.last4 || 'XXXX'}</Text>
                      <Text style={styles.accountTypeLabel}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Account'}</Text>
                    </View>
                    <Text style={styles.accountBalance}>{formatCurrency(item.balance)}</Text>
                  </View>
                  {(item.type === 'credit' || item.type === 'loan') && item.apr && item.apr > 0 && (
                    <View style={styles.metricsRow}>
                      <Text style={styles.metricText}>APR: {item.apr}%</Text>
                    </View>
                  )}
                  {item.type === 'credit' && item.creditLimit && item.creditLimit > 0 && (
                    <View style={styles.healthBarRow}>
                      <AccountHealthBar value={(item.balance / item.creditLimit) * 100} />
                      <Text style={styles.healthLabel}>{((item.balance / item.creditLimit) * 100).toFixed(0)}% Util.</Text>
                    </View>
                  )}
                </View>
              )}
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              {/* Debug info */}
              <Text style={[styles.emptyStateText, { fontSize: 12, marginBottom: 10 }]}>
                Debug: accounts={accounts.length}, loading={loading.toString()}, userId={userId || 'missing'}, authenticated={user?.authenticated?.toString()}
              </Text>
              
              {error ? (
                <>
                  <Text style={styles.emptyStateText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.linkAccountBtn}
                    onPress={() => {
                      setError('');
                      if (user?.authenticated && userId) {
                        fetchAllData();
                      }
                    }}
                  >
                    <Text style={styles.linkAccountBtnText}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.emptyStateText}>No accounts linked. Link an account to get started.</Text>
                  <TouchableOpacity
                    style={styles.linkAccountBtn}
                    onPress={handleLinkAccountPress}
                    disabled={linkLoading || !userId}
                  >
                    <Text style={styles.linkAccountBtnText}>
                      {linkLoading ? 'Preparing...' : 'Link Account'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    </PlaidErrorBoundary>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT,
  },
  payBtnCard: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  payBtnCardText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  accountTypeLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metricText: {
    fontSize: 14,
    color: '#6c757d',
  },
  healthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  healthLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
  linkAccountBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 16,
  },
  linkAccountBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 