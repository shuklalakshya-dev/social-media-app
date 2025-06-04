"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

// Yup validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Full name is required"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords must match")
    .required("Please confirm your password"),
  bio: Yup.string()
    .max(500, "Bio must be less than 500 characters")
})

export default function RegisterPage() {
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (values: { name: string; email: string; password: string; confirmPassword: string; bio: string }, { setSubmitting }: any) => {
    setError("")
    try {
      const { confirmPassword, ...formData } = values // Remove confirmPassword from submission
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        // Instead of storing token and redirecting home, 
        // redirect to login with success message
        router.push("/login?success=Registration successful! Please log in.")
      } else {
        setError(data.message || "Registration failed")
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
                Join Lakshya
              </h1>
              <p className="text-gray-500 mt-2">Create your account and start connecting</p>
            </motion.div>
            
            {/* Form */}
            <Formik
              initialValues={{ 
                name: "", 
                email: "", 
                password: "", 
                confirmPassword: "", 
                bio: "" 
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Name field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-700 block">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <Field
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        className={`pl-10 w-full border-0 bg-gray-50/50 rounded-xl py-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:outline-none ${
                          errors.name && touched.name ? 'ring-2 ring-red-500/50 bg-red-50/50' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </motion.div>

                  {/* Email field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
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
                    transition={{ delay: 0.5 }}
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
                        placeholder="Create a secure password"
                        className={`pl-10 w-full border-0 bg-gray-50/50 rounded-xl py-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:outline-none ${
                          errors.password && touched.password ? 'ring-2 ring-red-500/50 bg-red-50/50' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                  </motion.div>

                  {/* Confirm Password field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-700 block">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <Field
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className={`pl-10 w-full border-0 bg-gray-50/50 rounded-xl py-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:outline-none ${
                          errors.confirmPassword && touched.confirmPassword ? 'ring-2 ring-red-500/50 bg-red-50/50' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
                  </motion.div>

                  {/* Bio field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-700 block">Bio (Optional)</label>
                    <Field
                      as="textarea"
                      name="bio"
                      placeholder="Tell us about yourself... ✨"
                      rows={3}
                      className={`w-full border-0 bg-gray-50/50 rounded-xl p-3 transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:outline-none resize-none ${
                        errors.bio && touched.bio ? 'ring-2 ring-red-500/50 bg-red-50/50' : ''
                      }`}
                    />
                    <ErrorMessage name="bio" component="div" className="text-red-500 text-xs mt-1" />
                  </motion.div>

                  {/* Submit button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
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
                          Creating Account...
                        </span>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </motion.div>
                </Form>
              )}
            </Formik>
            
            {/* Login link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-8"
            >
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
