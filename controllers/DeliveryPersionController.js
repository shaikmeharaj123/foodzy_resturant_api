const DeliveryPersion = require("../models/DeliveryPersionModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

exports.createDeliveryPersion = catchAsyncErrors(async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (!body.mobile && body.phone) {
      body.mobile = body.phone;
    }
    if (!body.vehicleNumber && body.valid_id) {
      body.vehicleNumber = body.valid_id;
    }
    if (!body.valid_id && body.vehicleNumber) {
      body.valid_id = body.vehicleNumber;
    }
    if (!body.city && body.address) {
      body.city = body.address;
    }
    if (!body.address && body.city) {
      body.address = body.city;
    }
    if (body.status === undefined) {
      body.status = true;
    }
    body.isVerified = false;
    body.isBlocked = false;
    body.valid_id = body.vehicleNumber || body.valid_id || "";
    delete body.open_status;
    delete body.block;
    delete body.verified;

    if (!body.riderStatus) {
      body.riderStatus = "online";
    }

    // 1. Upload Profile Image to Cloudinary
    if (body.profileImage && (body.profileImage.startsWith("data:") || body.profileImage.startsWith("http"))) {
      try {
        if (body.profileImage.startsWith("data:")) {
          const uploadedProfile = await cloudinary.v2.uploader.upload(
            body.profileImage,
            {
              folder: "DeliveryPartner/Profile",
              format: "webp",
            }
          );
          body.profileImage = uploadedProfile.secure_url;
          body.logo = uploadedProfile.secure_url;
        }
      } catch (cloudErr) {
        console.log("[Cloudinary] Profile image upload warning:", cloudErr.message);
      }
    }

    // 2. Upload Bike RC Document to Cloudinary
    if (body.bikeRC && body.bikeRC.startsWith("data:")) {
      try {
        const uploadedBikeRC = await cloudinary.v2.uploader.upload(
          body.bikeRC,
          {
            folder: "DeliveryPartner/Documents",
            format: "webp",
          }
        );
        body.bikeRC = uploadedBikeRC.secure_url;
      } catch (cloudErr) {
        console.log("[Cloudinary] Bike RC upload warning:", cloudErr.message);
      }
    }

    // 3. Upload Aadhaar Card Document to Cloudinary
    if (body.aadharCard && body.aadharCard.startsWith("data:")) {
      try {
        const uploadedAadhaar = await cloudinary.v2.uploader.upload(
          body.aadharCard,
          {
            folder: "DeliveryPartner/Documents",
            format: "webp",
          }
        );
        body.aadharCard = uploadedAadhaar.secure_url;
      } catch (cloudErr) {
        console.log("[Cloudinary] Aadhaar card upload warning:", cloudErr.message);
      }
    }

    const deliveryPersion = await DeliveryPersion.create(body);
    return res.status(201).json({
      success: true,
      deliveryPersion,
      data: deliveryPersion,
      message: "Delivery partner registered successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      const message = field
        ? `A delivery partner with this ${field} already exists.`
        : "Duplicate entry error. Mobile or email already registered.";
      return res.status(400).json({
        success: false,
        message,
        error: error,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});


exports.verify_deliveryPersion_Number = catchAsyncErrors(
  async (req, res, next) => {
    try {
      let deliveryPersion = await DeliveryPersion.findOne({
        mobile: req.params.mobile,
      });

      if (!deliveryPersion) {
        return res.status(200).json({
          success: false,
          message: "new deliveryPersion mobile",
        });
      }

      return res.status(200).json({
        success: true,
        message: " deliveryPersion mobile already exist",
        deliveryPersion: deliveryPersion,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error._message || error.message,
        error: error,
      });
    }
  },
);

exports.verify_deliveryPersion_Email = catchAsyncErrors(
  async (req, res, next) => {
    try {
      let deliveryPersion = await DeliveryPersion.findOne({
        email: req.params.email,
      });

      if (!deliveryPersion) {
        return res.status(200).json({
          success: false,
          message: "new deliveryPersion email",
        });
      }

      return res.status(200).json({
        success: true,
        message: " deliveryPersion email already exist",
        deliveryPersion: deliveryPersion,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error._message || error.message,
        error: error,
      });
    }
  },
);

exports.verify_deliveryPersion_valid_id = catchAsyncErrors(
  async (req, res, next) => {
    try {
      let deliveryPersion = await DeliveryPersion.findOne({
        valid_id: req.params.valid_id,
      });

      if (!deliveryPersion) {
        return res.status(200).json({
          success: false,
          message: "new deliveryPersion id",
        });
      }

      return res.status(200).json({
        success: true,
        message: " deliveryPersion id already exist",
        deliveryPersion: deliveryPersion,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error._message || error.message,
        error: error,
      });
    }
  },
);

exports.send_JWS_token = catchAsyncErrors(async (req, res, next) => {
  try {
    const mobile = req.body.mobile;

    if (!Number(mobile)) {
      return res.status(201).json({
        success: false,
        massage: "Invalid mobile",
      });
    } else {
      if (!mobile) {
        return res.status(201).json({
          success: false,
          massage: "Invalid mobile",
        });
      }
      const deliveryPersion = await DeliveryPersion.findOne({ mobile: mobile });
      if (!deliveryPersion) {
        return res.status(201).json({
          success: false,
          massage: "delivery Persion not found",
        });
      } else {
        const SECRET_KEY = process.env.SECRET_KEY;
        const token = jwt.sign({ mobile }, SECRET_KEY, { expiresIn: "1m" });
        return res.status(201).json({
          success: true,
          token: `Basic ${token}`,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error._message || error.message,
      error: error,
    });
  }
});

exports.get_protected_delivery_partner_data = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        return res.status(401).send("Authorization header missing");
      }
      const [scheme, credentials] = authHeader.split(" ");
      if (scheme !== "Basic") {
        res.status(201).json({
          success: false,
          massage: "Unsupported authorization scheme",
        });
      }

      jwt.verify(credentials, process.env.SECRET_KEY, async (err, decoded) => {
        if (err) {
          res.status(201).json({
            success: false,
            massage: "Invalid token",
          });
        } else {
          const data = decoded;
          const experire_date = new Date(data.exp * 1000);
          const current_date = new Date();
          if (experire_date > current_date) {
            if (data.mobile) {
              const deliveryPersion = await DeliveryPersion.findOne({
                mobile: data.mobile,
              });
              if (!deliveryPersion) {
                res.status(201).json({
                  success: false,
                  massage: "deliveryPersion not found",
                });
              }
              const SECRET_KEY = process.env.SECRET_KEY;
              const token = jwt.sign({ deliveryPersion }, SECRET_KEY, {
                expiresIn: "5m",
              });
              next();
              res.status(201).json({
                success: true,
                deliveryPersion: deliveryPersion,
                // token: token,
                massage: "Authorized",
              });
            } else {
              res.status(401).json({
                success: false,
                massage: "Unauthorized",
              });
            }
          } else {
            res.status(401).json({
              success: false,
              massage: "Token has expired",
            });
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error._message || error.message,
        error: error,
      });
    }
  },
);

exports.getDeliveryPersionById = catchAsyncErrors(async (req, res, next) => {
  try {
    const deliveryPersion = await DeliveryPersion.findById(req.params.id);
    if (!deliveryPersion) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }
    return res.status(200).json({
      success: true,
      deliveryPersion,
      data: deliveryPersion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.updateDeliveryPersion = catchAsyncErrors(async (req, res, next) => {
  try {
    let deliveryPersion = await DeliveryPersion.findById(req.params.id);
    if (!deliveryPersion) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }
    const body = { ...req.body };

    // Upload profile image to Cloudinary if updated
    if (body.profileImage && (body.profileImage.startsWith("data:") || body.profileImage.startsWith("http"))) {
      try {
        if (body.profileImage.startsWith("data:")) {
          const uploadedProfile = await cloudinary.v2.uploader.upload(
            body.profileImage,
            {
              folder: "DeliveryPartner/Profile",
              format: "webp",
            }
          );
          body.profileImage = uploadedProfile.secure_url;
          body.logo = uploadedProfile.secure_url;
        }
      } catch (cloudErr) {
        console.log("[Cloudinary] Profile update warning:", cloudErr.message);
      }
    }

    // Upload Bike RC to Cloudinary if updated
    if (body.bikeRC && body.bikeRC.startsWith("data:")) {
      try {
        const uploadedBikeRC = await cloudinary.v2.uploader.upload(
          body.bikeRC,
          {
            folder: "DeliveryPartner/Documents",
            format: "webp",
          }
        );
        body.bikeRC = uploadedBikeRC.secure_url;
      } catch (cloudErr) {
        console.log("[Cloudinary] Bike RC update warning:", cloudErr.message);
      }
    }

    // Upload Aadhaar Card to Cloudinary if updated
    if (body.aadharCard && body.aadharCard.startsWith("data:")) {
      try {
        const uploadedAadhaar = await cloudinary.v2.uploader.upload(
          body.aadharCard,
          {
            folder: "DeliveryPartner/Documents",
            format: "webp",
          }
        );
        body.aadharCard = uploadedAadhaar.secure_url;
      } catch (cloudErr) {
        console.log("[Cloudinary] Aadhaar update warning:", cloudErr.message);
      }
    }

    // Handle vehicle / documents re-verification
    const vehicleChanged =
      body.vehicleNumber &&
      deliveryPersion.vehicleNumber &&
      body.vehicleNumber.trim() !== deliveryPersion.vehicleNumber.trim();
    const docsChanged =
      (body.bikeRC && body.bikeRC !== deliveryPersion.bikeRC) ||
      (body.aadharCard && body.aadharCard !== deliveryPersion.aadharCard);

    if (body.isVerified === true) {
      body.reVerificationRequired = false;
      body.reVerificationFields = [];
      body.vehicleVerificationStatus = "verified";
      body.documentVerificationStatus = "verified";
    } else if (vehicleChanged || docsChanged || body.reVerificationRequired === true) {
      body.reVerificationRequired = true;
      const fields = Array.isArray(body.reVerificationFields)
        ? [...body.reVerificationFields]
        : [];
      if (vehicleChanged && !fields.includes("vehicle")) fields.push("vehicle");
      if (docsChanged && !fields.includes("documents")) fields.push("documents");
      body.reVerificationFields = fields;
      body.reVerificationDate = new Date();
      body.reVerificationReason =
        body.reVerificationReason ||
        `Re-verification requested for: ${fields.join(", ")}`;
      if (vehicleChanged) body.vehicleVerificationStatus = "pending";
      if (docsChanged) body.documentVerificationStatus = "pending";
      body.isVerified = false;
    }

    const wasAlreadyVerified = deliveryPersion?.isVerified === true;
    deliveryPersion = await DeliveryPersion.findByIdAndUpdate(
      req.params.id,
      body,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    );

    // If account was just verified, dispatch realtime socket & FCM push notifications
    if (body.isVerified === true && !wasAlreadyVerified) {
      try {
        const io = req.app?.get("io");
        const notificationPayload = {
          id: `account-verified-${deliveryPersion._id}`,
          title: "Account Verified! 🎉",
          message: `Congratulations ${deliveryPersion.name || "Rider"}! Your rider account has been verified and approved. You can now go online and accept orders.`,
          body: `Congratulations ${deliveryPersion.name || "Rider"}! Your rider account has been verified and approved. You can now go online and accept orders.`,
          type: "account_verified",
          statusKey: "account_verified",
          category: "system",
          riderId: String(deliveryPersion._id),
          route: "HomeScreen",
          createdAt: new Date().toISOString(),
          timestamp: Date.now(),
          read: false,
        };

        if (io) {
          io.to(`rider_${deliveryPersion._id}`).emit("rider:custom_notification", notificationPayload);
          io.to(`rider_${deliveryPersion._id}`).emit("rider:account_verified", {
            riderId: String(deliveryPersion._id),
            isVerified: true,
            deliveryPersion,
            notification: notificationPayload,
          });
          console.log(`[Socket] Account verified notification emitted to rider_${deliveryPersion._id}`);
        }

        if (
          deliveryPersion?.fcmToken &&
          admin?.apps?.length &&
          !deliveryPersion.fcmToken.startsWith("fcm_mobile_")
        ) {
          admin
            .messaging()
            .send({
              token: deliveryPersion.fcmToken,
              notification: {
                title: notificationPayload.title,
                body: notificationPayload.message,
              },
              data: {
                type: "account_verified",
                statusKey: "account_verified",
                route: "HomeScreen",
                riderId: String(deliveryPersion._id),
              },
            })
            .catch(err =>
              console.log("[FCM Rider Verification Warning]", err.message)
            );
        }
      } catch (notifyErr) {
        console.log("[Verification Notification Warning]", notifyErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      deliveryPersion,
      data: deliveryPersion,
      message: "Profile updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.uploadDeliveryPartnerImage = catchAsyncErrors(async (req, res, next) => {
  try {
    const { image, folder = "DeliveryPartner" } = req.body;
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image data is required",
      });
    }

    const uploaded = await cloudinary.v2.uploader.upload(image, {
      folder: `DeliveryPartner/${folder}`,
      format: "webp",
    });

    return res.status(200).json({
      success: true,
      url: uploaded.secure_url,
      secure_url: uploaded.secure_url,
      message: "Image uploaded to Cloudinary successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

exports.toggleDeliveryPartnerStatus = catchAsyncErrors(
  async (req, res, next) => {
    try {
      let deliveryPersion = await DeliveryPersion.findById(req.params.id);
      if (!deliveryPersion) {
        return res.status(404).json({
          success: false,
          message: "Delivery partner not found",
        });
      }

      let newStatus;
      if (typeof req.body?.status === "boolean") {
        newStatus = req.body.status;
      } else if (typeof req.body?.status === "string") {
        newStatus =
          req.body.status.toLowerCase() === "true" ||
          req.body.status.toLowerCase() === "online" ||
          req.body.status.toLowerCase() === "duty";
      } else {
        newStatus = !deliveryPersion.status;
      }

      const riderStatusVal = newStatus ? "online" : "offline";
      deliveryPersion = await DeliveryPersion.findByIdAndUpdate(
        req.params.id,
        {
          status: newStatus,
          open_status: newStatus,
          riderStatus: riderStatusVal,
        },
        { new: true, runValidators: true, useFindAndModify: false },
      );
      return res.status(200).json({
        success: true,
        deliveryPersion,
        data: deliveryPersion,
        isOnline: newStatus,
        message: newStatus ? "You are now Online" : "You are now Offline",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || error._message,
        error: error,
      });
    }
  },
);

exports.getAllDeliveryPartners = catchAsyncErrors(async (req, res, next) => {
  try {
    const deliveryPartners = await DeliveryPersion.find();
    return res.status(200).json({
      success: true,
      count: deliveryPartners.length,
      deliveryPartners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error._message,
      error: error,
    });
  }
});

