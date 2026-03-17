import { formatCurrency } from "@/lib/formatters";
import { useStore } from "@/store/useStore";
import type { PaymentTransaction } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getTransactionDateLabel(transaction: PaymentTransaction) {
  return new Date(
    transaction.completedAt ?? transaction.createdAt,
  ).toLocaleString();
}

function getTransactionAmountLabel(transaction: PaymentTransaction) {
  return `${formatCurrency(
    transaction.amountPaid,
    transaction.currency,
    transaction.currency === "USD" ? 2 : 0,
  )} (${transaction.currency})`;
}

function getTransactionStatusLabel(status: string) {
  if (!status) return "Unknown";
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function TransactionField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.transactionRow}>
      <Text style={styles.transactionLabel}>{label}</Text>
      <Text style={styles.transactionValue}>{value}</Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const transactions = useStore((state) => state.transactions);
  const transactionsLoading = useStore((state) => state.transactionsLoading);
  const fetchTransactions = useStore((state) => state.fetchTransactions);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    void fetchTransactions();
  }, [fetchTransactions, user]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!user ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sign in to view transactions</Text>
            <Text style={styles.emptyText}>
              Your token purchases and payment references will appear here once
              you sign in.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </Pressable>
          </View>
        ) : transactionsLoading && transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.emptyText}>Loading your transactions...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>
              Completed token purchases will show up here newest first.
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <TransactionField
                label="Date"
                value={getTransactionDateLabel(transaction)}
              />
              <TransactionField
                label="Amount"
                value={getTransactionAmountLabel(transaction)}
              />
              <TransactionField label="Bundle" value={transaction.bundle} />
              <TransactionField
                label="Tokens bought"
                value={transaction.units.toString()}
              />
              <TransactionField
                label="Reference"
                value={transaction.paymentRef}
              />
              <TransactionField
                label="Status"
                value={getTransactionStatusLabel(transaction.status)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 24,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  headerSpacer: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 12,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  transactionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  transactionValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "right",
  },
});
