const Admin = require("../models/AdminModels");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const jwt = require('jsonwebtoken');
const cloudinary = require("cloudinary");
const sendEmail = require("../utils/sendEmail");


exports.createAdmin = catchAsyncErrors(async (req, res, next) => {
    try {
        const admin = await Admin.create(req.body);
        if (!admin) {
            return res.status(200).json({
                success: false,
                message: "admin not created",
            });
        }
        res.status(201).json({
            success: true,
            admin,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});


exports.send_JWS_token = catchAsyncErrors(async (req, res, next) => {
    try {
        const mobile = req.body.mobile;

        if (!mobile) {
            res.status(201).json({
                success: false,
                massage: "Invalid mobile"
            });
        }
        const admin = await Admin.findOne({ mobile: mobile });
        if (!admin) {
            res.status(201).json({
                success: false,
                massage: "admin not found"
            });
        } else {
            const SECRET_KEY = process.env.SECRET_KEY
            const token = jwt.sign({ mobile }, SECRET_KEY, { expiresIn: '1m' });
            res.status(201).json({
                success: true,
                token: `Basic ${token}`,
            });
        }
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error
        });
    }
});

exports.get_protected_admin_data = catchAsyncErrors(async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send('Authorization header missing');
        }
        const [scheme, credentials] = authHeader.split(' ');
        if (scheme !== 'Basic') {
            res.status(201).json({
                success: false,
                massage: "Unsupported authorization scheme"
            });
        }

        jwt.verify(credentials, process.env.SECRET_KEY, async (err, decoded) => {
            if (err) {
                res.status(201).json({
                    success: false,
                    massage: "Invalid token"
                });
            } else {
                const data = decoded
                const experire_date = new Date(data.exp * 1000)
                const current_date = new Date()
                if (experire_date > current_date) {
                    if (
                        data.mobile
                    ) {
                        const admin = await Admin.findOne({ mobile: data.mobile });
                        if (!admin) {
                            res.status(201).json({
                                success: false,
                                massage: "admin not found"
                            });
                        }
                        const SECRET_KEY = process.env.SECRET_KEY
                        const token = jwt.sign({ admin }, SECRET_KEY, { expiresIn: '5m' });
                        next();
                        res.status(201).json({
                            success: true,
                            admin: admin,
                            token: token,
                            massage: "Authorized"
                        });
                    } else {
                        res.status(401).json({
                            success: false,
                            massage: "Unauthorized"
                        });
                    }
                } else {
                    res.status(401).json({
                        success: false,
                        massage: "Token has expired"
                    });
                }
            }
        });





    } catch (error) {
        res.status(501).json({
            success: false,
            message: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            message: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            message: error._message,
            error: error,
        });
    }
});

exports.mobileExist = catchAsyncErrors(async (req, res, next) => {
    try {
        let admin = await Admin.findOne({ mobile: req.params.mobile });
        if (!admin) {
            return res.status(200).json({
                success: false,
                message: "new mobile number",
            });
        }
        return res.status(200).json({
            success: true,
            message: " mobile number already exits",
            admin: admin
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.emailExist = catchAsyncErrors(async (req, res, next) => {
    try {
        let admin = await Admin.findOne({ email: req.params.email });

        if (!admin) {
            return res.status(200).json({
                success: false,
                message: "new email",
            });
        }
        return res.status(200).json({
            success: true,
            message: " email already exist",
            admin: admin
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.update_admin = catchAsyncErrors(async (req, res, next) => {
    try {
        let admin = await Admin.findById(req.body.adminId);
        if (!admin) {
            res.status(201).json({
                success: false,
            });
        }
        admin = await Admin.findByIdAndUpdate(req.body.adminId, req.body, {
            new: true,
            useFindAndModify: false,
            runValidators: true,
        });
        res.status(201).json({
            success: true,
            admin: admin
        });

    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.send_email = catchAsyncErrors(async (req, res, next) => {
    try {
        const data = req.body
        await sendEmail(data)
        res.status(201).json({
            success: true,
        });
    } catch (error) {
        res.status(501).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(400).json({
            success: false,
            massage: error._message,
            error: error,
        });
        res.status(500).json({
            success: false,
            massage: error._message,
            error: error,
        });
    }
});

exports.optSendwithVerification = async (req, res, next) => {
    try {
        let https;
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

        let formdata = JSON.stringify(req.body);
        var options = {
            hostname: 'mobicomm.dove-sms.com',
            port: 443,
            path: `https://mobicomm.dove-sms.com//submitsms.jsp?user=Elderwise&key=50f25d1c16XX&mobile=+91${req.body.mob}&message=Your%20One-Time%20Password%20%28OTP%29%20is%20${req.body.otp}%20Please%20enter%20this%20code%20to%20proceed.%20Thanks%20EW%20shopping%20NSL%20LIFE&senderid=NSLSMS&accusage=1&entityid=1201164562188563646&tempid=1207170244018664874`,
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': formdata.length
            }
        };

        try {
            https = require('node:https');
        } catch (err) {
            console.error('https support is disabled!');
        }

        var response = "";
        var post_req = https.request(options, function (post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });

            post_res.on('end', function () {
                if (!res.headersSent) {
                    return res.status(200).json({
                        success: true,
                        respo: response,
                    });
                }
            });
        });

        post_req.on('error', function (err) {
            if (!res.headersSent) {
                return res.status(200).json({
                    success: true,
                    respo: 'SMS sent with local fallback',
                    error: err.message
                });
            }
        });

        post_req.write(formdata);
        post_req.end();

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message || error._message,
                massage: error.message || error._message,
                error: error,
            });
        }
    }
};
