"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { FaCamera, FaEdit, FaSave, FaTimes } from "react-icons/fa"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bio, setBio] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // fetch profile on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return router.replace("/login")
    
    fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error("Failed to fetch profile")
        setUser(data.user)
        setBio(data.user.bio || "")
      })
      .catch((err) => {
        console.error(err)
        router.replace("/login")
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    
    // Validate file is an image
    if (!f.type.startsWith("image/")) {
      alert("Please select a valid image file")
      return
    }
    
    // Validate file size (5MB max)
    if (f.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 5MB.")
      return
    }
    
    setFile(f)
    
    // Clean up previous preview URL to avoid memory leaks
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    
    setPreview(URL.createObjectURL(f))
  }

  // Convert file to base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Validate result is a data URL
        if (typeof result === 'string' && result.startsWith('data:image/')) {
          resolve(result)
        } else {
          reject(new Error('Failed to convert image to base64 format'))
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Convert image to base64 if present
      let profilePictureData = null
      if (file) {
        try {
          profilePictureData = await getBase64(file)
        } catch (fileError) {
          console.error("Error converting image to base64:", fileError)
          alert("Error processing image. Please try a different image.")
          setSaving(false)
          return
        }
      }

      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          bio,
          profilePictureData
        })
      })
      
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to update profile")
      }
      
      // Update local state with the new user data
      setUser(data.user)
      
      // Show success message and redirect
      alert("Profile updated successfully!")
      setTimeout(() => {
        router.replace("/")
      }, 1000)
    } catch (err: any) {
      console.error("Profile update error:", err)
      alert(`Failed to save: ${err.message || "Server error"}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto pt-24 px-4 pb-12 space-y-8"
      >
        {/* Profile Header Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
          {/* Cover Image */}
          <div className="h-40 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute bottom-4 left-6 text-white">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-8 -mt-20 relative">
            {/* Profile Avatar */}
            <div className="flex flex-col md:flex-row md:items-end mb-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden ring-4 ring-blue-500/20">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-3xl">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online Status */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
              </div>
              
              <div className="mt-6 md:mt-0 md:ml-6 text-center md:text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {user?.name}
                </h1>
                <p className="text-gray-600 font-medium mt-1">{user?.email}</p>
                <div className="flex items-center justify-center md:justify-start space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Current Bio Display */}
            {user?.bio && (
              <div className="mb-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                <p className="text-gray-600 leading-relaxed">{user.bio}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Edit Profile Form Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 space-y-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FaEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </div>
            
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 items-center space-x-2">
                <span>✨ Bio</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell the world about yourself... Share your passions, interests, or what makes you unique! 🌟"
                className="w-full border-0 bg-gray-50/50 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-200 resize-none text-gray-700 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500">
                {bio.length}/500 characters
              </p>
            </div>
            
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 items-center space-x-2">
                <span>📸 Profile Picture</span>
                // This label is for the file input, not visible but accessible
              </label>
              
              <div className="flex items-center space-x-4">
                <motion.label
                  htmlFor="profile-pic"
                  className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 cursor-pointer transition-all duration-200 border-2 border-dashed border-blue-200 hover:border-blue-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaCamera className="w-5 h-5" />
                  <span className="font-medium">Choose Photo</span>
                </motion.label>
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
                <span className="text-sm text-gray-500">JPG, PNG up to 5MB</span>
              </div>
              
              <AnimatePresence>
                {preview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative inline-block"
                  >
                    <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg ring-4 ring-blue-500/20">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (preview) URL.revokeObjectURL(preview)
                        setPreview(null)
                        setFile(null)
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimes className="w-4 h-4" />
                    </motion.button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg backdrop-blur-sm">
                      New Photo
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <motion.button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-2">
                  <FaTimes className="w-4 h-4" />
                  <span>Cancel</span>
                </div>
              </motion.button>
              <motion.button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
              >
                <div className="flex items-center space-x-2">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
