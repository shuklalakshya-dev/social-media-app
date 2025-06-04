"use client"

import { useEffect, useState } from "react"
import { PostCard } from "./post-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfilePostsProps {
  user: any
}

export function ProfilePosts({ user }: ProfilePostsProps) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserPosts()
  }, [user])

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/posts/user/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching user posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Posts ({posts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {posts.map((post: any) => (
            <PostCard key={post._id} post={post} currentUser={user} />
          ))}
          {posts.length === 0 && <div className="text-center py-8 text-gray-500">You haven't posted anything yet.</div>}
        </div>
      </CardContent>
    </Card>
  )
}
