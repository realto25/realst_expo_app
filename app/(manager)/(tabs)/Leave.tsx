import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { LeaveRequestHistory } from "@/components/LeaveRequestHistory";
import { View } from "react-native";

export default function Leave() {
  return (
    <View style={{ flex: 1 }}>
      <LeaveRequestForm />
      <LeaveRequestHistory />
    </View>
  );
}
