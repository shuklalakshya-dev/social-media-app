import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables ONCE
dotenv.config();

// Now these will work
console.log("MongoDB URI:", process.env.DB_URL)
console.log("JWT Secret exists:", !!process.env.JWT_SECRET)
console.log("Cloudinary URL exists:", !!process.env.CLOUDINARY_URL)

// Rest of your imports
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import User from "./models/User.js"
import bcrypt from 'bcrypt'

// Configure Cloudinary explicitly with values from CLOUDINARY_URL
// Parse Cloudinary URL from env (format: cloudinary://api_key:api_secret@cloud_name)
const cloudinaryUrl = process.env.CLOUDINARY_URL;
console.log("Cloudinary URL:", cloudinaryUrl ? "Set (not showing for security)" : "Not set");

if (!cloudinaryUrl) {
  console.error("CLOUDINARY_URL environment variable is not set!");
} else {
  try {
    // Extract parts from the URL format: cloudinary://api_key:api_secret@cloud_name
    const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    
    if (match) {
      const [, api_key, api_secret, cloud_name] = match;
      
      // Configure with explicit values
      cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
        secure: true
      });
      
      console.log("Cloudinary configured successfully with cloud name:", cloud_name);
    } else {
      console.error("Invalid CLOUDINARY_URL format!");
    }
  } catch (error) {
    console.error("Error configuring Cloudinary:", error);
  }
}

// Connect to MongoDB
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

const app = express()
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json({ limit: '100mb' })) // Increased limit for base64 videos
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ success: false, message: "No token" })
  const token = header.split(" ")[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.userId || payload.id // Support both formats
    if (!req.userId) {
      console.error('Token payload missing userId:', payload)
      return res.status(401).json({ success: false, message: "Invalid token format" })
    }
    next()
  } catch (error) {
    console.error('Auth error:', error.message)
    return res.status(401).json({ success: false, message: "Invalid token" })
  }
}

// Profile endpoints
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ success: false, message: "User not found" })
    res.json({ success: true, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// PUT /api/profile - Updated to use direct Cloudinary uploads with error handling
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { bio, profilePictureData } = req.body
    const update = { bio }    // If image data is included, upload to Cloudinary
    if (profilePictureData) {
      try {
        console.log("Uploading profile image to Cloudinary...");
        
        // Validate that the image data is in the correct format (base64)
        if (!profilePictureData.startsWith('data:image/')) {
          throw new Error('Invalid image format - must be a data URL');
        }
        
        // Check if Cloudinary is properly configured
        if (!cloudinary.config().cloud_name) {
          throw new Error('Cloudinary not properly configured');
        }
        
        // Upload with more options for better reliability
        const uploadResult = await cloudinary.uploader.upload(profilePictureData, {
          folder: 'lakshya/profiles',
          resource_type: 'auto',
          timeout: 60000,
          use_filename: false
        });
        
        console.log("Cloudinary upload successful:", uploadResult.secure_url);
        update.profilePicture = uploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({ 
          success: false, 
          message: 'Profile image upload failed', 
          error: cloudinaryError.message || 'Unknown upload error'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true, select: '-password' }
    )
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, user })
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(500).json({ success: false, message: 'Server error', error: err.message })
  }
})

// --- Post models ---
const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String, default: '' },
  video: { type: String, default: '' }
}, { timestamps: true })

const Post = mongoose.models.Post || mongoose.model('Post', postSchema)

// --- GET /api/posts ---
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).populate("author", "name")
  res.json({ success: true, posts })
})

// --- POST /api/posts ---
app.post('/api/posts', authMiddleware, async (req, res) => {
  try {    console.log("Post creation attempt by userId:", req.userId)
    console.log("Request body:", Object.keys(req.body))
    
    const { content, imageData, videoData } = req.body
    
    // Validate content - it's required by the schema
    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.log("Content validation failed:", { content })
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required for creating a post' 
      });
    }
    
    const postData = { 
      content: content.trim(), // Ensure trimmed content 
      author: req.userId 
    }
      // If image data included, upload to Cloudinary
    if (imageData) {
      console.log("Image data present, uploading to Cloudinary...")
      try {
        // Check if Cloudinary is properly configured
        if (!cloudinary.config().cloud_name) {
          console.error("Cloudinary not properly configured");
          throw new Error("Cloudinary configuration missing");
        }
        
        // Basic validation for image data
        if (typeof imageData !== 'string' || !imageData.startsWith('data:')) {
          throw new Error('Invalid image data format');
        }
        
        const uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: 'lakshya/posts',
          resource_type: 'auto',
          timeout: 120000 // Increase timeout for large images
        })
        console.log("Cloudinary upload successful, URL:", uploadResult.secure_url)
        postData.image = uploadResult.secure_url      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError)
        // Don't fail the entire post creation if image upload fails
        // Just create post without the image        console.warn("Continuing post creation without the image due to upload failure");
      }
    }

    // If video data included, upload to Cloudinary
    if (videoData) {
      console.log("Video data present, uploading to Cloudinary...")
      try {
        // Check if Cloudinary is properly configured
        if (!cloudinary.config().cloud_name) {
          console.error("Cloudinary not properly configured");
          throw new Error("Cloudinary configuration missing");
        }
        
        // Basic validation for video data
        if (typeof videoData !== 'string' || !videoData.startsWith('data:video/')) {
          throw new Error('Invalid video data format');
        }
        
        const uploadResult = await cloudinary.uploader.upload(videoData, {
          folder: 'lakshya/posts',
          resource_type: 'video',
          timeout: 300000, // 5 minutes timeout for videos
          transformation: [
            { quality: 'auto' },
            { format: 'mp4' }
          ]
        })
        console.log("Cloudinary video upload successful, URL:", uploadResult.secure_url)
        postData.video = uploadResult.secure_url
      } catch (cloudinaryError) {
        console.error("Cloudinary video upload error:", cloudinaryError)
        // Don't fail the entire post creation if video upload fails
        console.warn("Continuing post creation without the video due to upload failure");
      }
    }    console.log("Creating post with data:", {
      content: postData.content ? postData.content.substring(0, 50) + (postData.content.length > 50 ? "..." : "") : "MISSING",
      contentLength: postData.content ? postData.content.length : 0,
      author: postData.author,
      image: postData.image ? "Present" : "Not present",
      video: postData.video ? "Present" : "Not present",
    })
    
    const post = await Post.create(postData)
    const populatedPost = await Post.findById(post._id).populate('author', 'name')
    
    console.log("Post created successfully, ID:", post._id)
    res.status(201).json({ success: true, post: populatedPost })  } catch (error) {
    console.error("Post creation error:", error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error during post creation', 
      error: error.message || 'Unknown error' 
    })
  }
})

// Add these routes after your imports and middleware setup

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      })
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    })
  }
})

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }
      // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
      res.json({
      success: true,
      token,
      user: {
        _id: user._id,  // Changed from id to _id to match MongoDB field
        name: user.name,
        email: user.email
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    })
  }
})

// Verify JWT and get user
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    console.log('Verify endpoint called with userId:', req.userId)
    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      console.log('User not found with ID:', req.userId)
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    console.log('User verified successfully:', user._id)
    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture
      } 
    })
  } catch (err) {
    console.error('Verify endpoint error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

app.listen(5000, () => console.log("Server running on 5000"))