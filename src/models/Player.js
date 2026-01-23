/**
 * Player Mongoose Schema
 */

const mongoose = require('mongoose');

// Schema for position rating (e.g., "ST (124|124)")
const PositionRatingSchema = new mongoose.Schema({
  position: { type: String },
  rating: { type: String }, // Format: "124|124"
}, { _id: false, strict: false });

// Schema for club career entry
const ClubCareerSchema = new mongoose.Schema({
  period: { type: String },
  club: { type: String },
}, { _id: false, strict: false });

// Schema for hidden stat (trait)
const HiddenStatSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  iconUrl: { type: String },
}, { _id: false, strict: false });

// Schema for individual stat
const StatSchema = new mongoose.Schema({
  name: { type: String }, // Vietnamese name
  value: { type: Number },
  baseValue: { type: Number },
  originalValue: { type: Number },
}, { _id: false, strict: false });

// Main Player Schema
// Note: required: false for all fields to allow querying existing data that might have missing fields
const PlayerSchema = new mongoose.Schema({
  playerId: { type: String, index: true },
  season: { type: String, index: true },
  name: { 
    type: String, 
    index: true,
    text: true, // For text search
  },
  position: { type: String, index: true },
  positions: [PositionRatingSchema],
  overallRating: { type: Number },
  overallDisplay: { type: Number, index: true }, // For sorting
  starRating: { type: Number },
  
  // Images
  avatarUrl: { type: String },
  mainImageUrl: { type: String },
  playerUrl: { type: String },
  
  // Stats object - dynamic keys based on statsMapping
  // Using Schema.Types.Mixed to allow flexible structure
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Career and traits
  clubCareer: [ClubCareerSchema],
  hiddenStats: [HiddenStatSchema],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  scrapedAt: { type: Date },
}, {
  timestamps: false, // We handle timestamps manually
  collection: 'players',
  strict: false, // Allow fields not defined in schema (important for existing data)
  strictQuery: false, // Allow querying fields not in schema
});

// Compound indexes
PlayerSchema.index({ playerId: 1, season: 1 }, { unique: true });
PlayerSchema.index({ position: 1, season: 1, overallDisplay: -1 });
PlayerSchema.index({ season: 1, overallDisplay: -1 });
PlayerSchema.index({ name: 'text' }, { 
  name: 'name_text_index',
  weights: { name: 10 },
});

// Text index (alternative approach if above doesn't work)
// Note: Mongoose will create this automatically if the index definition above works
// Otherwise, we can create it manually via MongoDB shell or script

// Pre-save middleware to update timestamps
PlayerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});

// Static method: Find by playerId and season
PlayerSchema.statics.findByPlayerIdAndSeason = function(playerId, season) {
  return this.findOne({ playerId, season });
};

// Static method: Check if player exists
PlayerSchema.statics.exists = function(playerId, season) {
  return this.exists({ playerId, season });
};

// Static method: Search players with filters
PlayerSchema.statics.search = function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'overallDisplay',
    sortOrder = 'desc',
  } = options;

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
};

// Instance method: Update or create (upsert)
PlayerSchema.statics.upsert = async function(playerData) {
  const filter = {
    playerId: playerData.playerId,
    season: playerData.season,
  };

  const update = {
    ...playerData,
    updatedAt: new Date(),
  };

  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  };

  return this.findOneAndUpdate(filter, update, options);
};

const Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;
