import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import { Post } from "@/models/Post"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 })
    }

    jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

    await connectDB()

    const posts = await Post.find({ author: params.userId })
      .populate("author", "name profilePicture")
      .populate("comments.author", "name profilePicture")
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      posts,
    })
  } catch (error) {
    console.error("Fetch user posts error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
