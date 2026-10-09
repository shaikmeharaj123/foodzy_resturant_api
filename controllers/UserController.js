const User = require("../models/UserModel");
const Wallet = require("../models/walletModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const admin = require("firebase-admin");
const serviceAccount = require("../utils/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

//create user
// exports.createUser = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const user = await User.create(req.body);
//     if (!user) {
//       return res.status(200).json({
//         success: false,
//         message: "user not created",
//       });
//     }
//     return res.status(201).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || error._message,
//       massage: error.message || error._message,
//       error: error,
//     });
//   }
// });

exports.createUser = catchAsyncErrors(async (req, res) => {
  const user = await User.create(req.body);

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "User not created" });
  }

  try {
    const wallet = await Wallet.create({
      ClientId: user._id,
      availableAmount: 0,
      transactionAmount: 0,
      previousAmount: [],
    });

    user.walletId = wallet._id;
    user.WalletBalance = wallet.availableAmount;
    await user.save();

    return res.status(201).json({
      success: true,
      user,
      wallet,
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
});

exports.send_JWS_token = catchAsyncErrors(async (req, res, next) => {
  try {
    const mobile = req.body.mobile;
    const SECRET_KEY = process.env.SECRET_KEY || "default_secret";
    const token = jwt.sign({ mobile }, SECRET_KEY, { expiresIn: "1m" });
    return res.status(201).json({
      success: true,
      token: `Basic ${token}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.get_protected_user_data = catchAsyncErrors(async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).send("Authorization header missing");
    }
    const [scheme, credentials] = authHeader.split(" ");
    if (scheme !== "Basic") {
      return res.status(401).send("Unsupported authorization scheme");
    }

    jwt.verify(credentials, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(200).json({
          success: false,
          massage: "Invalid token",
        });
      } else {
        const data = decoded;
        const experire_date = new Date(data.exp * 1000);
        const current_date = new Date();
        if (experire_date > current_date) {
          if (data.mobile) {
            const user = await User.findOne({ mobile: data.mobile });
            if (!user) {
              return res.status(200).json({
                success: false,
                massage: "user not found",
              });
            }
            return res.status(200).json({
              success: true,
              user: user,
              massage: "Authorized",
            });
          } else {
            return res.status(401).json({
              success: false,
              massage: "Unauthorized",
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            massage: "Token has expired",
          });
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.mobileExist = catchAsyncErrors(async (req, res, next) => {
  try {
    let user = await User.findOne({ mobile: req.params.mobile });
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "new mobile number",
      });
    }
    return res.status(200).json({
      success: true,
      message: " mobile number already exits",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.emailExist = catchAsyncErrors(async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.params.email });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "new email",
      });
    }
    return res.status(200).json({
      success: true,
      message: " email already exist",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.Add_Address = catchAsyncErrors(async (req, res, next) => {
  try {
    let user = await User.findById(req.body.UserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newAddress = {
      Latitude: String(req.body.Latitude || req.body.latitude || ""),
      Longitude: String(req.body.Longitude || req.body.longitude || ""),
      address: req.body.address || req.body.address_line_1 || "",
      house_no: req.body.house_no || "",
      landmark: req.body.landmark || "",
      type: req.body.type || req.body.address_type || "Home",
      prime: Boolean(req.body.prime),
    };

    user.address = [...user.address, newAddress];
    user = await User.findByIdAndUpdate(
      req.body.UserId,
      { address: user.address },
      {
        new: true,
        useFindAndModify: false,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      address: user.address,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.update_Address = catchAsyncErrors(async (req, res, next) => {
  try {
    let user = await User.findById(req.body.UserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const rawAddr = req.body.address || req.body;
    const updatedAddressData = {
      Latitude: String(rawAddr.Latitude || rawAddr.latitude || ""),
      Longitude: String(rawAddr.Longitude || rawAddr.longitude || ""),
      address: rawAddr.address || rawAddr.address_line_1 || "",
      house_no: rawAddr.house_no || "",
      landmark: rawAddr.landmark || "",
      type: rawAddr.type || rawAddr.address_type || "Home",
      prime: Boolean(rawAddr.prime),
    };

    user.address = user.address.map((addr) => {
      if (
        String(addr._id) === String(req.body.addressId) ||
        String(addr._id) === String(rawAddr._id)
      ) {
        return {
          ...(addr.toObject ? addr.toObject() : addr),
          ...updatedAddressData,
          _id: addr._id,
        };
      }
      return addr;
    });

    user = await User.findByIdAndUpdate(
      req.body.UserId,
      { address: user.address },
      {
        new: true,
        useFindAndModify: false,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      address: user.address,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.update_all_user = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.find();

    for (let index = 0; index < user.length; index++) {
      let element = user[index];
      element = await User.findByIdAndUpdate(
        element._id,
        { token: "" },
        {
          new: true,
          useFindAndModify: false,
          runValidators: true,
        },
      );
    }
    return res.status(201).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.update_user = catchAsyncErrors(async (req, res, next) => {
  try {
    const targetId = req.body.UserId || req.body.userId;
    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    let user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Mirror token and fcmToken
    if (req.body.fcmToken && !req.body.token) req.body.token = req.body.fcmToken;
    if (req.body.token && !req.body.fcmToken) req.body.fcmToken = req.body.token;

    if (
      req.body.email &&
      req.body.email.trim() &&
      req.body.email.trim().toLowerCase() !== (user.email || "").toLowerCase()
    ) {
      const emailExist = await User.findOne({
        email: req.body.email.trim(),
        _id: { $ne: user._id },
      });
      if (emailExist) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered with another account",
        });
      }
    }

    user = await User.findByIdAndUpdate(user._id, req.body, {
      new: true,
      useFindAndModify: false,
      runValidators: false,
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.delete_Address = catchAsyncErrors(async (req, res, next) => {
  try {
    let user = await User.findById(req.body.UserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.address = user.address.filter(
      (address) => String(address._id) !== String(req.body.addressId),
    );
    user = await User.findByIdAndUpdate(
      req.body.UserId,
      { address: user.address },
      {
        new: true,
        useFindAndModify: false,
        runValidators: true,
      },
    );
    return res.status(200).json({
      success: true,
      address: user.address,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.send_user_notification = catchAsyncErrors(async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.body.UserId;
    let targetToken = req.body.token || req.body.fcmToken;

    if (!targetToken && targetUserId) {
      const u = await User.findById(targetUserId);
      if (u) {
        targetToken = u.fcmToken || u.token;
      }
    }

    const title = req.body.notificationTitle || req.body.title || "Foodzy Notification";
    const body = req.body.notificationBody || req.body.body || req.body.message || "";

    const notificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title,
      body,
      message: body,
      category: req.body.category || "offers",
      route: req.body.route || "NotificationScreen",
      data: req.body.data || {},
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    // 1. Immediate real-time socket delivery to client
    const io = req.app?.get("io");
    if (io) {
      if (targetUserId) {
        io.to(`user_${targetUserId}`).emit("customer:notification", notificationPayload);
      }
      io.to("all_customers").emit("customer:notification", notificationPayload);
      io.emit("customer:notification", notificationPayload);
      console.log(`[Socket Notification] Delivered customer notification: "${title}"`);
    }

    // 2. FCM Push delivery if token is present
    let fcmResponse = null;
    let fcmError = null;
    if (targetToken && admin?.apps?.length) {
      try {
        const message = {
          notification: { title, body },
          data: { ...(req.body.data || {}), click_action: "FLUTTER_NOTIFICATION_CLICK" },
          token: targetToken,
        };
        fcmResponse = await admin.messaging().send(message);
        console.log(`[FCM Push] Sent to device: ${fcmResponse}`);
      } catch (err) {
        fcmError = err.message;
        console.log(`[FCM Notice] Push delivery: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Notification delivered successfully",
      deliveredVia: fcmResponse ? ["Socket.IO", "Firebase FCM"] : ["Socket.IO"],
      notification: notificationPayload,
      fcmNotice: fcmError,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      massage: error.message || error._message,
      error: error,
    });
  }
});

exports.get_all_users = catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
});

exports.update_user_fcm_token = catchAsyncErrors(async (req, res, next) => {
  const { userId, UserId, mobile, fcmToken, token } = req.body;
  const targetUserId = userId || UserId;
  let targetToken = fcmToken || token;

  // Auto-generate random FCM token if none provided or requested
  if (!targetToken) {
    targetToken = `fcm_mobile_${Date.now()}_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`;
  }

  let user = null;
  if (targetUserId) {
    user = await User.findById(targetUserId);
  } else if (mobile) {
    user = await User.findOne({ mobile: Number(mobile) });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found with provided userId or mobile",
    });
  }

  user.token = targetToken;
  user.fcmToken = targetToken;
  await user.save({ validateBeforeSave: false });

  console.log(`[FCM] User ${user._id} (mobile: ${user.mobile}) token stored in DB successfully: ${targetToken.substring(0, 25)}...`);

  return res.status(200).json({
    success: true,
    message: "FCM token updated successfully",
    userId: user._id,
    mobile: user.mobile,
    fcmToken: targetToken,
    token: targetToken,
  });
});

exports.generate_random_fcm_token = catchAsyncErrors(async (req, res, next) => {
  const { mobile, userId } = req.body || {};
  const queryMobile = mobile || req.query?.mobile;
  const queryUserId = userId || req.query?.userId;

  let query = {};
  if (queryUserId) {
    query._id = queryUserId;
  } else if (queryMobile) {
    query.mobile = Number(queryMobile);
  }

  if (Object.keys(query).length > 0) {
    const randomToken = `fcm_mobile_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const user = await User.findOneAndUpdate(
      query,
      { token: randomToken, fcmToken: randomToken },
      { new: true, runValidators: false }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Random FCM token generated and saved",
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        fcmToken: user.fcmToken,
        token: user.token,
      },
    });
  } else {
    // Generate random tokens for all users without tokens
    const users = await User.find({
      $or: [
        { fcmToken: "" },
        { fcmToken: { $exists: false } },
        { token: "" },
        { token: { $exists: false } },
      ],
    });

    for (let u of users) {
      const genToken = `fcm_mobile_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      u.fcmToken = genToken;
      u.token = genToken;
      await u.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      message: `Generated random FCM tokens for ${users.length} users`,
      count: users.length,
    });
  }
});
