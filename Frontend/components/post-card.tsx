"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PostCardProps {
  post: any
  currentUser: any
}

export function PostCard({ post, currentUser }: PostCardProps) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser._id))
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [newComment, setNewComment] = useState("")

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setLiked(!liked)
        setLikesCount(liked ? likesCount - 1 : likesCount + 1)
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      })

      const data = await response.json()
      if (data.success) {
        setComments([...comments, data.comment])
        setNewComment("")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={post.author?.profilePicture || "/placeholder.svg"} />
            <AvatarFallback>{post.author?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author?.name}</p>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{post.content}</p>

        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className={liked ? "text-red-500" : ""}>
            <Heart className={`w-4 h-4 mr-1 ${liked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="w-4 h-4 mr-1" />
            {comments.length}
          </Button>

          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3">
            <form onSubmit={handleComment} className="flex space-x-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {comments.map((comment: any, index: number) => (
                <div key={index} className="flex space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={comment.author?.profilePicture || "/placeholder.svg"} />
                    <AvatarFallback>{comment.author?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1">
                    <p className="font-semibold text-sm">{comment.author?.name}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
