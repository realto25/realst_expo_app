import { InputFieldProps } from "@/types/type";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Extended props for validation
interface ExtendedInputFieldProps extends InputFieldProps {
  onValidation?: (text: string) => string | null;
  error?: string;
  onValueChange?: (text: string) => void;
}

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  onValidation,
  error,
  onValueChange,
  onChangeText,
  ...props
}: ExtendedInputFieldProps) => {
  const handleChangeText = (text: string) => {
    // Call the parent's onChangeText if provided
    onChangeText?.(text);

    // Call custom validation if provided
    if (onValidation) {
      const validationError = onValidation(text);
      // Handle validation error through onValueChange
      onValueChange?.(text);
    } else {
      // If no validation, just pass the value
      onValueChange?.(text);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="w-full"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text className={`text-lg font-manrope mb-3 ${labelStyle}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative bg-gray-100 rounded-full border ${
              error ? "border-red-500" : "border-gray-200"
            } px-4 ${containerStyle}`}
          >
            {icon && (
              <Ionicons
                name={icon}
                size={24}
                color="#666"
                className={`mr-2 ${iconStyle}`}
              />
            )}
            <TextInput
              className={`flex-1 font-manrope text-[15px] py-4 text-gray-800 ${inputStyle}`}
              secureTextEntry={secureTextEntry}
              placeholderTextColor="#666"
              onChangeText={handleChangeText}
              {...props}
            />
          </View>
          {error && (
            <Text className="text-red-500 text-sm mt-1 font-manrope">
              {error}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
