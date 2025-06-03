import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import axios from 'axios';

export default function QrScreen() {
  const { id } = useLocalSearchParams(); // visit request ID
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`https://main-admin-dashboard-orpin.vercel.app/api/visit-requests/${id}`)
      .then((res) => setVisit(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!visit || visit.status !== 'APPROVED') {
    return <Text className="text-center mt-20">QR not available or not approved yet.</Text>;
  }

  return (
    <View className="items-center justify-center p-6">
      <Text className="text-lg font-bold mb-4">Your Visit QR Code</Text>
      <Image
        source={{ uri: visit.qrCode }}
        style={{ width: 250, height: 250 }}
      />
      <Text className="mt-4 text-gray-500">
        Expires at: {new Date(visit.expiresAt).toLocaleString()}
      </Text>
    </View>
  );
}
