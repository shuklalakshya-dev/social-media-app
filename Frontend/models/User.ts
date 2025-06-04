import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

export const User = mongoose.models.User || mongoose.model("User", userSchema)
