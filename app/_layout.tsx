import { ThemedText } from "@/components/ThemedText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

// ✅ Google Font import
import { AuthProvider } from "@/context/AuthContext";
import {
  Pacifico_400Regular,
  useFonts,
} from "@expo-google-fonts/pacifico";



export default function RootLayout() {
   const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  const {} = useThemeColors();

   if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={{ flex: 1}}>
          <Stack
            screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" }, 
        }}
           
          />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
