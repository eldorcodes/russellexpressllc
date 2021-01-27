const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const driverSchema = new Schema({
  name: {
    type: String
  },
  email: {
    type: String
  },
  number: {
    type: String
  },
  ssn: {
    type: String
  },
  address: {
    type: String
  },
  age: {
    type: String
  },
  clientDrivingExperience: {
    type: String
  },
  typeOfLicense:{
    type: String
  },
  clientLicenseNumber:{
    type: String
  },
  legalDocument:{
    type: String
  },
  licenseImage:{
    type:String
  },
  date: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Driver',driverSchema);
