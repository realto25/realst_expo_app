import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { Button, TextInput, Text, View, Alert } from "react-native";

export default function LeaveRequestScreen() {
  const { user } = useUser();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");

  const submitLeave = async () => {
    const res = await fetch("http://localhost:3000/api/manager-leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId: user?.id, reason, date }),
    });
    if (res.ok) Alert.alert("Leave Requested");
  };

  return (
    <View className="p-4">
      <TextInput
        placeholder="Reason"
        value={reason}
        onChangeText={setReason}
        className="border p-2 mb-4 rounded"
      />
      <TextInput
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        className="border p-2 mb-4 rounded"
      />
      <Button title="Submit Leave Request" onPress={submitLeave} />
    </View>
  );
}
