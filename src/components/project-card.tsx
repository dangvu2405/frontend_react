/**
 * Project Card Component - Hiển thị thông tin đồ án
 * Tương tự ProjectCard nhưng được tùy chỉnh cho đồ án
 */

import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Star, 
  Download, 
  Heart, 
  ExternalLink,
  FileText,
  Code,
  GraduationCap,
  ShoppingCart
} from "lucide-react";
import type { Project } from "@/types/models/product";
import type { RatingStats } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TechStackBadges } from "@/components/ui/tech-stack-badges";
import { reviewService } from "@/services/reviewService";
import { storage } from "@/utils/storage";
import { heartService } from "@/services/heartService";
import { useAuth } from "@/contexts/AuthContext";
import { getCloudinaryProjectImageUrl } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE = "https://placehold.co/300x300/E5E5EA/000?text=No+Image";

type ProjectCardProps = {
  project: Project;
  onAddToCart?: (project: Project) => void;
  showAddToCartButton?: boolean;
  onProjectClick?: (projectId: string) => void;
  className?: string;
};

export const ProjectCard = memo(({ 
  project, 
  onAddToCart,
  showAddToCartButton = true,
  onProjectClick,
  className
}: ProjectCardProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState<RatingStats | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingHeart, setIsTogglingHeart] = useState(false);

  // Get project ID
  const projectId = String(
    (project as unknown as Record<string, unknown>).id || 
    (project as unknown as Record<string, unknown>)._id || 
    ''
  );

  // Load heart status
  useEffect(() => {
    if (projectId) {
      setIsFavorite(storage.isHeart(projectId));
    }
  }, [projectId]);

  // Listen for hearts:updated event
  useEffect(() => {
    const handleHeartsUpdate = () => {
      if (projectId) {
        setIsFavorite(storage.isHeart(projectId));
      }
    };
    
    window.addEventListener('hearts:updated', handleHeartsUpdate);
    return () => {
      window.removeEventListener('hearts:updated', handleHeartsUpdate);
    };
  }, [projectId]);

  // Fetch rating stats
  useEffect(() => {
    if (!projectId) return;
    const fetchRating = async () => {
      try {
        const stats = await reviewService.getProjectRatingStats(String(projectId));
        setRating(stats);
      } catch (error) {
        // Silently fail - rating is optional
        if (import.meta.env.DEV) {
          console.debug('Rating stats not available', { projectId, error });
        }
      }
    };
    fetchRating();
  }, [projectId]);

  // Handle heart toggle
  const handleHeartToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingHeart) return;

    setIsTogglingHeart(true);
    const newFavoriteState = !isFavorite;

    try {
      if (newFavoriteState) {
        storage.addHeart(String(projectId));
        if (isAuthenticated) {
          try {
            await heartService.addHeart(String(projectId));
          } catch (error) {
            // Keep in localStorage even if API fails
          }
        }
      } else {
        storage.removeHeart(String(projectId));
        if (isAuthenticated) {
          try {
            await heartService.removeHeart(String(projectId));
          } catch (error) {
            // Remove from localStorage even if API fails
          }
        }
      }
      setIsFavorite(newFavoriteState);
      window.dispatchEvent(new Event('hearts:updated'));
    } catch (error) {
      console.error('Error toggling heart:', error);
    } finally {
      setIsTogglingHeart(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(project);
    }
  };

  // Handle card click
  const handleCardClick = () => {
    if (onProjectClick) {
      onProjectClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  // Get image URL
  const projectAny = project as unknown as Record<string, unknown>;
  const imageUrl = (projectAny.thumbnail as string) || 
                   project.HinhAnhChinh || 
                   ((projectAny.preview_images as string[])?.[0]) ||
                   (project.HinhAnhPhu?.[0]) ||
                   FALLBACK_IMAGE;

  const finalImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : getCloudinaryProjectImageUrl(imageUrl);

  // Get price
  const price = (projectAny.price as number) || project.Gia || 0;
  const discount = (projectAny.discount as number) || project.KhuyenMai || 0;
  const finalPrice = discount > 0 
    ? Math.round(price * (1 - discount / 100))
    : price;

  // Get title
  const titleText = String((projectAny.title as string) || project.TenSanPham || 'Đồ án');
  
  // Get subject/category for badge
  const subjectText = String((projectAny.subject as string) || (projectAny.category as string) || 'Đồ án');
  const levelText = projectAny.level ? String(projectAny.level) : null;

  return (
    <Card 
      className={cn(
        "w-full bg-card rounded-3xl shadow-lg p-3 flex flex-col h-full group cursor-pointer hover:shadow-xl transition-all duration-200",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
        <img
          src={finalImageUrl}
          alt={titleText}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleHeartToggle}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors z-10"
          aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isFavorite 
                ? "fill-red-500 text-red-500" 
                : "text-muted-foreground hover:text-red-500"
            )}
          />
        </button>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Subject & Level Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="default" className="text-xs">
            <GraduationCap className="w-3 h-3 mr-1" />
            {subjectText}
          </Badge>
          {levelText && (
            <Badge variant="outline" className="text-xs">
              {levelText}
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{titleText}</h3>

        {/* Tech Stack */}
        {(() => {
          const techStack = projectAny.tech_stack;
          if (!techStack || !Array.isArray(techStack) || techStack.length === 0) return null;
          return (
            <div className="mb-2">
              <TechStackBadges 
                techStack={(techStack as string[]).slice(0, 3)} 
                variant="secondary"
                showIcons={true}
              />
              {techStack.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{techStack.length - 3} khác
                </span>
              )}
            </div>
          );
        })()}

        {/* Rating & Downloads */}
        <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
          {rating && rating.avgRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.avgRating.toFixed(1)}</span>
              <span>({rating.totalReviews})</span>
            </div>
          )}
          {projectAny.downloads !== undefined && (
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{projectAny.downloads as number}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              {discount > 0 && (
                <span className="text-xs text-muted-foreground line-through mr-2">
                  {price.toLocaleString('vi-VN')}đ
                </span>
              )}
              <span className="text-lg font-bold text-primary">
                {finalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
            {showAddToCartButton && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="h-8 px-3 text-xs"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Mua
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProjectCard.displayName = "ProjectCard";
