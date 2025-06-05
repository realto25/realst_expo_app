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
import tw from "twrnc";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";

interface Land {
  id: string;
  number?: string;
  size?: string;
  status?: string;
  qrCode?: string;
  plot?: {
    id: string;
    title: string;
    location: string;
    imageUrls?: string[];
    project?: { id: string; name: string };
  };
}

interface Document {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const fadeIn = { from: { opacity: 0, translateY: 20 }, to: { opacity: 1, translateY: 0 } };

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
      setLands(data ?? []);
    } catch (err) {
      setError("Failed to load properties.");
      Alert.alert("Error", "Failed to load properties.", [
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
          size: asset.size,
        }));
        setDocuments((prev) => [...prev, ...newDocs]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document.");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (uri: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!selectedLand || !askingPrice || !termsAgreed) {
      Alert.alert("Error", "Please select a property, enter a price, and agree to terms.");
      return;
    }
    Alert.alert("Confirm", "Submit sell request?", [
      {
        text: "Cancel",
        style: "cancel",
      },
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
            Alert.alert("Success", "Sell request submitted!", [
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
            Alert.alert("Error", "Failed to submit sell request.", [{ text: "OK" }]);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-50`} edges={["top", "bottom"]}>
        <Animatable.View animation={fadeIn} duration={300}>
          <ActivityIndicator color="#f97316" size="large" />
          <Text style={tw`text-gray-700 mt-2 text-lg font-semibold`}>Loading properties...</Text>
        </Animatable.View>
      </SafeAreaView>
    );
  }

  if (error && !lands.length) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-gray-50 p-4`} edges={["top", "bottom"]}>
        <Animatable.View animation={fadeIn} duration={300}>
          <Text style={tw`text-red-500 text-lg font-semibold text-center mb-4`}>{error}</Text>
          <View style={tw`flex-row space-x-4`}>
            <TouchableOpacity
              style={tw`text-orange-600 underline`}
              onPress={() => fetchLands()}
            >
              <Text>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`text-orange-600 underline`}
              onPress={() => router.push("/(client)/(tabs)/Home")}
            >
              <Text>Add Property</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={tw`p-4 pb-20`}
      >
        <Animatable.View animation={fadeIn} duration={300}>
          <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>Request to Sell Plot</Text>
          <View style={tw`bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4`}>
            <Text style={tw`text-orange-600 text-sm font-medium`}>
              Create a sell request for your property. Our team will review your request and connect you with potential buyers.
            </Text>
          </View>
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={300} style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Select Property</Text>
          <Text style={tw`text-sm text-gray-600 mb-2`}>Choose a property to sell</Text>
          {lands.length === 0 ? (
            <Animatable.Text animation={fadeIn} duration={600} style={tw`text-red-500 mt-1`}>
              No properties available. Add a property to start selling.
            </Animatable.Text>
          ) : (
            lands.map((land, index) => (
              <Animatable.View
                key={land.id}
                animation={fadeIn}
                duration={600 + index * 100}
                style={tw`mb-2`}
              >
                <TouchableOpacity
                  style={tw`bg-white border rounded-lg p-4 flex-row items-center justify-between border-${selectedLand?.id === land.id ? 'orange-500' : 'gray-200'}`}
                  onPress={() => setSelectedLand(land)}
                  disabled={submitting}
                >
                  <View>
                    <Text style={tw`text-gray-900 font-semibold`}>{land.plot?.title || 'Unknown Plot'}</Text>
                    <Text style={tw`text-gray-600 text-sm`}>{land.plot?.location || 'N/A'}</Text>
                    <Text style={tw`text-gray-600 text-sm`}>Size: {land.size || 'N/A'}</Text>
                  </View>
                  {selectedLand?.id === land.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#f97316" />
                  )}
                </TouchableOpacity>
              </Animatable.View>
            ))
          )}
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600} style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Asking Price</Text>
          <Text style={tw`text-sm text-gray-600 mb-2`}>Set your desired selling price (in INR)</Text>
          <TextInput
            style={tw`bg-white border border-gray-200 rounded-lg p-3 text-gray-800`}
            value={askingPrice}
            onChangeText={setAskingPrice}
            keyboardType="numeric"
            placeholder="Enter asking price (e.g., 1000000)"
            editable={!submitting}
          />
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600} style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Description</Text>
          <Text style={tw`text-sm text-gray-600 mb-2`}>Provide details (max {MAX_DESCRIPTION_LENGTH} characters)</Text>
          <TextInput
            style={tw`bg-white border border-gray-200 rounded-lg p-3 h-24 text-gray-600`}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe the property, location benefits, etc."
            maxLength={MAX_DESCRIPTION_LENGTH}
            editable={!submitting}
          />
          <Text style={tw`text-gray-500 text-sm mt-2`}>{description.length}/{MAX_DESCRIPTION_LENGTH}</Text>
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600} style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Urgency</Text>
          <Text style={tw`text-sm text-gray-600 mb-2`}>How quickly do you want to sell?</Text>
          <View style={tw`flex-row justify-between`}>
            {urgencyOptions.map((opt, index) => (
              <Animatable.View
                key={opt.value}
                animation={fadeIn}
                duration={600 + index * 100}
                style={tw`flex-1 mx-1`}
              >
                <TouchableOpacity
                  style={tw`border rounded-lg p-3 text-center justify-center py-4 ${urgency === opt.value ? 'border-orange-500 bg-orange-200' : 'border-gray-200 bg-white'}`}
                  onPress={() => setUrgency(opt.value)}
                  disabled={submitting}
                >
                  <Text style={tw`text-sm font-semibold text-${urgency === opt.value ? 'orange-600' : 'gray-600'}`}>{opt.label}</Text>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600} style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Agent Assistance</Text>
          <Text style={tw`text-sm text-gray-600 mb-2`}>Would you like assistance from our agent?</Text>
          <View style={tw`flex-row items-center justify-between bg-white border border-gray-200 rounded-lg p-3`}>
            <Text style={tw`text-gray-900 font-medium`}>Request Agent Assistance</Text>
            <Switch
              value={agentAssistance}
              onValueChange={setAgentAssistance}
              trackColor={{ false: "#d1d5db", true: "#f97316" }}
              thumbColor="#ffffff"
              disabled={submitting}
            />
          </View>
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600} style={tw`mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-2`}>Documents</Text>
          <Text style={tw`text-sm text-gray-600 mb-2`}>Upload documents (PDF/images, max 10MB)</Text>
          <TouchableOpacity
            style={tw`bg-orange-600 rounded-lg p-3 flex-row items-center justify-center ${uploading || submitting ? 'opacity-50' : ''}`}
            onPress={pickDocument}
            disabled={uploading || submitting}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color="white" />
            )}
            <Text style={tw`text-white font-semibold ml-2`}>{uploading ? "Uploading..." : "Upload Documents"}</Text>
          </TouchableOpacity>
          {documents.length > 0 && (
            <View style={tw`mt-2`}>
              {documents.map((doc, index) => (
                <Animatable.View
                  key={doc.uri}
                  animation={fadeIn}
                  duration={600 + index * 100}
                  style={tw`bg-white border border-gray-200 rounded-lg p-3 mt-2 flex-row items-center justify-between`}
                >
                  <Text style={tw`text-gray-900 flex-1`} numberOfLines={1}>{doc.name}</Text>
                  <TouchableOpacity
                    onPress={() => removeDocument(doc.uri)}
                    disabled={submitting}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </View>
          )}
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600} style={tw`mb-4`}>
          <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-lg p-3`}>
            <Switch
              value={termsAgreed}
              onValueChange={setTermsAgreed}
              trackColor={{ false: "#d1d5db", true: "#f97316" }}
              thumbColor="#ffffff"
              disabled={submitting}
            />
            <Text style={tw`text-gray-900 ml-2 flex-1`}>
              I agree to the{" "}
              <Text
                style={tw`text-orange-600 underline`}
                onPress={() => Alert.alert("Terms", "View Terms & Conditions. (Mock)")}
              >
                Terms & Conditions
              </Text>
            </Text>
          </View>
        </Animatable.View>

        <Animatable.View animation={fadeIn} duration={600}>
          <TouchableOpacity
            style={tw`bg-orange-600 rounded-lg p-4 flex-row items-center justify-center ${submitting ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
            ) : (
              <Ionicons name="paper-plane-outline" size={20} color="white" />
            )}
            <Text style={tw`text-white font-semibold ml-2`}>{submitting ? "Submitting..." : "Submit Request"}</Text>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}
