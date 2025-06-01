import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Image, Text, View } from "react-native";
import { TouchableOpacity } from "react-native";
import { createOrUpdateUser } from "@/lib/api";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive, createdUser } = await startOAuthFlow();
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        
        if (createdUser) {
          try {
            const userRole = createdUser.publicMetadata?.role as UserRole || "guest";
            
            if (!createdUser.publicMetadata?.role) {
              await createdUser.update({
                publicMetadata: { role: userRole },
              });
            }
            
            // Get primary email reliably
            const primaryEmail = createdUser.emailAddresses.find(
              email => email.id === createdUser.primaryEmailAddressId
            )?.emailAddress;

            await createOrUpdateUser({
              clerkId: createdUser.id,
              email: primaryEmail || "",
              name: createdUser.fullName || createdUser.firstName || "User",
              phone: createdUser.phoneNumbers[0]?.phoneNumber,
              role: userRole
            });
          } catch (error) {
            console.error("Database sync error:", error);
          }
        }
      }
    } catch (err) {
      console.error("OAuth error:", err);
      Alert.alert(
        "Authentication Error",
        "Google sign-in failed. Please try again."
      );
    }
  };

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        className="flex flex-row justify-center items-center mt-5 w-full rounded-full bg-white border border-gray-300 py-4 shadow-md"
      >
        <Image
          source={{
            uri: "https://developers.google.com/identity/images/g-logo.png",
          }}
          resizeMode="contain"
          className="w-5 h-5 mx-2"
        />
        <Text className="text-black text-lg ml-2">Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OAuth;