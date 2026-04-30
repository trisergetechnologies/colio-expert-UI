import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { Text, TouchableOpacity, View } from "react-native";

export default function RejectedScreen() {
  const { user, logout } = useAuth();
  const reason =
    user?.consultantProfile?.rejectionReason ||
    "Your application did not meet our current requirements.";

  return (
    <GradientBackground>
      <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#b91c1c", textAlign: "center" }}>
          Application not approved
        </Text>
        <Text style={{ marginTop: 16, fontSize: 15, color: "#444", textAlign: "center" }}>
          {reason}
        </Text>
        <Text style={{ marginTop: 12, fontSize: 14, color: "#666", textAlign: "center" }}>
          If you have questions, please contact support.
        </Text>
        <TouchableOpacity
          onPress={() => logout()}
          style={{
            marginTop: 32,
            backgroundColor: "#333",
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Log out</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}
