import { useSignIn, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { createOrUpdateUser, getUserByClerkId } from "@/lib/api";
import { StatusBar } from "expo-status-bar";

type UserRole = "guest" | "client" | "manager";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user } = useUser();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [validation, setValidation] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("guest");

  // Form validation
  const validateForm = () => {
    const errors = { email: "", password: "" };
    let isValid = true;

    // Email validation
    if (!form.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Password validation
    if (!form.password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setValidation(errors);
    return isValid;
  };


  const handleUserDataAfterSignIn = async (signedInUser: any) => {
    try {
      let userData = await getUserByClerkId(signedInUser.id);
      const roleFromMetadata = signedInUser.publicMetadata?.role as UserRole;
      const userRole = roleFromMetadata || selectedRole;

      // Always update user with selected role
      userData = await createOrUpdateUser({
        clerkId: signedInUser.id,
        email: signedInUser.primaryEmailAddress?.emailAddress || form.email,
        name: signedInUser.fullName || 
              signedInUser.firstName || 
              form.email?.split('@')[0] || 
              "User",
        phone: signedInUser.primaryPhoneNumber?.phoneNumber,
        role: userRole
      });

      // Update Clerk metadata if needed
      if (!roleFromMetadata) {
        await signedInUser.update({
          publicMetadata: { role: userRole },
        });
      }

      return userData;
    } catch (error) {
      console.error("Error handling user data:", error);
      throw error;
    }
  };


  const onSignInPress = async () => {
    if (!isLoaded || isSubmitting) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      });

      if (result.status === "complete") {
        // Sign in successful
        await setActive({ session: result.createdSessionId });

        // Get the signed-in user from the result
        const signedInUser = result.createdSessionId?.user;

        if (signedInUser) {
          // Handle user data creation/update
          await handleUserDataAfterSignIn(signedInUser);
        }

        console.log("Sign in successful, AuthLayout will handle redirection");
      } else if (result.status === "needs_second_factor") {
        // Handle 2FA if needed
        Alert.alert(
          "Two-Factor Authentication",
          "Please complete the second factor authentication."
        );
      } else {
        Alert.alert("Sign In Failed", `Unexpected status: ${result.status}`);
      }
    } catch (err: any) {
      console.error("Sign In Error:", err);

      let errorMessage = "Sign in failed. Please try again.";

      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];
        if (error.code === "form_identifier_not_found") {
          errorMessage = "No account found with this email address.";
        } else if (error.code === "form_password_incorrect") {
          errorMessage = "Incorrect password. Please try again.";
        } else if (error.code === "too_many_requests") {
          errorMessage = "Too many failed attempts. Please try again later.";
        } else {
          errorMessage = error.longMessage || error.message || errorMessage;
        }
      }

      Alert.alert("Sign In Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image
            source={{
              uri: "https://i.pinimg.com/736x/5c/ee/6e/5cee6e582b2ac0529b43c3e1996703fd.jpg",
            }}
            className="z-0 w-full h-[150px] rounded-b-2xl"
          />
          <Text className="text-2xl text-gray-900 text-center font-manrope absolute bottom-12 left-20">
            Sign In to Your Account
          </Text>
        </View>

        <View className="px-5">
          {/* Role Selection UI - Optional for existing users */}
          <View className="mb-6">
            <Text className="text-lg font-manrope-bold mb-2">
              Select Your Role:
            </Text>
            <Text className="text-sm text-gray-500 mb-3">
              (This will update your account role)
            </Text>
            <View className="flex-row justify-around">
              {["guest", "client", "manager"].map((role) => (
                <TouchableOpacity
                  key={role}
                  className={`px-4 py-2 rounded-full ${
                    selectedRole === role ? "bg-primary" : "bg-gray-200"
                  }`}
                  onPress={() => setSelectedRole(role as UserRole)}
                >
                  <Text
                    className={`${
                      selectedRole === role ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <InputField
            label="Email"
            placeholder="Enter your email address"
            icon={"mail-outline"}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => {
              setForm({ ...form, email: value });
              if (validation.email) setValidation({ ...validation, email: "" });
            }}
          />
          {validation.email ? (
            <Text className="text-red-500 text-sm mt-1 mb-2">
              {validation.email}
            </Text>
          ) : null}

          <InputField
            label="Password"
            placeholder="Enter your password"
            icon={"lock-closed-outline"}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => {
              setForm({ ...form, password: value });
              if (validation.password)
                setValidation({ ...validation, password: "" });
            }}
          />
          {validation.password ? (
            <Text className="text-red-500 text-sm mt-1 mb-2">
              {validation.password}
            </Text>
          ) : null}

          <CustomButton
            title={isSubmitting ? "Signing In..." : "Sign In"}
            onPress={onSignInPress}
            className="mt-6"
            disabled={isSubmitting}
          />

          <OAuth />

          <Link
            href="/(auth)/sign-up"
            className="text-lg text-center text-general-200 mt-10"
          >
            Don't have an account?{" "}
            <Text className="text-primary-500">Sign Up</Text>
          </Link>
        </View>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
};

export default SignIn;
