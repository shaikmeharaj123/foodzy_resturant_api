const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const DeliveryPersion = require("../models/DeliveryPersionModel");
const User = require("../models/UserModel");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[FCM Helper] Firebase Admin initialized successfully");
  } catch (initErr) {
    console.log("[FCM Helper Init Warning]:", initErr.message);
  }
}

/**
 * Sends a high-priority FCM notification to a specific Rider.
 * Works even when the Rider app is completely CLOSED / KILLED.
 */
async function sendRiderFcmNotification(riderId, { title, body, data = {} }) {
  if (!riderId || !admin.apps.length) return false;

  try {
    const rider = await DeliveryPersion.findById(riderId).select("fcmToken name");
    const token = rider?.fcmToken;

    if (!token || token.length < 20 || token.startsWith("fcm_mobile_")) {
      console.log(`[FCM Rider] Rider ${riderId} has no valid Google FCM token`);
      return false;
    }

    const stringData = Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key] ?? "");
      return acc;
    }, {});
    if (riderId && !stringData.riderId) {
      stringData.riderId = String(riderId);
    }

    const message = {
      token,
      notification: {
        title: String(title),
        body: String(body),
      },
      data: stringData,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
          priority: "max",
          defaultVibrateTimings: true,
          visibility: "public",
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM Rider] Sent "${title}" to rider ${riderId} successfully:`, response);
    return true;
  } catch (err) {
    console.log(`[FCM Rider Error] Rider ${riderId}:`, err.message);
    return false;
  }
}

/**
 * Sends a high-priority FCM notification to multiple Riders (multicast).
 * Works even when the Rider apps are completely CLOSED / KILLED.
 */
async function sendMultipleRidersFcmNotification(riderIds, { title, body, data = {} }) {
  if (!Array.isArray(riderIds) || riderIds.length === 0 || !admin.apps.length) return false;

  try {
    const riders = await DeliveryPersion.find({
      _id: { $in: riderIds },
      fcmToken: { $exists: true, $ne: "" },
    }).select("fcmToken");

    const tokens = riders
      .map(r => r.fcmToken)
      .filter(t => t && t.length > 20 && !t.startsWith("fcm_mobile_"));

    if (tokens.length === 0) {
      console.log("[FCM Multicast] No valid rider tokens found for dispatch");
      return false;
    }

    const stringData = Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key] ?? "");
      return acc;
    }, {});

    const message = {
      tokens,
      notification: {
        title: String(title),
        body: String(body),
      },
      data: stringData,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
          priority: "max",
          defaultVibrateTimings: true,
          visibility: "public",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `[FCM Multicast] Sent "${title}" to ${tokens.length} riders (Success: ${response.successCount}, Fail: ${response.failureCount})`
    );
    return true;
  } catch (err) {
    console.log("[FCM Multicast Error]:", err.message);
    return false;
  }
}

/**
 * Sends a high-priority FCM notification to a Customer.
 * Works even when the Customer app is completely CLOSED / KILLED.
 */
async function sendCustomerFcmNotification(userId, { title, body, data = {} }) {
  if (!userId || !admin.apps.length) return false;

  try {
    const user = await User.findById(userId).select("fcmToken token name");
    const token = user?.fcmToken || user?.token;

    if (!token || token.length < 20 || token.startsWith("fcm_mobile_")) {
      console.log(`[FCM Customer] User ${userId} has no valid Google FCM token`);
      return false;
    }

    const stringData = Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key] ?? "");
      return acc;
    }, {});
    if (userId && !stringData.userId) {
      stringData.userId = String(userId);
    }
    if (!stringData.category) {
      stringData.category = "orders";
    }

    const message = {
      token,
      notification: {
        title: String(title),
        body: String(body),
      },
      data: stringData,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "foodzy_orders",
          priority: "max",
          defaultVibrateTimings: true,
          visibility: "public",
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM Customer] Sent "${title}" to customer ${userId} successfully:`, response);
    return true;
  } catch (err) {
    console.log(`[FCM Customer Error] User ${userId}:`, err.message);
    return false;
  }
}

module.exports = {
  sendRiderFcmNotification,
  sendMultipleRidersFcmNotification,
  sendCustomerFcmNotification,
};
