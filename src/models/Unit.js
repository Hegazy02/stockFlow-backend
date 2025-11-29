const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Unit name cannot exceed 50 characters']
  },
  abbreviation: {
    type: String,
    required: [true, 'Unit abbreviation is required'],
    unique: true,
    trim: true,
    maxlength: [10, 'Unit abbreviation cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: 'Status must be either Active or Inactive'
    },
    default: 'Active'
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

// Create indexes
unitSchema.index({ status: 1 });

// Update timestamp on save
unitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update timestamp on update
unitSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Unit = mongoose.model('Unit', unitSchema);

module.exports = Unit;
