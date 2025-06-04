"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

// Yup validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required")
})

export default function LoginPage() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  
  // Check URL for success message from registration
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const successMessage = searchParams.get('success')
    if (successMessage) {
      setSuccess(successMessage)
    }
  }, [])

  const handleSubmit = async (values: { email: string; password: string }, { setSubmitting }: any) => {
    setError("")
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      console.log("Login response:", data)
      
      if (data.success && data.token) {
        // Save token to localStorage
        localStorage.setItem("token", data.token)
        console.log("Token saved:", data.token)
        
        // Verify token works immediately
        try {
          const verifyRes = await fetch("http://localhost:5000/api/auth/verify", {
            headers: { Authorization: `Bearer ${data.token}` },
          })
          const verifyData = await verifyRes.json()
          console.log("Verification after login:", verifyData)
          
          if (verifyData.success) {
            // Force reload to clear any state and make sure fetch runs with new token
            console.log("Verification successful, redirecting to homepage")
            window.location.href = "/"
          } else {
            setError("Authentication failed after login")
            localStorage.removeItem("token")
          }
        } catch (verifyErr) {
          console.error("Error verifying token after login:", verifyErr)
          setError("Could not verify authentication")
        }
      } else {
        setError(data.message || "Login failed")
      }
    } catch {
      setError("Network error, please try again")
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-80 h-80 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <div className="px-8 pt-10 pb-8">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">L</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-500 mt-2">Sign in to continue your journey</p>
            </motion.div>
            
            {/* Form */}
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-600 text-sm"
                    >
                      {success}
                    </motion.div>
                  )}
                  
                  {/* Email field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-700 block">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <Field
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className={`pl-10 w-full border-0 bg-gray-50/50 rounded-xl py-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:outline-none ${
                          errors.email && touched.email ? 'ring-2 ring-red-500/50 bg-red-50/50' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                  </motion.div>
                  
                  {/* Password field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-700 block">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <Field
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 w-full border-0 bg-gray-50/50 rounded-xl py-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:outline-none ${
                          errors.password && touched.password ? 'ring-2 ring-red-500/50 bg-red-50/50' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                    <div className="text-right">
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        Forgot password?
                      </a>
                    </div>
                  </motion.div>
                  
                  {/* Submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 px-4 font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </motion.div>
                </Form>
              )}
            </Formik>
            
            {/* Register link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8"
            >
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  Create account
                </Link>
              </p>
            </motion.div>
            
            {/* Social login options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/70 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-3">
                {/* Google */}
                <button className="flex justify-center items-center py-2.5 border border-gray-200/50 bg-white/50 rounded-xl hover:bg-white/80 transition duration-300 backdrop-blur-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12C6 8.68629 8.68629 6 12 6C13.6569 6 15.1569 6.67157 16.2426 7.75736L20.4853 3.51472C18.2711 1.30048 15.3137 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 11.0993 23.9158 10.2211 23.7592 9.38197H12V15H18.6883C17.8287 17.4522 15.1274 19.2222 12 19.2222C8.68629 19.2222 6 16.5359 6 13.2222V12Z" fill="#4285F4"/>
                  </svg>
                </button>
                
                {/* Twitter */}
                <button className="flex justify-center items-center py-2.5 border border-gray-200/50 bg-white/50 rounded-xl hover:bg-white/80 transition duration-300 backdrop-blur-sm">
                  <svg className="h-5 w-5 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 3.01s-2.018 1.192-3.14 1.53a4.48 4.48 0 00-7.86 3v1a10.66 10.66 0 01-9-4.53s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5 0-.278-.028-.556-.08-.83C21.94 5.674 23 3.01 23 3.01z"/>
                  </svg>
                </button>
                
                {/* GitHub */}
                <button className="flex justify-center items-center py-2.5 border border-gray-200/50 bg-white/50 rounded-xl hover:bg-white/80 transition duration-300 backdrop-blur-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
