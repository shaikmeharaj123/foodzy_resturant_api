const Contact = require("../models/ContactModel");

// Create new contact inquiry / issue report
exports.createContactInquiry = async (req, res, next) => {
    try {
        const { name, email, issue, userId } = req.body;

        if (!name || !email || !issue) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, and issue description",
            });
        }

        const contact = await Contact.create({
            name,
            email,
            issue,
            userId: userId || null,
        });

        res.status(201).json({
            success: true,
            message: "Your inquiry has been submitted successfully. Our team will contact you shortly.",
            contact,
        });
    } catch (error) {
        console.error("Error creating contact inquiry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to submit contact inquiry",
        });
    }
};

// Get all contact inquiries (for admin)
exports.getAllContactInquiries = async (req, res, next) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contacts.length,
            contacts,
        });
    } catch (error) {
        console.error("Error fetching contact inquiries:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch contact inquiries",
        });
    }
};

// Get contact inquiry by ID
exports.getContactInquiryById = async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found",
            });
        }
        res.status(200).json({
            success: true,
            contact,
            data: contact,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch contact inquiry",
        });
    }
};

// Update contact status
exports.updateContactStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            contact,
            data: contact,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update contact status",
        });
    }
};

// Delete contact inquiry
exports.deleteContactInquiry = async (req, res, next) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Contact inquiry deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete contact inquiry",
        });
    }
};
