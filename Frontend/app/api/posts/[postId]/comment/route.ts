import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import { Post } from "@/models/Post"
import { User } from "@/models/User"

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { content } = await request.json()

    await connectDB()

    const post = await Post.findById(params.postId)
    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 })
    }

    const user = await User.findById(decoded.userId).select("name profilePicture")

    const comment = {
      content,
      author: decoded.userId,
      createdAt: new Date(),
    }

    post.comments.push(comment)
    await post.save()

    const commentWithAuthor = {
      ...comment,
      author: user,
    }

    return NextResponse.json({
      success: true,
      comment: commentWithAuthor,
    })
  } catch (error) {
    console.error("Comment post error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
