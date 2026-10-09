const Wallet = require("../models/walletModel.js");
const Client = require("../models/UserModel.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");

const generateTransactionId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `UGFMART${timestamp}${random}`;
};

const ensureWalletForClient = async clientId => {
  const client = await Client.findById(clientId);
  if (!client) {
    const error = new Error("Client not found");
    error.statusCode = 404;
    throw error;
  }

  let wallet = await Wallet.findOne({ ClientId: client._id });
  if (!wallet) {
    try {
      wallet = await Wallet.create({
        ClientId: client._id,
        availableAmount: 0,
        transactionAmount: 0,
        previousAmount: [],
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      wallet = await Wallet.findOne({ ClientId: client._id });
    }
  }

  if (!wallet) throw new Error("Unable to create wallet");

  if (
    String(client.walletId || "") !== String(wallet._id) ||
    Number(client.WalletBalance) !== Number(wallet.availableAmount)
  ) {
    client.walletId = wallet._id;
    client.WalletBalance = Number(wallet.availableAmount) || 0;
    await client.save();
  }

  return wallet;
};

exports.createWallet = async (req, res, next) => {
  try {
    if (!req.body?.ClientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    const existingWallet = await Wallet.findOne({ClientId: req.body.ClientId});
    const wallet = existingWallet || (await ensureWalletForClient(req.body.ClientId));

    res.status(existingWallet ? 200 : 201).json({
      success: true,
      wallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getWalletByClientId = catchAsyncErrors(async (req, res) => {
  const wallet = await ensureWalletForClient(req.params.clientId);
  const transactions = Array.isArray(wallet.previousAmount)
    ? [...wallet.previousAmount].sort(
        (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
      )
    : [];

  return res.status(200).json({
    success: true,
    wallet: {...wallet.toObject(), transactions},
  });
});

exports.updateWallet = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Wallet ID is required",
    });
  }

  const { transactionAmount, Type, PaymentStatus, TxnId } = req.body;

  // Find wallet by wallet ID, ClientId, or composite ID
  const mongoose = require("mongoose");
  let wallet = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    wallet = await Wallet.findById(id);
    if (!wallet) {
      wallet = await Wallet.findOne({ ClientId: id });
    }
  } else if (String(id).includes("-")) {
    const rawWalletId = String(id).split("-")[0];
    if (mongoose.Types.ObjectId.isValid(rawWalletId)) {
      wallet = await Wallet.findById(rawWalletId);
    }
  }

  if (!wallet) {
    try {
      wallet = await ensureWalletForClient(id);
    } catch (_) {}
  }

  if (!wallet) {
    return res.status(404).json({
      success: false,
      message: "Wallet transaction not found",
    });
  }

  // Find client
  const client = await Client.findById(wallet.ClientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  const transactionType = String(Type || "")
    .trim()
    .toLowerCase();
  const creditTypes = ["credit", "cashback", "refund"];
  const debitTypes = ["debit", "subscription"];

  if (
    !creditTypes.includes(transactionType) &&
    !debitTypes.includes(transactionType)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Transaction type must be credit, debit, cashback, refund, or subscription",
    });
  }

  // The wallet document is the balance source of truth.  Always sync the
  // client balance from it so a past mismatch cannot continue growing.
  // A wallet may start at ₹0. Credits are allowed from a zero balance.
  // Only debit/subscription transactions require sufficient existing balance.
  const currentBalance = Number(wallet.availableAmount) || 0;
  const amount = Number(transactionAmount);
  const transactionId = String(
    TxnId || wallet.TxnId || generateTransactionId(),
  ).trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Transaction amount must be greater than zero",
    });
  }

  // Credits add money; debits and subscriptions subtract money.
  const isDebit = debitTypes.includes(transactionType);
  if (isDebit) {
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance for debit transaction",
      });
    }
  }
  // Do not reject currentBalance === 0 for credit/cashback/refund.
  const newBalance = isDebit
    ? currentBalance - amount
    : currentBalance + amount;

  // ✅ Create previousAmount entry with ONLY required fields
  const previousAmountEntry = {
    amount: currentBalance,
    addedAmount: isDebit ? -amount : amount,
    transactionType,
    txnId: transactionId,
  };

  // ✅ ONLY add optional fields if they have values (non-empty)
  const valueIfPresent = (value) => {
    if (typeof value !== "string") return value ? value : undefined;
    const trimmedValue = value.trim();
    return trimmedValue || undefined;
  };

  const orderId = valueIfPresent(req.body.orderId);
  const subscriptionId = valueIfPresent(req.body.subscriptionId);
  const paymentStatus = valueIfPresent(PaymentStatus);
  const paymentId = valueIfPresent(req.body.PaymentId);

  if (orderId) previousAmountEntry.orderId = orderId;
  if (subscriptionId) previousAmountEntry.subscriptionId = subscriptionId;
  if (paymentStatus) previousAmountEntry.paymentStatus = paymentStatus;
  if (paymentId) previousAmountEntry.paymentId = paymentId;

  previousAmountEntry.createdAt = new Date();
  previousAmountEntry.updatedAt = new Date();

  // Update the wallet summary and append the transaction safely.
  const walletHistory = Array.isArray(wallet.previousAmount)
    ? wallet.previousAmount
    : [];
  const walletUpdate = {
    transactionAmount: amount,
    Type: transactionType,
    PaymentStatus: paymentStatus || "",
    TxnId: transactionId,
    previousAmount: [...walletHistory, previousAmountEntry],
    availableAmount: newBalance,
    updatedAt: new Date(),
    ...(orderId ? { orderId } : {}),
    ...(subscriptionId ? { subscriptionId } : {}),
    ...(paymentId ? { PaymentId: paymentId } : {}),
  };

  const updatedWallet = await Wallet.findByIdAndUpdate(id, walletUpdate, {
    new: true,
    runValidators: true,
  });

  // Update client balance
  await Client.findByIdAndUpdate(
    wallet.ClientId,
    { WalletBalance: newBalance },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    wallet: updatedWallet,
    message: `Wallet updated successfully. New balance: ₹${newBalance}`,
  });
});

exports.getAllWallet = catchAsyncErrors(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const requestedLimit = parseInt(req.query.limit, 10) || 10;
  const limit = Math.min(Math.max(requestedLimit, 1), 100000);
  const skip = (page - 1) * limit;

  const { clientId, type, paymentStatus, startDate, endDate, search } =
    req.query;

  // Transactions are stored in each wallet's previousAmount array. Flattening
  // them here makes the admin list, pagination, filters, and totals operate on
  // actual transactions rather than on one row per wallet.
  const walletsWithHistory = await Wallet.find(
    clientId ? { ClientId: clientId } : {},
  )
    .populate({path: "ClientId", select: "name email mobile WalletBalance"})
    .lean();
  const searchText = String(search || "").trim().toLowerCase();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const transactions = walletsWithHistory
    .flatMap(wallet => {
      const client = wallet.ClientId || {};
      return (Array.isArray(wallet.previousAmount) ? wallet.previousAmount : []).map(
        transaction => ({
          _id: `${wallet._id}-${transaction._id || transaction.txnId || transaction.createdAt}`,
          walletId: wallet._id,
          ClientId: client._id || wallet.ClientId,
          ClientName: client.name || "N/A",
          Mobile: client.mobile ? String(client.mobile) : "N/A",
          ClientEmail: client.email || "N/A",
          ClientWalletBalance: Number(wallet.availableAmount) || 0,
          availableAmount: Number(wallet.availableAmount) || 0,
          transactionAmount: Math.abs(Number(transaction.addedAmount) || 0),
          Type: transaction.transactionType || "",
          PaymentStatus: transaction.paymentStatus || "",
          TxnId: transaction.txnId || "",
          PaymentId: transaction.paymentId || "",
          orderId: transaction.orderId || "",
          subscriptionId: transaction.subscriptionId || "",
          createdAt: transaction.createdAt || wallet.createdAt,
          updatedAt: transaction.updatedAt || wallet.updatedAt,
          previousAmount: wallet.previousAmount || [],
        }),
      );
    })
    .filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      const matchesType = !type || transaction.Type === type;
      const matchesStatus = !paymentStatus || transaction.PaymentStatus === paymentStatus;
      const matchesDate =
        (!start || transactionDate >= start) && (!end || transactionDate <= end);
      const matchesSearch =
        !searchText ||
        [transaction.ClientName, transaction.Mobile, transaction.TxnId].some(value =>
          String(value || "").toLowerCase().includes(searchText),
        );
      return matchesType && matchesStatus && matchesDate && matchesSearch;
    })
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  const transactionTotal = transactions.length;
  const totalCredits = transactions
    .filter(transaction => ["credit", "cashback", "refund"].includes(transaction.Type))
    .reduce((sum, transaction) => sum + transaction.transactionAmount, 0);
  const totalDebits = transactions
    .filter(transaction => ["debit", "subscription"].includes(transaction.Type))
    .reduce((sum, transaction) => sum + transaction.transactionAmount, 0);
  const totalAmount = transactions.reduce(
    (sum, transaction) => sum + transaction.transactionAmount,
    0,
  );
  const transactionTotalPages = Math.max(1, Math.ceil(transactionTotal / limit));

  return res.status(200).json({
    success: true,
    wallets: transactions.slice(skip, skip + limit),
    pagination: {
      currentPage: page,
      totalPages: transactionTotalPages,
      totalItems: transactionTotal,
      limit,
      hasNextPage: page < transactionTotalPages,
      hasPrevPage: page > 1,
    },
    stats: {
      totalTransactions: transactionTotal,
      totalCredits,
      totalDebits,
      totalAmount,
      avgAmount: transactionTotal ? totalAmount / transactionTotal : 0,
    },
  });

  let filter = {};

  if (clientId) {
    filter.ClientId = clientId;
  }

  if (type) {
    filter.Type = type;
  }

  if (paymentStatus) {
    filter.PaymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { ClientName: searchRegex },
      { Mobile: searchRegex },
      { TxnId: searchRegex },
    ];
  }

  const [wallets, total, stats] = await Promise.all([
    Wallet.find(filter)
      .populate({
        path: "ClientId",
        select: "Name Email Mobile WalletBalance",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Wallet.countDocuments(filter),
    Wallet.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalCredits: {
            $sum: {
              $cond: [
                { $in: ["$Type", ["credit", "cashback", "refund"]] },
                "$transactionAmount",
                0,
              ],
            },
          },
          totalDebits: {
            $sum: {
              $cond: [
                { $in: ["$Type", ["debit", "subscription"]] },
                "$transactionAmount",
                0,
              ],
            },
          },
          totalAmount: { $sum: "$transactionAmount" },
          avgAmount: { $avg: "$transactionAmount" },
        },
      },
    ]),
  ]);

  // ✅ Populate client name and mobile in the response
  // ✅ Only include fields that have data
  const populatedWallets = wallets.map((wallet) => {
    const client = wallet.ClientId;

    // Get the latest transaction from previousAmount
    const latestTransaction =
      wallet.previousAmount && wallet.previousAmount.length > 0
        ? wallet.previousAmount[wallet.previousAmount.length - 1]
        : null;
    const latestAmount = Number(latestTransaction?.addedAmount);

    return {
      _id: wallet._id,
      ClientId: client?._id || wallet.ClientId,
      ClientName: client?.Name || wallet.ClientName || "N/A",
      Mobile: client?.Mobile || wallet.Mobile || "N/A",
      ClientEmail: client?.Email || "N/A",
      ClientWalletBalance: client?.WalletBalance || 0,
      previousAmount: wallet.previousAmount || [],
      availableAmount: wallet.availableAmount || 0,
      // Each wallet has a transaction history.  Show its newest transaction
      // in the wallet list instead of empty legacy top-level fields.
      transactionAmount: Number.isFinite(latestAmount)
        ? Math.abs(latestAmount)
        : wallet.transactionAmount || 0,
      Type: latestTransaction?.transactionType || wallet.Type || "",
      PaymentStatus:
        latestTransaction?.paymentStatus || wallet.PaymentStatus || "",
      TxnId: latestTransaction?.txnId || wallet.TxnId || "",
      PaymentId: latestTransaction?.paymentId || wallet.PaymentId || "",
      // ✅ Only include if they exist
      ...(wallet.orderId && { orderId: wallet.orderId }),
      ...(wallet.subscriptionId && { subscriptionId: wallet.subscriptionId }),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      // ✅ Include latest transaction fields if they exist
      ...(latestTransaction?.orderId && {
        latestOrderId: latestTransaction.orderId,
      }),
      ...(latestTransaction?.subscriptionId && {
        latestSubscriptionId: latestTransaction.subscriptionId,
      }),
      ...(latestTransaction?.paymentStatus && {
        latestPaymentStatus: latestTransaction.paymentStatus,
      }),
      ...(latestTransaction?.paymentId && {
        latestPaymentId: latestTransaction.paymentId,
      }),
    };
  });

  const totalPages = Math.ceil(total / limit);

  const transactionStats =
    stats.length > 0
      ? {
          totalTransactions: stats[0].totalTransactions || 0,
          totalCredits: stats[0].totalCredits || 0,
          totalDebits: stats[0].totalDebits || 0,
          totalAmount: stats[0].totalAmount || 0,
          avgAmount: stats[0].avgAmount || 0,
        }
      : {
          totalTransactions: 0,
          totalCredits: 0,
          totalDebits: 0,
          totalAmount: 0,
          avgAmount: 0,
        };

  res.status(200).json({
    success: true,
    wallets: populatedWallets,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: total,
      limit: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    stats: transactionStats,
  });
});

// Apply one transaction amount to many wallets without sending one request per user.
exports.bulkUpdateWallet = catchAsyncErrors(async (req, res) => {
  const {
    clientIds = [],
    allUsers = false,
    transactionAmount,
    Type,
    PaymentStatus,
    TxnId,
    orderId,
    subscriptionId,
    PaymentId,
  } = req.body || {};

  const amount = Number(transactionAmount);
  const transactionType = String(Type || "")
    .trim()
    .toLowerCase();
  const creditTypes = ["credit", "cashback", "refund"];
  const debitTypes = ["debit", "subscription"];

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Transaction amount must be a valid number",
    });
  }
  if (![...creditTypes, ...debitTypes].includes(transactionType)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction type" });
  }
  if (!PaymentStatus) {
    return res
      .status(400)
      .json({ success: false, message: "Payment status is required" });
  }

  const clients = allUsers
    ? await Client.find({}, "_id").lean()
    : await Client.find(
        { _id: { $in: Array.isArray(clientIds) ? clientIds : [] } },
        "_id",
      ).lean();
  const ids = clients.map((client) => client._id);
  const wallets = await Wallet.find({ ClientId: { $in: ids } }).lean();
  const walletsByClientId = new Map(
    wallets.map((wallet) => [String(wallet.ClientId), wallet]),
  );
  const isDebit = debitTypes.includes(transactionType);
  const skipped = [];
  const updated = [];

  for (const client of clients) {
    const clientId = String(client._id);
    let wallet = walletsByClientId.get(clientId);
    if (!wallet) {
      try {
        wallet = await ensureWalletForClient(client._id);
        wallet = wallet?.toObject ? wallet.toObject() : wallet;
        walletsByClientId.set(clientId, wallet);
      } catch (walletErr) {
        skipped.push({ clientId, reason: walletErr.message || "Wallet not found" });
        continue;
      }
    }

    // Zero balance is valid for credit/cashback/refund transactions.
    const currentBalance = Number(wallet.availableAmount) || 0;
    if (isDebit && currentBalance < amount) {
      skipped.push({ clientId, reason: "Insufficient wallet balance" });
      continue;
    }

    const newBalance = isDebit
      ? currentBalance - amount
      : currentBalance + amount;
    const transactionId = `${String(TxnId || generateTransactionId())}-${clientId.slice(-6)}`;
    const previousAmountEntry = {
      amount: currentBalance,
      addedAmount: isDebit ? -amount : amount,
      transactionType,
      txnId: transactionId,
      paymentStatus: String(PaymentStatus).trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (orderId?.trim()) previousAmountEntry.orderId = orderId.trim();
    if (subscriptionId?.trim())
      previousAmountEntry.subscriptionId = subscriptionId.trim();
    if (PaymentId?.trim()) previousAmountEntry.paymentId = PaymentId.trim();

    const walletUpdate = {
      transactionAmount: amount,
      Type: transactionType,
      PaymentStatus: String(PaymentStatus).trim(),
      TxnId: transactionId,
      previousAmount: [
        ...(Array.isArray(wallet.previousAmount) ? wallet.previousAmount : []),
        previousAmountEntry,
      ],
      availableAmount: newBalance,
      updatedAt: new Date(),
      ...(orderId?.trim() ? { orderId: orderId.trim() } : {}),
      ...(subscriptionId?.trim()
        ? { subscriptionId: subscriptionId.trim() }
        : {}),
      ...(PaymentId?.trim() ? { PaymentId: PaymentId.trim() } : {}),
    };

    const updatedWallet = await Wallet.findByIdAndUpdate(
      wallet._id,
      walletUpdate,
      {
        new: true,
        runValidators: true,
      },
    ).lean();
    await Client.findByIdAndUpdate(
      client._id,
      { WalletBalance: newBalance },
      { runValidators: true },
    );
    updated.push({ clientId, wallet: updatedWallet });
  }

  if (updated.length === 0 && skipped.length > 0) {
    return res.status(400).json({
      success: false,
      message: skipped[0]?.reason || "Wallet update failed for selected user(s)",
      updatedCount: 0,
      skippedCount: skipped.length,
      skipped,
    });
  }

  return res.status(200).json({
    success: true,
    message: `Wallet updated for ${updated.length} user(s)`,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    updated,
    skipped,
  });
});
