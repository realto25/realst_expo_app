import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";

interface Land {
  id: string;
  number: string;
  status: string;
}

interface BuyRequestForm {
  name: string;
  phone: string;
  message: string;
  selectedLandId: string | null;
}

interface BuyRequestModalProps {
  visible: boolean;
  onClose: () => void;
  lands: Land[];
}

const BuyRequestModal: React.FC<BuyRequestModalProps> = ({
  visible,
  onClose,
  lands,
}) => {
  const { user } = useUser();
  const [formData, setFormData] = useState<BuyRequestForm>({
    name: user?.fullName || "",
    phone: user?.phoneNumbers[0]?.phoneNumber || "",
    message: "",
    selectedLandId: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const availableLands = lands.filter((land) => land.status === "AVAILABLE");

  const handleSubmitRequest = async () => {
    if (!formData.name || !formData.phone || !formData.selectedLandId) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://192.168.29.85:3000/api/buy-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      alert("Buy request submitted!");
      setFormData({
        name: user?.fullName || "",
        phone: user?.phoneNumbers[0]?.phoneNumber || "",
        message: "",
        selectedLandId: null,
      });
      onClose();
    } catch (error) {
      alert("Error submitting request.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg font-bold">Buy Request</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Available Lands */}
            <Text className="text-base font-semibold mb-2">Select a Land *</Text>
            {availableLands.map((land) => (
              <TouchableOpacity
                key={land.id}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, selectedLandId: land.id }))
                }
                className={`border rounded-lg p-3 mb-2 ${
                  formData.selectedLandId === land.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <Text className="font-medium text-gray-800">
                  Land No: {land.number}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Name */}
            <Text className="text-gray-600 mt-4 mb-1">Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
            />

            {/* Phone */}
            <Text className="text-gray-600 mt-4 mb-1">Phone Number *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, phone: text }))
              }
            />

            {/* Message */}
            <Text className="text-gray-600 mt-4 mb-1">Message</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 h-24 text-left"
              placeholder="Write a message (optional)"
              multiline
              textAlignVertical="top"
              value={formData.message}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, message: text }))
              }
            />

            {/* Submit */}
            <TouchableOpacity
              className="bg-blue-600 mt-6 p-4 rounded-lg"
              onPress={handleSubmitRequest}
              disabled={submitting}
            >
              <Text className="text-white text-center font-semibold text-base">
                {submitting ? "Submitting..." : "Submit Buy Request"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BuyRequestModal;
