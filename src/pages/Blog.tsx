import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Image, 
  Smile, 
  MapPin, 
  Tag, 
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  X,
  Loader2
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/utils/imageUtils';
import { toast } from 'sonner';

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  images?: string[];
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

export default function BlogPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            newImages.push(result);
            if (newImages.length === Array.from(files).length) {
              setSelectedImages((prev) => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng bài');
      return;
    }

    if (!postContent.trim() && selectedImages.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc chọn ảnh');
      return;
    }

    setIsPosting(true);
    try {
      // TODO: Call API to create post
      // const response = await blogService.createPost({
      //   content: postContent,
      //   images: selectedImages,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPost: Post = {
        id: Date.now().toString(),
        author: {
          name: user?.fullName || user?.username || 'User',
          avatar: user?.avatar,
        },
        content: postContent,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
      };

      setPosts((prev) => [newPost, ...prev]);
      setPostContent('');
      setSelectedImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Đăng bài thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Create Post Form - Facebook Style */}
        {isAuthenticated && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getAvatarUrl(user?.avatar, { width: 200, height: 200, quality: 80 })}
                    alt={user?.fullName || user?.username || 'User'}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Bạn đang nghĩ gì?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handlePost();
                      }
                    }}
                  />
                  
                  {/* Selected Images Preview */}
                  {selectedImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {selectedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Image className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Ảnh/Video</span>
                      </label>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Smile className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Cảm xúc</span>
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Tag className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Gắn thẻ</span>
                      </button>
                    </div>
                    <Button
                      onClick={handlePost}
                      disabled={isPosting || (!postContent.trim() && selectedImages.length === 0)}
                      className="px-6"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang đăng...
                        </>
                      ) : (
                        'Đăng'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  {isAuthenticated
                    ? 'Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!'
                    : 'Đăng nhập để xem và tạo bài viết'}
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getAvatarUrl(post.author.avatar, { width: 200, height: 200, quality: 80 })}
                          alt={post.author.name}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                          {post.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(post.createdAt)}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-muted rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-3">
                    <p className="text-foreground whitespace-pre-wrap break-words">{post.content}</p>
                  </div>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={`mb-3 ${post.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                      {post.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Post image ${index + 1}`}
                          className={`w-full rounded-lg object-cover ${
                            post.images?.length === 1 ? 'max-h-96' : 'h-48'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Stats */}
                  {(post.likes > 0 || post.comments > 0 || post.shares > 0) && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 pb-3 border-b">
                      <div className="flex items-center gap-4">
                        {post.likes > 0 && (
                          <span>
                            {post.likes} {post.likes === 1 ? 'lượt thích' : 'lượt thích'}
                          </span>
                        )}
                        {post.comments > 0 && (
                          <span>
                            {post.comments} {post.comments === 1 ? 'bình luận' : 'bình luận'}
                          </span>
                        )}
                        {post.shares > 0 && (
                          <span>
                            {post.shares} {post.shares === 1 ? 'lượt chia sẻ' : 'lượt chia sẻ'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-around border-t pt-2">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors flex-1 justify-center ${
                        post.isLiked ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">Thích</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors flex-1 justify-center text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Bình luận</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors flex-1 justify-center text-muted-foreground">
                      <Share2 className="w-5 h-5" />
                      <span className="font-medium">Chia sẻ</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
