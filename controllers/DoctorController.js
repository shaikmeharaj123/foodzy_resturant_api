const Doctor = require("../models/DoctorModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");

//create doctor
exports.createDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({
    success: true,
    doctor,
  });
});

//get doctor
exports.getAllDoctors = catchAsyncErrors(async (req, res) => {
  const resultperpage = 10;
  const productCount = await Doctor.countDocuments();
  const apiFeature = new ApiFeatures(Doctor.find(), req.query)
    .search()
    .filter()
    .pagination(resultperpage);
  const doctor = await apiFeature.query;
  res.status(200).json({
    success: true,
    productCount,
    doctor: doctor,
  });
});

//get doctor by id
exports.getDoctorsById = catchAsyncErrors(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return next(new ErrorHandler("Doctor not found", 404));
  }

  res.status(200).json({
    success: true,
    doctor: doctor,
  });
});

//update doctor
exports.updateDoctors = catchAsyncErrors(async (req, res, next) => {
  let doctor = await Doctor.findById(req.params.doctorId);

  if (!doctor) {
    return next(new ErrorHandler("Doctor not found", 404));
  }

  doctor = await Doctor.findByIdAndUpdate(req.params.doctorId, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    doctor: doctor,
  });
});

//delete doctor
exports.deleteDoctors = catchAsyncErrors(async (req, res, next) => {
  let doctor = await Doctor.findByIdAndDelete(req.params.doctorId);
  if (!doctor) {
    return next(new ErrorHandler("Doctor not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Doctor Deleted Successfully",
  });
});
