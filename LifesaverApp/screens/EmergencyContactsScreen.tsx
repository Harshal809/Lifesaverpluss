import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export default function EmergencyContactsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', 'Failed to load contacts.');
    } else {
      setContacts((data || []) as Contact[]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.name || !form.phone) {
      Alert.alert('Validation', 'Name and phone are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            name: form.name,
            phone: form.phone,
            email: form.email,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('emergency_contacts').insert([
          {
            user_id: user.id,
            name: form.name,
            phone: form.phone,
            email: form.email,
          },
        ]);
        if (error) throw error;
      }

      setForm({ name: '', phone: '', email: '' });
      setEditingId(null);
      fetchContacts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    });
  };

  const handleRemove = async (id: string) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', 'Failed to remove contact.');
          } else {
            fetchContacts();
          }
        },
      },
    ]);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open dialer.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Contacts</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{editingId ? 'Update Contact' : 'Add New Contact'}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
          placeholder="Contact name"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
          placeholder="+91-XXXXXXXXXX"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email (optional)</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
          placeholder="example@email.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : editingId ? 'Update Contact' : 'Add Contact'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.listCard]}>
        <Text style={styles.sectionTitle}>Your Contacts ({contacts.length})</Text>
        {loading ? (
          <Text style={styles.mutedText}>Loading...</Text>
        ) : contacts.length === 0 ? (
          <Text style={styles.mutedText}>No emergency contacts yet. Add one above.</Text>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                {contact.email ? <Text style={styles.contactEmail}>{contact.email}</Text> : null}
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.callButton]}
                  onPress={() => handleCall(contact.phone)}
                >
                  <Text style={styles.smallButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.editButton]}
                  onPress={() => handleEdit(contact)}
                >
                  <Text style={styles.smallButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.removeButton]}
                  onPress={() => handleRemove(contact.id)}
                >
                  <Text style={styles.smallButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#ffe6e3',
  },
  backButtonText: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  listCard: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mutedText: {
    fontSize: 14,
    color: '#777',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactInfo: {
    flex: 1,
    paddingRight: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#555',
  },
  contactEmail: {
    fontSize: 13,
    color: '#777',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  callButton: {
    backgroundColor: '#27ae60',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
  },
});


