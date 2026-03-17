import { api } from "@/lib/api";
import { getIdToken } from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";
import { formatAmountInput, stripNumericFormatting } from "@/lib/formatters";
import { handleApiError } from "@/lib/handleApiError";
import {
  isMessagingConfigured,
  subscribeToPostHasMessages,
} from "@/lib/messaging";
import { normalizePost } from "@/lib/posts";
import { useStore } from "@/store/useStore";
import type { Post, PostType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
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
import { storage } from "../../firebaseConfig";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Vehicles",
  "Services",
  "Other",
];

type EditablePost = Post & { hasMessages: boolean };
type SelectedImage = {
  uri: string;
  uploadedUrl?: string;
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

function getCategoryTag(tags: string[]) {
  return tags.find((tag) => CATEGORIES.includes(tag)) ?? "";
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const deviceId = useStore((s) => s.deviceId);
  const fetchPosts = useStore((s) => s.fetchPosts);
  const user = useStore((s) => s.user);
  const messagingReady = isMessagingConfigured();

  const [type, setType] = useState<PostType>("SALE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [post, setPost] = useState<EditablePost | null>(null);
  const [editingLocked, setEditingLocked] = useState(false);

  const handlePriceChange = (value: string) => {
    setPrice(formatAmountInput(value));
  };

  useEffect(() => {
    let cancelled = false;

    const loadPost = async () => {
      if (typeof id !== "string") {
        router.replace("/(tabs)");
        return;
      }

      setLoadingPost(true);
      try {
        const { data } = await api.get(`/api/posts/${id}`);
        const nextPost = normalizePost(data.post ?? data) as EditablePost;
        const currentDeviceId = deviceId ?? (await getDeviceId());
        const isOwner = Boolean(
          (user?.uid && nextPost.userId && nextPost.userId === user.uid) ||
            (currentDeviceId && nextPost.deviceId === currentDeviceId),
        );

        if (!isOwner) {
          if (!cancelled) {
            Alert.alert("Not allowed", "You can only edit your own listing.");
            router.replace(`/post/${id}` as never);
          }
          return;
        }

        const categoryTag = getCategoryTag(nextPost.tags);

        if (cancelled) {
          return;
        }

        setPost(nextPost);
        setType(nextPost.type);
        setTitle(nextPost.title);
        setDescription(nextPost.description);
        setPrice(
          nextPost.price != null
            ? formatAmountInput(String(nextPost.price))
            : "",
        );
        setCategory(categoryTag);
        setExtraTags(nextPost.tags.filter((tag) => tag !== categoryTag));
        setImages(
          nextPost.imageUrls.map((uri) => ({
            uri,
            uploadedUrl: uri,
          })),
        );
        setEditingLocked(Boolean(nextPost.hasMessages));
      } catch (err) {
        if (!cancelled) {
          handleApiError(err);
          router.replace("/(tabs)");
        }
      } finally {
        if (!cancelled) {
          setLoadingPost(false);
        }
      }
    };

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [deviceId, id, router, user?.uid]);

  useEffect(() => {
    if (!post?.id) {
      return;
    }

    if (!messagingReady || !user?.uid || !post.userId || post.userId !== user.uid) {
      setEditingLocked(Boolean(post.hasMessages));
      return;
    }

    const unsubscribe = subscribeToPostHasMessages(user.uid, post.id, (hasMessages) => {
      setEditingLocked(Boolean(post.hasMessages || hasMessages));
    });

    return unsubscribe;
  }, [messagingReady, post?.hasMessages, post?.id, post?.userId, user?.uid]);

  const handleClose = () => {
    if (typeof id === "string") {
      router.replace(`/post/${id}` as never);
      return;
    }

    router.replace("/(tabs)");
  };

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
    const currentDeviceId = deviceId ?? (await getDeviceId());
    if (!currentDeviceId) {
      throw new Error("Device ID not ready.");
    }

    const urls: string[] = [];
    for (const image of images) {
      if (image.uploadedUrl) {
        urls.push(image.uploadedUrl);
        continue;
      }

      const extension = image.fileName?.split(".").pop()?.toLowerCase() ?? "jpg";
      const blob = await uriToBlob(image.uri);
      const storageRef = ref(
        storage,
        `posts/${currentDeviceId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`,
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

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const normalizedPriceInput = stripNumericFormatting(price);
    const priceValue = normalizedPriceInput ? Number(normalizedPriceInput) : null;

    if (!trimmedTitle) {
      Alert.alert("Required", "Please enter a title.");
      return;
    }
    if (!trimmedDescription) {
      Alert.alert("Required", "Please enter a description.");
      return;
    }
    if (
      normalizedPriceInput &&
      (!Number.isFinite(priceValue) || priceValue === null || priceValue < 0)
    ) {
      Alert.alert("Invalid price", "Please enter a valid price amount.");
      return;
    }
    if (!post) {
      return;
    }
    if (editingLocked) {
      Alert.alert(
        "Editing locked",
        "This listing can no longer be edited because someone has already sent a message.",
      );
      return;
    }

    const token = await getIdToken();
    const currentDeviceId = deviceId ?? (await getDeviceId());
    if (!token && !currentDeviceId) {
      Alert.alert("Error", "Unable to verify this listing owner. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      if (images.length > 0 && imageUrls.length !== images.length) {
        throw new Error("One or more images could not be uploaded.");
      }

      const tags = Array.from(new Set([...(category ? [category] : []), ...extraTags]));
      await api.patch(
        `/api/posts/${post.id}`,
        {
          ...(currentDeviceId ? { deviceId: currentDeviceId } : {}),
          type,
          title: trimmedTitle,
          description: trimmedDescription,
          imageUrls,
          price: priceValue,
          currency: priceValue != null ? "NGN" : null,
          tags,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );

      Alert.alert("Success", "Your listing has been updated!", [
        {
          text: "OK",
          onPress: () => {
            fetchPosts();
            router.replace(`/post/${post.id}` as never);
          },
        },
      ]);
    } catch (err) {
      if (err instanceof Error && /image|upload/i.test(err.message)) {
        Alert.alert(
          "Photo upload failed",
          "Your changes were not saved because one of the selected images could not be uploaded. Please try again.",
        );
      } else {
        handleApiError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Listing</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.stateText}>Loading listing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post || editingLocked) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Listing</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.authGate}>
          <View style={styles.authGateIconWrap}>
            <Ionicons name="lock-closed-outline" size={48} color="#2563EB" />
          </View>
          <Text style={styles.authGateTitle}>Editing Locked</Text>
          <Text style={styles.authGateBody}>
            This listing can no longer be edited because someone has already sent a message.
          </Text>
          <Pressable style={styles.authGatePrimaryBtn} onPress={handleClose}>
            <Text style={styles.authGatePrimaryText}>Back to Listing</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={handleClose}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
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
              style={[styles.toggleText, type === "SALE" && styles.toggleTextActive]}
            >
              I want to sell
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, type === "REQUEST" && styles.toggleActive]}
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
            {images.map((image, i) => (
              <View key={`${image.uri}-${i}`} style={styles.photoPreview}>
                <Image source={{ uri: image.uri }} style={styles.photoImage} />
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

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>LISTING DETAILS</Text>
        <View style={styles.divider} />

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

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Price</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>NGN</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={price}
              onChangeText={handlePriceChange}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>

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
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.publishText}>Save Changes</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
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
  headerRightPlaceholder: { width: 44 },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 15,
    color: "#6B7280",
  },
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
    fontSize: 14,
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
