import { useUser } from "@clerk/clerk-expo";
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  StyleSheet, 
  Dimensions 
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function LeaveRequestScreen() {
  const { user } = useUser();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const submitLeave = async () => {
    if (!reason.trim() || !date.trim()) {
      setError("Please fill in all fields.");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setError("Please enter a valid date (YYYY-MM-DD).");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return;
    }

    try {
      const res = await fetch("https://main-admin-dashboard-orpin.vercel.app/api/manager-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user?.id, reason, date }),
      });
      if (res.ok) {
        setSuccess("Leave Requested Successfully!");
        setReason("");
        setDate("");
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => setSuccess(null), 2000);
        });
      } else {
        setError("Failed to submit leave request.");
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      setError("Network error. Please try again.");
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient 
        colors={['#ffedd5', '#fed7aa']} 
        style={styles.gradientBackground}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Request Leave</Text>

          {error && (
            <Animated.View style={[styles.alert, { opacity: fadeAnim }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#fff" style={styles.alertIcon} />
              <Text style={styles.alertText}>{error}</Text>
            </Animated.View>
          )}
          {success && (
            <Animated.View style={[styles.alert, { opacity: fadeAnim, backgroundColor: '#22c55e' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.alertIcon} />
              <Text style={styles.alertText}>{success}</Text>
            </Animated.View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={24} color="#f97316" style={styles.inputIcon} />
            <TextInput
              placeholder="Reason for Leave"
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setError(null);
              }}
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={24} color="#f97316" style={styles.inputIcon} />
            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              value={date}
              onChangeText={(text) => {
                setDate(text);
                setError(null);
              }}
              style={styles.input}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity 
            onPress={submitLeave} 
            style={styles.submitButton}
            disabled={!user}
          >
            <LinearGradient
              colors={['#f97316', '#ea580c']}
              style={styles.buttonGradient}
            >
              <Ionicons name="send-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Submit Request</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Manrope-Bold',
    color: '#1e293b',
    marginVertical: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    width: width * 0.9,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: '#1e293b',
    paddingVertical: 8,
  },
  submitButton: {
    width: width * 0.9,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope-Bold',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: width * 0.9,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    flex: 1,
  },
});
