const mongoose = require("mongoose");
const validator = require("validator");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
      default: "",
    },
    deliveryVerifiedAt: {
      type: Date,
      default: null,
    },
    deliveryVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
      default: null,
    },
    Username: {
      type: String,
      required: [true, "Please Enter User Name"],
      trim: true,
      default: "Customer",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId Required"],
    },
    Usermobile: {
      type: Number,
      default: 9999999999,
    },
    Useremail: {
      type: String,
      default: "user@fooddelivery.com",
    },
    userAddress: {
      Latitude: {
        type: String,
        default: "17.4483",
      },
      Longitude: {
        type: String,
        default: "78.3915",
      },
      address: {
        type: String,
        default: "Selected Address",
      },
      house_no: {
        type: String,
        default: "",
      },
      landmark: {
        type: String,
        default: "",
      },
      type: {
        type: String,
        default: "Home",
      },
      prime: {
        type: Boolean,
        default: false,
      },
    },
    restauntId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "restauntId Required"],
    },
    restauntName: {
      type: String,
      required: [true, "restaunt Required"],
      default: "Restaurant",
    },
    restauntmobile: {
      type: Number,
      default: 9999999999,
    },
    restauntemail: {
      type: String,
      default: "restaurant@fooddelivery.com",
    },
    restauntAddress: {
      type: String,
      default: "Restaurant Address",
    },
    restauntLatitude: {
      type: String,
      default: "17.4009",
    },
    restauntLongitude: {
      type: String,
      default: "78.4860",
    },
    DeliveryPersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
      default: null,
    },
    DeliveryPersionName: {
      type: String,
      default: "",
    },
    DeliveryPersionmobile: {
      type: Number,
      default: 0,
    },
    DeliveryPersionemail: {
      type: String,
      default: "",
    },
    DeliveryPersionAddress: {
      type: String,
      default: "",
    },
    DeliveryPersionLatitude: {
      type: String,
      default: "",
    },
    DeliveryPersionLongitude: {
      type: String,
      default: "",
    },
    order_specifications: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Pending",
    },
    order_status: {
      type: Number,
      default: 1,
    },
    payment_mode: {
      type: String,
      default: "COD",
    },
    payment_status: {
      type: String,
      enum: ["Paid", "Unpaid", "paid", "unpaid", "Pending", "pending"],
      default: "Unpaid",
    },
    onlinePayment: {
      provider: {
        type: String,
        default: "",
      },
      paymentLinkId: {
        type: String,
        default: "",
      },
      paymentLinkUrl: {
        type: String,
        default: "",
      },
      amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
      },
      paidAt: {
        type: Date,
      },
    },

    //user show
    total_Amount: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    delivery_Charge: {
      type: Number,
      default: 0,
    },
    platform_fee: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      default: 0,
    },
    total_net_payable: {
      type: Number,
      default: 0,
    },
    rain_fee: {
      type: Number,
      default: 0,
    },
    peektime_fee: {
      type: Number,
      default: 0,
    },
    more_distance: {
      type: Number,
      default: 0,
    },
    distance: {
      type: String,
      default: "",
    },
    time_takes: {
      type: String,
      default: "",
    },
    delivery_tip: {
      type: Number,
      default: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    coupon_amount: {
      type: Number,
      default: 0,
    },
    order_mode: {
      type: String,
      enum: ["Delivery", "Pickup", "Dining"],
      default: "Delivery",
    },
    userpreference: {
      type: String,
      default: "",
    },
    table_number: {
      type: String,
      default: "",
    },
    guest_count: {
      type: Number,
      default: 1,
    },
    booking_time: {
      type: String,
      default: "",
    },
    pickup_time: {
      type: String,
      default: "",
    },

    //coupon
    coupon_from: {
      name: {
        type: String,
      },
      code: {
        type: String,
      },
      minimum_cart_value: {
        type: Number,
      },
      maximum_discount: {
        type: Number,
      },
      discount_percentage: {
        type: Number,
      },
      no_of_avalability: {
        type: Number,
      },
      type: {
        type: String,
      },
      coupon_responce: {
        type: String,
      },
      startDate: {
        type: Date,
      },
      expireDate: {
        type: Date,
      },
    },

    //restaurent
    restaurent_total_Amount: {
      type: Number,
      default: 0,
    },
    restaurent_gst: {
      type: Number,
      default: 0,
    },

    restaurent_total_net_payable: {
      type: Number,
      default: 0,
    },

    peperation_time: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    riderRating: {
      type: Number,
      default: 0,
    },
    isRated: {
      type: Boolean,
      default: false,
    },
    partner_order_accept_time: {
      type: Date,
    },
    partner_order_delivery_time: {
      type: Date,
    },
    partner_order_total_time: {
      type: Number,
      default: 0,
    },

    // Delivery Partner Settlement Breakdown
    deliverySettlement: {
      distanceKm: {
        type: Number,
        default: 0,
      },
      distanceUnit: {
        type: String,
        default: "km",
      },
      basePay: {
        type: Number,
        default: 0,
      },
      distancePay: {
        type: Number,
        default: 0,
      },
      peakPay: {
        type: Number,
        default: 0,
      },
      rainPay: {
        type: Number,
        default: 0,
      },
      demandPay: {
        type: Number,
        default: 0,
      },
      incentiveAmount: {
        type: Number,
        default: 0,
      },
      deliveryTip: {
        type: Number,
        default: 0,
      },
      totalPartnerEarning: {
        type: Number,
        default: 0,
      },
      settlementStatus: {
        type: String,
        enum: ["PENDING", "ELIGIBLE", "PAID", "CANCELLED"],
        default: "PENDING",
      },
      cancellationReason: {
        type: String,
        default: "",
      },
      calculatedAt: {
        type: Date,
        default: Date.now,
      },
      lockedAt: {
        type: Date,
      },
    },

    // Restaurant / Shop Settlement Breakdown
    restaurantSettlement: {
      foodSubtotal: {
        type: Number,
        default: 0,
      },
      commissionRate: {
        type: Number,
        default: 15,
      },
      commissionAmount: {
        type: Number,
        default: 0,
      },
      gst: {
        type: Number,
        default: 0,
      },
      netPayout: {
        type: Number,
        default: 0,
      },
      settlementStatus: {
        type: String,
        enum: ["PENDING", "ELIGIBLE", "PAID", "CANCELLED"],
        default: "PENDING",
      },
      settledAt: {
        type: Date,
      },
      settlementRef: {
        type: String,
        default: "",
      },
      calculatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    produucts: [
      {
        productId: {
          type: mongoose.Schema.Types.Mixed,
          required: [true, "productId Required"],
        },
        name: {
          type: String,
          required: [true, "Please enter name"],
          trim: true,
        },
        slugUrl: {
          type: String,
          default: "food-item",
        },
        description: {
          type: String,
          default: "",
        },
        category: {
          type: String,
          default: "Food",
        },
        categoryUrl: {
          type: String,
          default: "food",
        },
        thumbnail: {
          type: String,
          default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        },
        packId: {
          type: String,
          default: "pack_default",
        },
        packSizeName: {
          type: String,
          default: "Standard",
        },
        Price: {
          type: Number,
          default: 0,
        },
        cartQuentity: {
          type: Number,
          default: 1,
        },
        TotalPrice: {
          type: Number,
          default: 0,
        },
      },
    ],

    order_expected_date: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  // { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
