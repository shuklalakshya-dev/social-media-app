import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import { Post } from "@/models/Post"

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    await connectDB()

    const post = await Post.findById(params.postId)
    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 })
    }

    const userId = decoded.userId
    const isLiked = post.likes.includes(userId)

    if (isLiked) {
      post.likes = post.likes.filter((id: any) => id.toString() !== userId)
    } else {
      post.likes.push(userId)
    }

    await post.save()

    return NextResponse.json({
      success: true,
      liked: !isLiked,
      likesCount: post.likes.length,
    })
  } catch (error) {
    console.error("Like post error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
