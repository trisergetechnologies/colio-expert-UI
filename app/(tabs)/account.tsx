// app/(private)/account.tsx
import GradientBackground from "@/components/Gradientbackground";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";


export default function AccountScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null); // start empty
  const [referralCode] = useState("COLIO1234");
  const { user, logout } = useAuth();

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showToast = (msg: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.showWithGravity(
        msg,
        ToastAndroid.SHORT,
        ToastAndroid.TOP
      );
    } else {
      Alert.alert(msg);
    }
  };

  const moreOptions = [
    { id: "4", label: "Performance", icon: "analytics-outline", path: "../(dashboard)/performance" },
    { id: "1", label: "Wallet", icon: "wallet", path: "../(tabs)/wallet" },
    { id: "2", label: "Activity", icon: "time-outline", path: "../(private)/history" },
    { id: "3", label: "Referrals", icon: "people-outline", path: "../(dashboard)/referral" },
    { id: "7", label: "About Us", icon: "information-circle-outline", path: "../(dashboard)/AboutUs" },
     { id: "8", label: "Quick-Assistance", icon: "headset-outline", path: "../(dashboard)/support" },
    { id: "5", label: "Terms & Conditions", icon: "document-text-outline" },
    { id: "6", label: "Privacy Policy", icon: "lock-closed-outline" },
    { id: "9", label: "Logout", icon: "log-out-outline" },
    { id: "10", label: "Delete Account", icon: "trash-outline", isDelete: true },
  ];

  return (
    <GradientBackground>
      <View className="flex-1">
        {/* Header */}
       <View className="flex-row items-center justify-between px-4 pt-14 pb-3 shadow-md rounded-b-2xl backdrop-blur-md">
                 <TouchableOpacity onPress={() => router.back()}>
                   <Ionicons name="arrow-back" size={24} color="#000" />
                 </TouchableOpacity>
       
                 <TouchableOpacity className="flex-row items-center">
                   <Ionicons name="help-circle-outline" size={22} color="#000" />
                   <Text className="ml-1 font-medium text-black">Assist</Text>
                 </TouchableOpacity>
               </View>


        {/* Profile Card */}
        <View className="items-center mt-6">
          {user?.avatar ? (
            <View className="relative">
              <Image
                source={{ uri: user.avatar }}
                className="w-28 h-28 rounded-full border-4 border-pink-600"
              />
              <TouchableOpacity
                onPress={handleImagePick}
                className="absolute bottom-1 right-1 bg-white p-1 rounded-full"
              >
                <Ionicons name="camera" size={18} color="#22c55e" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleImagePick}
              className="w-28 h-28 rounded-full bg-black items-center justify-center"
            >
              <Ionicons name="camera" size={40} color="#db2777" />
            </TouchableOpacity>
          )}

          <Text className="text-black text-xl font-bold mt-3">{user?.name}</Text>
          <Text className="text-black-200 mt-1">{user?.phone}</Text>

          {/* Edit Profile */}
          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/editProfile")}
            className="mt-2 flex-row items-center"
          >
            <Ionicons name="create-outline" size={18} color="#db2777" />
            <Text className="text-black ml-1">Edit Profile</Text>
          </TouchableOpacity>

          {/* Referral Code */}
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl flex-row justify-between mt-3 items-center shadow-sm"
            style={{ borderRadius: 16 }}
          >
            <View className="flex-row items-center px-4 py-2 rounded-lg">
              <Text className="text-black font-semibold">{user?.referralCode ? user.referralCode : 'NA'}</Text>
              <TouchableOpacity
                onPress={() => {
                  showToast("Referral Code Copied!");
                }}
              >
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color="#db2777"
                  className="ml-2"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        
        <View className="flex-row justify-around mt-8 px-6">
          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
            >
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="items-center bg-white/20 p-4 rounded-2xl w-24"
          >
            <Ionicons name="call-outline" size={24} color="#db2777" />
            <Text className="text-black font-semibold mt-2 text-md">Calls</Text>
          </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
            >
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="items-center bg-white/20 p-4 rounded-2xl w-24"
          >
            <Ionicons name="chatbubble-outline" size={24} color="#db2777" />
            <Text className="text-black font-semibold mt-2 text-md">Chat</Text>
          </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={["#fffaf3", "#ffd6a5"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
            >
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="items-center bg-white/20 p-4 rounded-2xl w-24"
          >
            <Ionicons name="videocam-outline" size={24} color="#db2777" />
            <Text className="text-black font-semibold mt-2 text-md">Video</Text>
          </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* More Options (with Delete inside) */}
        <FlatList
          data={moreOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>{
                if(item.label == 'Logout'){
                  logout();
                }
                else if(item.isDelete){
                  console.log("Delete pressed");
                }
                else{
                  router.push(item.path as any)
                }
              }
              }
              className="flex-row items-center px-6 py-4 border-b border-white/10"
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.isDelete ? "red" : "black"}
              />
              <Text
                className={`ml-4 text-base font-medium ${
                  item.isDelete ? "text-red-500 font-semibold" : "text-black"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          className="mt-6"
        />

        {/* Footer */}
        <View className="items-center pt-4 mb-4">
          <Text className="text-pink-600 text-sm"> Colio.V-1.0.0</Text>
        </View>
      </View>
    </GradientBackground>
  );
}
