import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  message: string;
  onOk: () => void;
};

export function CallEndedAlert({ visible, message, onOk }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* FULL BLOCKING BACKGROUND */}
      <View style={styles.backdrop}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>Call Ended</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity onPress={onOk}>
            <Text style={styles.ok}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000", // fully opaque
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    width: "80%",
    backgroundColor: "#1c1c1e",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 20,
  },
  ok: {
    color: "#0A84FF",
    fontSize: 16,
    fontWeight: "600",
    alignSelf: "flex-end",
  },
});
