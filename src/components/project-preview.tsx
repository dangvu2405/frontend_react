/**
 * ProjectPreview Component
 * Hiển thị gallery ảnh preview và demo link cho đồ án
 */

import { useState } from "react";
import { ExternalLink, Play, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectPreviewProps {
  images: string[];
  demoUrl?: string;
  videoUrl?: string;
  className?: string;
}

export function ProjectPreview({ 
  images, 
  demoUrl, 
  videoUrl,
  className 
}: ProjectPreviewProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
          <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
          <p>Chưa có ảnh preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={images[selectedImage]}
          alt={`Preview ${selectedImage + 1}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/800x450/E5E5EA/000?text=No+Image";
          }}
        />
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                selectedImage === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/80x80/E5E5EA/000?text=No+Image";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Demo & Video Links */}
      {(demoUrl || videoUrl) && (
        <div className="flex gap-3">
          {demoUrl && (
            <Button
              asChild
              variant="default"
              className="flex-1"
            >
              <a 
                href={demoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Xem Demo
              </a>
            </Button>
          )}
          {videoUrl && (
            <Button
              asChild
              variant="outline"
              className="flex-1"
            >
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Video Demo
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
