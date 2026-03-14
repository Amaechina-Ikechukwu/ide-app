import { api } from "@/lib/api";
import { getIdToken } from "@/lib/auth";
import { handleApiError } from "@/lib/handleApiError";
import { useStore } from "@/store/useStore";
import type { PostType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage } from "../../../firebaseConfig";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Vehicles",
  "Services",
  "Other",
];

type SelectedImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.onerror = () => {
      reject(new Error("Unable to read the selected image."));
    };
    request.onload = () => {
      resolve(request.response as Blob);
    };
    request.responseType = "blob";
    request.open("GET", uri, true);
    request.send();
  });
}

export default function CreatePostScreen() {
  const router = useRouter();
  const deviceId = useStore((s) => s.deviceId);
  const balance = useStore((s) => s.balance);
  const fetchPosts = useStore((s) => s.fetchPosts);
  const user = useStore((s) => s.user);

  const [type, setType] = useState<PostType>("SALE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit reached", "You can add up to 5 photos.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to attach images to your listing.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImages((prev) => [
        ...prev,
        {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        },
      ]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const image of images) {
      const extension =
        image.fileName?.split(".").pop()?.toLowerCase() ?? "jpg";
      const blob = await uriToBlob(image.uri);
      const storageRef = ref(
        storage,
        `posts/${deviceId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`,
      );

      try {
        await uploadBytes(storageRef, blob, {
          contentType: image.mimeType ?? `image/${extension}`,
        });
        const url = await getDownloadURL(storageRef);
        urls.push(url);
      } finally {
        const closableBlob = blob as unknown as { close?: () => void };
        if (typeof closableBlob.close === "function") {
          closableBlob.close();
        }
      }
    }

    return urls;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a title.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }
    if (!deviceId) {
      Alert.alert("Error", "Device ID not ready. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      if (images.length > 0 && imageUrls.length !== images.length) {
        throw new Error("One or more images could not be uploaded.");
      }

      const token = await getIdToken();

      await api.post(
        "/api/posts",
        {
          deviceId,
          type,
          title: title.trim(),
          description: description.trim(),
          imageUrls,
          price: price ? parseFloat(price) : undefined,
          currency: price ? "NGN" : undefined,
          tags: category ? [category] : [],
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );

      Alert.alert("Success", "Your listing has been published!", [
        {
          text: "OK",
          onPress: () => {
            fetchPosts();
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        const { retryAfterMs } = err.response.data;
        const hours = (retryAfterMs / 3_600_000).toFixed(1);
        Alert.alert(
          "Slow down!",
          `Free users can post once every 24h.\nTry again in ${hours}h.`,
        );
      } else if (err instanceof Error && /image|upload/i.test(err.message)) {
        Alert.alert(
          "Photo upload failed",
          "Your listing was not published because the selected image could not be uploaded. Please try again.",
        );
      } else {
        handleApiError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <Text style={styles.draftsText}>Drafts</Text>
      </View>

      {!user ? (
        <View style={styles.authGate}>
          <View style={styles.authGateIconWrap}>
            <Ionicons name="lock-closed" size={48} color="#2563EB" />
          </View>
          <Text style={styles.authGateTitle}>Login Required</Text>
          <Text style={styles.authGateBody}>
            You must be signed in to create a listing. Join the community to
            post your items and requests.
          </Text>
          <Pressable
            style={styles.authGatePrimaryBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.authGatePrimaryText}>Sign In or Register</Text>
          </Pressable>
          <Pressable
            style={styles.authGateSecondaryBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.authGateSecondaryText}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Type Toggle */}
          <View style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleBtn, type === "SALE" && styles.toggleActive]}
              onPress={() => setType("SALE")}
            >
              <Ionicons
                name="pricetag"
                size={16}
                color={type === "SALE" ? "#2563EB" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.toggleText,
                  type === "SALE" && styles.toggleTextActive,
                ]}
              >
                I want to sell
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleBtn,
                type === "REQUEST" && styles.toggleActive,
              ]}
              onPress={() => setType("REQUEST")}
            >
              <Ionicons
                name="search"
                size={16}
                color={type === "REQUEST" ? "#2563EB" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.toggleText,
                  type === "REQUEST" && styles.toggleTextActive,
                ]}
              >
                I'm looking for
              </Text>
            </Pressable>
          </View>

          {/* Photos Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>PHOTOS</Text>
              <Text style={styles.photoCount}>{images.length}/5</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </Pressable>
              {images.map((uri, i) => (
                <View key={i} style={styles.photoPreview}>
                  <Image source={{ uri: uri.uri }} style={styles.photoImage} />
                  <Pressable
                    style={styles.photoRemove}
                    onPress={() => removeImage(i)}
                  >
                    <Ionicons name="close-circle" size={22} color="#374151" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <View style={styles.photoHint}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#9CA3AF"
              />
              <Text style={styles.photoHintText}>
                Photos help your listing get noticed faster.
              </Text>
            </View>
          </View>

          {/* Listing Details */}
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>LISTING DETAILS</Text>
          <View style={styles.divider} />

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder={
                type === "SALE"
                  ? "What are you selling?"
                  : "What are you looking for?"
              }
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              keyboardShouldPersistTaps="handled"
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(category === cat ? "" : cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the condition, features, and reason for selling..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          {/* Premium Notice */}
          {balance !== null && (
            <View style={styles.premiumBanner}>
              <View style={styles.premiumHeader}>
                <Ionicons name="diamond" size={24} color="#2563EB" />
                <View style={styles.premiumHeaderText}>
                  <Text style={styles.premiumTitle}>Premium Listing</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.premiumDesc}>
                Publishing this listing will deduct{" "}
                <Text style={{ fontWeight: "700" }}>1 token</Text> from your
                wallet.
              </Text>
              <View style={styles.balanceBar}>
                <View style={styles.balanceTrack}>
                  <View
                    style={[
                      styles.balanceFill,
                      { width: `${Math.min(100, (balance / 150) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.balanceText}>{balance} / 150</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Publish Button */}
      {user ? (
        <View style={styles.footer}>
          <Pressable
            style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.publishText}>Publish Post</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  draftsText: { fontSize: 14, fontWeight: "600", color: "#2563EB" },
  authGate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F9FAFB",
  },
  authGateIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginBottom: 20,
  },
  authGateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
  },
  authGateBody: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  authGatePrimaryBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  authGatePrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  authGateSecondaryBtn: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  authGateSecondaryText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  toggleContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  toggleTextActive: {
    color: "#2563EB",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  photoCount: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  photoRow: {
    gap: 12,
    paddingRight: 16,
  },
  addPhotoBtn: {
    width: 104,
    height: 104,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FAFAFA",
  },
  addPhotoText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  photoPreview: {
    width: 104,
    height: 104,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  photoHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  photoHintText: {
    fontSize: 13,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  field: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#fff",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  currencySymbol: {
    paddingLeft: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  priceInput: { flex: 1, borderWidth: 0 },
  categoryRow: { gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  categoryChipActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  categoryChipText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  categoryChipTextActive: { color: "#2563EB" },
  textArea: { height: 120, textAlignVertical: "top", paddingTop: 12 },
  premiumBanner: {
    margin: 16,
    backgroundColor: "#F0F4FF",
    borderRadius: 16,
    padding: 16,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  premiumHeaderText: { flexDirection: "row", alignItems: "center", gap: 8 },
  premiumTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  premiumBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumBadgeText: { fontSize: 10, fontWeight: "700", color: "#2563EB" },
  premiumDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  balanceBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  balanceTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#DBEAFE",
    borderRadius: 3,
  },
  balanceFill: { height: 6, backgroundColor: "#2563EB", borderRadius: 3 },
  balanceText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  publishBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
