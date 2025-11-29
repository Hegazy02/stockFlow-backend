const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Partner name is required'],
    trim: true,
    maxlength: [100, 'Partner name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Partner type is required'],
    enum: {
      values: ['Customer', 'Supplier'],
      message: 'Type must be either Customer or Supplier'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
partnerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update timestamp on update
partnerSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
