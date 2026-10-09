const express = require("express");
const {
  getAllDoctors,
  createDoctors,
  updateDoctors,
  deleteDoctors,
  getDoctorsById,
} = require("../controllers/DoctorController");

const router = express.Router();

router.route("/new").post(createDoctors);
router.route("/all").get(getAllDoctors);
router.route("/docterby/:id").get(getDoctorsById);
router.route("/updateby/:doctorId").put(updateDoctors);
router.route("/deleteby/:doctorId").delete(deleteDoctors);

module.exports = router;
