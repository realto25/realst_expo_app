
import { useAuth, useUser } from "@clerk/clerk-expo";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { getOwnedLands, submitSellRequest } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";

interface Land {
  id: string;
  name: string;
  location: string;
  size: number;
  estimatedMarketValue?: number;
}

interface Document {
  uri: string;
  name: string;
  type: string;
  size: number;
}

const urgencyOptions: { label: string; value: string }[] = [
  { label: "LOW\n6+ months", value: "low" },
  { label: "NORMAL\n3-6 months", value: "normal" },
  { label: "HIGH\nASAP", value: "high" },
];

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DESCRIPTION_LENGTH = 500;

export default function Sell() {
  const { user } = useUser();
  const { userId: clerkId } = useAuth();
  const router = useRouter();
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [askingPrice, setAskingPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("normal");
  const [agentAssistance, setAgentAssistance] = useState<boolean>(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLands = useCallback(async () => {
    if (!clerkId) {
      setError("User not authenticated. Please log in.");
      router.replace("/(auth)/sign-in");
      return;
    }

    try {
      setError(null);
      const data = await getOwnedLands(clerkId);
      console.log("Fetched lands:", data);
      const validLands = (data ?? []).filter((land) => {
        if (!land.id || !land.name || !land.location || !land.size) {
          console.warn("Invalid land object:", land);
          return false;
        }
        return true;
      });
      setLands(validLands);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load properties.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage, [
        { text: "Retry", onPress: () => fetchLands() },
        { text: "Go to Home", onPress: () => router.push("/(client)/(tabs)/Home") },
      ]);
    } finally {
      setLoading(false);
    }
  }, [clerkId, router]);

  useEffect(() => {
    if (!user || !clerkId) {
      router.replace("/(auth)/sign-in");
    } else {
      fetchLands();
    }
  }, [user, clerkId, fetchLands]);

  const pickDocument = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const validDocs = result.assets.filter((asset) => {
          if (asset.size && asset.size > MAX_DOCUMENT_SIZE) {
            Alert.alert("Error", `${asset.name} exceeds 10MB limit.`);
            return false;
          }
          return true;
        });

        const newDocs: Document[] = validDocs.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
          size: asset.size ?? 0,
        }));
        setDocuments((prev) => [...prev, ...newDocs]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (uri: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!selectedLand) {
      Alert.alert("Error", "Please select a property.");
      return;
    }
    if (!askingPrice || isNaN(Number(askingPrice)) || Number(askingPrice) <= 0) {
      Alert.alert("Error", "Please enter a valid asking price.");
      return;
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      Alert.alert("Error", `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    if (!termsAgreed) {
      Alert.alert("Error", "Please agree to the Terms & Conditions.");
      return;
    }

    Alert.alert(
      "Confirm",
      "Are you sure you want to submit this sell request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setSubmitting(true);
            try {
              await submitSellRequest({
                userId: clerkId!,
                landId: selectedLand.id,
                askingPrice: Number(askingPrice),
                urgency,
                description,
                agentAssistance,
                documents,
              });
              Alert.alert("Success", "Sell request submitted successfully!", [
                { text: "OK", onPress: () => router.push("/(client)/(tabs)/Home") },
              ]);
              setSelectedLand(null);
              setAskingPrice("");
              setDescription("");
              setUrgency("normal");
              setAgentAssistance(false);
              setDocuments([]);
              setTermsAgreed(false);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Failed to submit sell request.";
              Alert.alert("Error", errorMessage, [
                { text: "OK" },
                { text: "Retry", onPress: () => handleSubmit() },
              ]);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-gray-700 mt-2 text-lg">Loading your properties...</Text>
      </View>
    );
  }

  if (error && lands.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 p-4">
        <Text className="text-red-500 text-lg text-center mb-4">{error}</Text>
        <View className="flex-row space-x-4">
          <Text
            className="text-orange-600 underline"
            onPress={fetchLands}
            accessibilityRole="button"
            accessibilityLabel="Retry loading properties"
          >
            Retry
          </Text>
          <Text
            className="text-orange-600 underline"
            onPress={() => router.push("/(client)/(tabs)/Home")}
            accessibilityRole="button"
            accessibilityLabel="Explore properties"
          >
            Add Property
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-100 p-4"
      contentContainerStyle={{ paddingBottom: 20 }}
      accessibilityLabel="Request to sell plot form"
    >
      <Text
        className="text-2xl font-bold mb-2 text-gray-900"
        accessibilityRole="header"
        accessibilityLabel="Request to Sell Plot"
      >
        Request to Sell Plot
      </Text>

      <View className="bg-orange-50 border border-orange-300 rounded-lg p-3 mb-4">
        <Text className="text-orange-600 text-sm">
          Create a sell request for your property. Our team will review your request and connect you with potential buyers or assist with the selling process.
        </Text>
      </View>

      {/* Select Property */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Select Property</Text>
        <Text className="text-sm text-gray-700 mb-2">Choose which property you want to sell</Text>
        {lands.length === 0 ? (
          <Text className="text-red-500 mt-1">
            No properties available. Add a property to start selling.
          </Text>
        ) : (
          lands.map((land, index) => {
            if (typeof land.estimatedMarketValue !== "number") {
              console.warn(`Land at index ${index} has undefined estimatedMarketValue:`, land);
            }
            return (
              <TouchableOpacity
                key={land.id}
                className={`bg-white border rounded-lg p-4 mb-2 flex-row items-center ${
                  selectedLand?.id === land.id ? "border-orange-500" : "border-gray-300"
                }`}
                onPress={() => setSelectedLand(land)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${land.name} at ${land.location}`}
                accessibilityHint="Selects this property for selling"
                disabled={submitting}
              >
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{land.name}</Text>
                  <Text className="text-gray-600 text-sm">{land.location}</Text>
                  <Text className="text-gray-600 text-sm">
                    Size: {land.size} sqft | Est. Value: ₹
                    {typeof land.estimatedMarketValue === "number"
                      ? land.estimatedMarketValue.toLocaleString()
                      : "N/A"}
                  </Text>
                </View>
                {selectedLand?.id === land.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Asking Price */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Asking Price</Text>
        <Text className="text-sm text-gray-700 mb-2">Set your desired selling price (in INR)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3"
          value={askingPrice}
          onChangeText={setAskingPrice}
          keyboardType="numeric"
          placeholder="Enter asking price (e.g., 1000000)"
          accessibilityLabel="Asking price input"
          editable={!submitting}
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Description</Text>
        <Text className="text-sm text-gray-700 mb-2">
          Provide details about the property (max {MAX_DESCRIPTION_LENGTH} characters)
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 h-24"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Describe the property, location benefits, etc."
          accessibilityLabel="Property description input"
          maxLength={MAX_DESCRIPTION_LENGTH}
          editable={!submitting}
        />
        <Text className="text-gray-500 text-sm mt-1">
          {description.length}/{MAX_DESCRIPTION_LENGTH}
        </Text>
      </View>

      {/* Urgency */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Urgency</Text>
        <Text className="text-sm text-gray-700 mb-2">How quickly do you want to sell?</Text>
        <View className="flex-row justify-between">
          {urgencyOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-1 border rounded-lg p-3 mx-1 text-center ${
                urgency === option.value ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-white"
              }`}
              onPress={() => setUrgency(option.value)}
              accessibilityRole="button"
              accessibilityLabel={`Set urgency to ${option.label}`}
              disabled={submitting}
            >
              <Text
                className={`text-sm font-semibold ${
                  urgency === option.value ? "text-orange-600" : "text-gray-700"
                }`}
                style={{ textAlign: "center" }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Agent Assistance */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Agent Assistance</Text>
        <Text className="text-sm text-gray-700 mb-2">
          Would you like assistance from our real estate agent?
        </Text>
        <View className="flex-row items-center justify-between bg-white border border-gray-300 rounded-lg p-3">
          <Text className="text-gray-900">Request Agent Assistance</Text>
          <Switch
            value={agentAssistance}
            onValueChange={setAgentAssistance}
            trackColor={{ false: "#d1d5db", true: "#f97316" }}
            thumbColor={agentAssistance ? "#ffffff" : "#f4f4f5"}
            accessibilityLabel="Toggle agent assistance"
            disabled={submitting}
          />
        </View>
      </View>

      {/* Documents */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Documents</Text>
        <Text className="text-sm text-gray-700 mb-2">
          Upload property documents (PDF or images, max 10MB each)
        </Text>
        <TouchableOpacity
          className={`bg-orange-500 rounded-lg p-3 flex-row items-center justify-center ${
            uploading || submitting ? "opacity-50" : ""
          }`}
          onPress={pickDocument}
          disabled={uploading || submitting}
          accessibilityRole="button"
          accessibilityLabel="Upload documents"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
          )}
          <Text className="text-white font-semibold ml-2">
            {uploading ? "Uploading..." : "Upload Documents"}
          </Text>
        </TouchableOpacity>
        {documents.length > 0 && (
          <View className="mt-2">
            {documents.map((doc) => (
              <View
                key={doc.uri}
                className="bg-white border border-gray-300 rounded-lg p-3 mt-2 flex-row items-center justify-between"
              >
                <Text className="text-gray-900 flex-1" numberOfLines={1}>
                  {doc.name}
                </Text>
                <TouchableOpacity
                  onPress={() => removeDocument(doc.uri)}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${doc.name}`}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Terms & Conditions */}
      <View className="mb-4">
        <View className="flex-row items-center bg-white border border-gray-300 rounded-lg p-3">
          <Switch
            value={termsAgreed}
            onValueChange={setTermsAgreed}
            trackColor={{ false: "#d1d5db", true: "#f97316" }}
            thumbColor={termsAgreed ? "#ffffff" : "#f4f4f5"}
            accessibilityLabel="Agree to terms and conditions"
            disabled={submitting}
          />
          <Text className="text-gray-900 ml-2 flex-1">
            I agree to the{" "}
            <Text
              className="text-orange-600 underline"
              onPress={() => Alert.alert("Terms", "View Terms & Conditions here. (Mock)")}
            >
              Terms & Conditions
            </Text>
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-orange-600 rounded-lg p-4 flex-row items-center justify-center ${
          submitting ? "opacity-50" : ""
        }`}
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Submit sell request"
      >
        {submitting ? (
          <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="paper-plane-outline" size={20} color="white" />
        )}
        <Text className="text-white font-semibold ml-2">
          {submitting ? "Submitting..." : "Submit Sell Request"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
