"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { FaImage, FaVideo, FaHeart, FaRegHeart, FaComment, FaShare, FaPaperPlane } from 'react-icons/fa'
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"

interface Post {
  _id: string
  content: string
  author: { name: string }
  createdAt: string
  image?: string
  video?: string
}

interface User {
  _id: string
  name: string
  email: string
  bio?: string
  profilePicture?: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [newContent, setNewContent] = useState<string>("")
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingUser, setLoadingUser] = useState(true)
  const [posting, setPosting] = useState<boolean>(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  // image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // video upload state
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  // Fetch user data
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.log("No token found, redirecting to login")
      setLoadingUser(false)
      router.push("/login")
      return
    }

    console.log("Verifying token...")
    fetch("http://localhost:5000/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          console.error("Verification response not OK:", res.status)
          throw new Error(`Verification failed with status ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data.success) {
          console.log("User authenticated successfully:", data.user)
          setUser(data.user)
        } else {
          console.log("Auth failed:", data.message)
          localStorage.removeItem("token")
          router.push("/login")
        }
      })
      .catch((error) => {
        console.error("Auth error:", error)
        localStorage.removeItem("token")
        router.push("/login")
      })
      .finally(() => setLoadingUser(false))
  }, [])

  // fetch existing posts on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPosts(data.posts)
      })
      .finally(() => setLoadingPosts(false))
  }, [])

  // show file picker
  const handleIconClick = () => fileInputRef.current?.click()
  const handleVideoIconClick = () => videoInputRef.current?.click()

  // when user selects a file
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // when user selects a video
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  // remove selected image
  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setSelectedImage(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // remove selected video
  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setSelectedVideo(null)
    setVideoPreview(null)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }
  
  // Helper function to convert File to base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // handle new post submission
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    // Require at least content or both content and image/video
    if (!newContent.trim()) {
      alert("Please add some text to your post");
      return;
    }

    setPosting(true)
    
    // Convert image to base64 if present
    let imageData = null
    let videoData = null
    
    if (selectedImage) {
      try {
        console.log("Converting image to base64...");
        imageData = await getBase64(selectedImage);
        console.log("Image conversion successful");
      } catch (err) {
        console.error("Error converting image:", err);
        alert("There was a problem processing your image. The post will be created without it.");
      }
    }

    // Convert video to base64 if present
    if (selectedVideo) {
      try {
        console.log("Converting video to base64...");
        videoData = await getBase64(selectedVideo);
        console.log("Video conversion successful");
      } catch (err) {
        console.error("Error converting video:", err);
        alert("There was a problem processing your video. The post will be created without it.");
      }
    }

    try {
      // Get token from local storage
      const token = localStorage.getItem('token')
      if (!token) {
        alert("You need to be logged in to post");
        router.push("/login");
        return;
      }
      
      console.log("Sending post with content:", newContent.trim().substring(0, 30))
      if (imageData) console.log("Image data is included (length: " + imageData.length + " bytes)")
      if (videoData) console.log("Video data is included (length: " + videoData.length + " bytes)")
      
      const requestData = {
        content: newContent.trim(),
        imageData,
        videoData
      };
      
      console.log("Making request to create post...");
      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      })
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Server responded with ${res.status}: ${errorText}`);
        throw new Error(`Server responded with ${res.status}: ${errorText}`);
      }
      
      const data = await res.json()
      console.log("Post response:", data)
      
      if (data.success) {
        // prepend new post
        setPosts((p) => [data.post, ...p])
        setNewContent('')
        removeImage()
        removeVideo()
      } else {
        alert(data.message || "Failed to post")
      }
    } catch (err: any) {
      console.error("Post submission error:", err)
      alert(`Error posting: ${err.message || 'Unknown error'}`)
    } finally {
      setPosting(false)
    }
  }

  // handle likes
  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newLiked = new Set(prev)
      if (newLiked.has(postId)) {
        newLiked.delete(postId)
      } else {
        newLiked.add(postId)
      }
      return newLiked
    })

    // Optional: Send like to backend
    // fetch(`http://localhost:5000/api/posts/${postId}/like`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    // })
  }

  // Loading spinner
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <motion.div
          className="h-12 w-12 border-4 border-t-blue-500 border-blue-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pb-10">
      <Navbar user={user} />

      <motion.main
        className="max-w-2xl mx-auto pt-24 px-4 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {user ? (
          // Logged in view - Modern post creation form
          <motion.form
            onSubmit={handlePost}
            className="bg-white/70 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 space-y-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={user?.profilePicture || "/placeholder-user.jpg"}
                  alt={user?.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{user?.name}</h3>
                <p className="text-xs text-gray-500">Share your thoughts...</p>
              </div>
            </div>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="What's happening? ✨"
              className="w-full border-0 bg-gray-50/50 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
            />
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-4">
                <motion.button
                  type="button"
                  onClick={handleIconClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Add Image"
                >
                  <FaImage className="h-4 w-4" />
                  <span className="text-sm font-medium">Photo</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleVideoIconClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Add Video"
                >
                  <FaVideo className="h-4 w-4" />
                  <span className="text-sm font-medium">Video</span>
                </motion.button>
              </div>
              <motion.button
                type="submit"
                disabled={posting || !newContent.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: posting || !newContent.trim() ? 1 : 1.02 }}
                whileTap={{ scale: posting || !newContent.trim() ? 1 : 0.98 }}
              >
                {posting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-medium">Posting...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="h-4 w-4" />
                    <span className="font-medium">Post</span>
                  </>
                )}
              </motion.button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />

            <input
              type="file"
              accept="video/*"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              className="hidden"
            />

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative w-full h-64 mt-4 rounded-xl overflow-hidden shadow-lg"
                >
                  <Image
                    src={preview}
                    alt="preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                    📷 Image Preview
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {videoPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative w-full h-64 mt-4 rounded-xl overflow-hidden shadow-lg"
                >
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                    🎥 Video Preview
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        ) : (
          // Guest view - Modern welcome section
          <motion.div
            className="bg-white/70 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-xl text-center space-y-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to Lakshya
            </h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Connect with friends, share your moments, and discover amazing content from around the world.
            </p>
            <div className="flex justify-center space-x-4 pt-4">
              <Link href="/login">
                <motion.button 
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button 
                  className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-300 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Posts List - Modern section header */}
        <div className="flex items-center space-x-3 pt-6">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-800">Latest Stories</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
        </div>

        {loadingPosts ? (
          <div className="text-center py-12">
            <motion.div
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-gray-600 font-medium">Loading amazing content...</p>
          </div>
        ) : posts.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Be the first to share something amazing with the community!
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {posts.map((post) => (
              <motion.div
                key={post._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                className="bg-white/70 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 space-y-4 group"
              >
                {/* Post Header */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {post.author.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                      {post.author.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="text-gray-800 leading-relaxed">
                  {post.content}
                </div>

                {/* Post Media */}
                {post.image && (
                  <div className="w-full h-80 rounded-xl overflow-hidden shadow-md">
                    <img
                      src={post.image}
                      alt="Post image"
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {post.video && (
                  <div className="w-full h-80 rounded-xl overflow-hidden shadow-md">
                    <video
                      src={post.video}
                      controls
                      className="w-full h-full object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <motion.button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center space-x-2 transition-all duration-200 ${
                        likedPosts.has(post._id)
                          ? "text-red-500"
                          : "text-gray-500 hover:text-red-500"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {likedPosts.has(post._id) ? (
                        <FaHeart className="w-5 h-5" />
                      ) : (
                        <FaRegHeart className="w-5 h-5" />
                      )}
                      <span className="font-medium">Like</span>
                    </motion.button>
                    
                    <motion.button 
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaComment className="w-5 h-5" />
                      <span className="font-medium">Comment</span>
                    </motion.button>
                    
                    <motion.button 
                      className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaShare className="w-5 h-5" />
                      <span className="font-medium">Share</span>
                    </motion.button>
                  </div>
                  
                  {/* Engagement indicators */}
                  <div className="text-sm text-gray-400">
                    {likedPosts.has(post._id) && (
                      <span className="text-red-500">❤️ You liked this</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.main>
    </div>
  )
}
