import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import { Post } from "@/models/Post"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 })
    }

    jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

    await connectDB()

    const posts = await Post.find()
      .populate("author", "name profilePicture")
      .populate("comments.author", "name profilePicture")
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      posts,
    })
  } catch (error) {
    console.error("Fetch posts error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { content } = await request.json()

    await connectDB()

    const post = await Post.create({
      content,
      author: decoded.userId,
    })

    const populatedPost = await Post.findById(post._id).populate("author", "name profilePicture")

    return NextResponse.json({
      success: true,
      post: populatedPost,
    })
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
