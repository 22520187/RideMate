import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constant/colors";

const ReportDetailModal = ({ report, formatDate }) => {
  if (!report) return null;

  return (
    <View style={styles.container}>
      {/* Report Summary */}
      <View style={styles.reportSummary}>
        <Text style={styles.summaryLabel}>Báo cáo: #{report.id}</Text>
        
        {/* Report Title */}
        {report.title && (
          <Text style={styles.summaryTitle}>{report.title}</Text>
        )}
        
        {/* Report Description */}
        <Text style={styles.summaryText}>{report.description}</Text>
      </View>

      {/* Reported User Info */}
      {report.reportedUserName && (
        <View style={styles.reportedUserContainer}>
          <View style={styles.reportedUserHeader}>
            <Ionicons name="alert-circle" size={20} color="#F44336" />
            <Text style={styles.reportedUserHeaderText}>Người bị báo cáo</Text>
          </View>
          
          <View style={styles.reportedUserDetails}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color="#D32F2F" />
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{report.reportedUserName}</Text>
            </View>
            
            {report.reportedUserPhone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={16} color="#D32F2F" />
                <Text style={styles.infoLabel}>Số điện thoại:</Text>
                <Text style={styles.infoValue}>{report.reportedUserPhone}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Session Messages */}
      {report.sessionMessages && report.sessionMessages.length > 0 && (
        <View style={styles.sessionMessagesContainer}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="chatbubbles" size={16} color={COLORS.PRIMARY} />
            {" "}Tin nhắn trong chuyến đi ({report.sessionMessages.length})
          </Text>
          <ScrollView 
            style={styles.messagesScrollView} 
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            {report.sessionMessages.map((msg, index) => (
              <View key={msg.id || index} style={styles.messageItem}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageSender}>{msg.senderName}</Text>
                  <Text style={styles.messageTime}>
                    {formatDate(msg.createdAt)}
                  </Text>
                </View>
                <Text style={styles.messageContent}>{msg.content}</Text>
                {msg.type !== "TEXT" && (
                  <Text style={styles.messageType}>({msg.type})</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  reportSummary: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.BLACK,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  reportedUserContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  reportedUserHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFCDD2",
  },
  reportedUserHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#D32F2F",
  },
  reportedUserDetails: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B71C1C",
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C62828",
    flex: 1,
  },
  sessionMessagesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  messagesScrollView: {
    maxHeight: 250,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
  },
  messageItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.GRAY,
  },
  messageContent: {
    fontSize: 13,
    color: COLORS.GRAY,
    lineHeight: 18,
  },
  messageType: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontStyle: "italic",
    marginTop: 4,
  },
});

export default ReportDetailModal;
