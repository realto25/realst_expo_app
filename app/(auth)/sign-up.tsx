import { useAuth, useSignUp, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";

import { createUserInDatabase, updateUserMetadata } from "@/lib/auth";
import { StatusBar } from "expo-status-bar";

type UserRole = "guest" | "client" | "manager";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [validation, setValidation] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>("guest");

  // Form validation
  const validateForm = () => {
    const errors = { name: "", email: "", password: "" };
    let isValid = true;

    // Name validation
    if (!form.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
      isValid = false;
    }

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
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, and number";
      isValid = false;
    }

    setValidation(errors);
    return isValid;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Starting sign up process...");

      const signUpAttempt = await signUp.create({
        emailAddress: form.email.trim().toLowerCase(),
        password: form.password,
      });

      console.log("Sign up attempt created:", signUpAttempt.status);

      if (signUpAttempt.status === "complete") {
        console.log("Sign up complete, activating session...");

        await setActive({
          session: signUpAttempt.createdSessionId,
        });

        if (signUpAttempt.createdUserId) {
          try {
            // Create user in database
            await createUserInDatabase({
              clerkId: signUpAttempt.createdUserId,
              email: form.email.trim().toLowerCase(),
              name: form.name.trim(),
              role: selectedRole.toUpperCase() as
                | "GUEST"
                | "CLIENT"
                | "MANAGER",
            });

            // Update user metadata
            await updateUserMetadata(signUpAttempt.createdUserId, {
              role: selectedRole,
              signUpDate: new Date().toISOString(),
            });

            setShowSuccessModal(true);
          } catch (error) {
            console.error("Error in user creation:", error);
            Alert.alert(
              "Account Created",
              "Your account was created, but there was an error saving your profile. You can update it later in your profile settings.",
              [{ text: "OK" }]
            );
          }
        }
      } else if (signUpAttempt.status === "abandoned") {
        throw new Error("Sign up process was abandoned");
      } else {
        // Handle email verification
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setVerification({
          ...verification,
          state: "pending",
          error: "",
        });
      }
    } catch (err: any) {
      console.error("Sign up error:", err);

      let errorMessage = "Sign up failed. ";

      if (err.errors?.[0]) {
        const clerkError = err.errors[0];
        errorMessage = clerkError.longMessage || clerkError.message;

        // Handle specific Clerk error codes
        switch (clerkError.code) {
          case "form_identifier_exists":
            errorMessage =
              "This email is already registered. Please sign in instead.";
            break;
          case "form_password_pwned":
            errorMessage =
              "This password has been compromised. Please choose a different one.";
            break;
          case "form_password_validation_failed":
            errorMessage =
              "Password must be at least 8 characters and include uppercase, lowercase, and numbers.";
            break;
          case "network_failure":
            errorMessage =
              "Network error. Please check your connection and try again.";
            break;
          default:
            if (clerkError.message) {
              errorMessage = clerkError.message;
            }
        }
      } else if (err.message) {
        errorMessage += err.message;
      }

      Alert.alert("Sign Up Error", errorMessage, [
        {
          text: "OK",
          onPress: () => {
            if (
              errorMessage.includes("password") ||
              errorMessage.includes("email")
            ) {
              setForm((prev) => ({ ...prev, password: "" }));
            }
          },
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || isSubmitting) return;

    if (!verification.code.trim()) {
      setVerification({
        ...verification,
        error: "Please enter the verification code",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Attempting email verification...");

      const result = await signUp.attemptEmailAddressVerification({
        code: verification.code.trim(),
      });

      console.log("Verification result status:", result.status);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        if (result.createdUserId) {
          try {
            // Create user in database
            await createUserInDatabase({
              clerkId: result.createdUserId,
              email: form.email.trim().toLowerCase(),
              name: form.name.trim(),
              role: selectedRole.toUpperCase() as
                | "GUEST"
                | "CLIENT"
                | "MANAGER",
            });

            // Update user metadata
            await updateUserMetadata(result.createdUserId, {
              role: selectedRole,
              signUpDate: new Date().toISOString(),
            });

            setVerification({
              ...verification,
              state: "success",
              error: "",
            });
          } catch (error) {
            console.error("Error in user creation after verification:", error);
            Alert.alert(
              "Account Created",
              "Your account was created, but there was an error saving your profile. You can update it later in your profile settings.",
              [{ text: "OK" }]
            );
          }
        }
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please check your code and try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerification({
        ...verification,
        error:
          err.errors?.[0]?.longMessage ||
          "Verification failed. Please try again.",
        state: "failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // AuthLayout will handle the redirection based on user role
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
            Create Your Account
          </Text>
        </View>

        <View className="px-5">
          <View className="mb-6">
            <Text className="text-lg font-manrope-bold mb-2">
              Select Your Role:
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
            label="Name"
            placeholder="Enter your full name"
            icon={"person-outline"}
            value={form.name}
            onChangeText={(value) => {
              setForm({ ...form, name: value });
              if (validation.name) setValidation({ ...validation, name: "" });
            }}
          />
          {validation.name ? (
            <Text className="text-red-500 text-sm mt-1 mb-2">
              {validation.name}
            </Text>
          ) : null}

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
            placeholder="Enter a strong password"
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
            title={isSubmitting ? "Creating Account..." : "Sign Up"}
            onPress={onSignUpPress}
            className="mt-6"
            disabled={isSubmitting}
          />

          <OAuth />

          <Link
            href="/(auth)/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </View>

        {/* Verification Modal */}
        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={() => {
            if (verification.state === "success") {
              setShowSuccessModal(true);
            }
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="font-JakartaExtraBold text-2xl mb-2">
              Verification
            </Text>
            <Text className="font-Jakarta mb-5">
              We've sent a verification code to {form.email}.
            </Text>
            <InputField
              label={"Verification Code"}
              icon={"lock-closed-outline"}
              placeholder={"Enter 6-digit code"}
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) =>
                setVerification({ ...verification, code, error: "" })
              }
            />
            {verification.error ? (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            ) : null}
            <CustomButton
              title={isSubmitting ? "Verifying..." : "Verify Email"}
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
              disabled={isSubmitting}
            />
          </View>
        </ReactNativeModal>

        {/* Success Modal */}
        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="text-3xl font-JakartaBold text-center">
              Account Created!
            </Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              Your account has been successfully created. You'll be redirected
              shortly.
            </Text>
            <CustomButton
              title="Continue"
              onPress={handleSuccessModalClose}
              className="mt-5"
            />
          </View>
        </ReactNativeModal>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
};

export default SignUp;
