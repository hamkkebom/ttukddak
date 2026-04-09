"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Zap, Award, Heart, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Service, Expert } from "@/types";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";

interface ServiceCardProps {
  service: Service;
  expert?: Expert;
  className?: string;
}

export function ServiceCard({ service, expert, className }: ServiceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isLiked = isFavorite(service.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  return (
    <Link href={`/service/${service.id}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md h-full flex flex-col",
        className
      )}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <Image
            src={service.thumbnail}
            alt={service.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {service.isPrime && (
              <Badge className="bg-gradient-to-r from-primary to-orange-400 text-white border-0 shadow-lg">
                <Zap className="h-3 w-3 mr-1" />
                프라임
              </Badge>
            )}
            {service.isFastResponse && (
              <Badge className="bg-white/90 text-slate-700 border-0 shadow-lg backdrop-blur-sm">
                <Zap className="h-3 w-3 mr-1 text-green-500" />
                빠른응답
              </Badge>
            )}
          </div>

           {/* Like Button */}
           <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               toggleFavorite(service.id);
               toast.success(
                 isLiked ? "찜 목록에서 삭제되었습니다" : "찜 목록에 추가되었습니다"
               );
             }}
             className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
             aria-label={isLiked ? "찜 취소" : "찜하기"}
           >
             <Heart
               className={cn(
                 "h-5 w-5 transition-colors",
                 isLiked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"
               )}
             />
           </button>

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-6 w-6 text-primary fill-primary ml-1" />
            </div>
          </div>

          {/* Bottom Info on Hover */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white font-semibold text-sm">{service.rating.toFixed(1)}</span>
              <span className="text-white/70 text-sm">({service.reviewCount})</span>
            </div>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Expert Info */}
          {expert ? (
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-7 w-7 ring-2 ring-white shadow-sm">
                <AvatarImage src={expert.profileImage} alt={expert.name} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-orange-400 text-white">
                  {expert.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-700">{expert.name}</span>
              {expert.isMaster && (
                <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5 bg-amber-50 border-amber-200 text-amber-700">
                  <Award className="h-3 w-3" />
                  마스터
                </Badge>
              )}
              {expert.isPrime && !expert.isMaster && (
                <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5 bg-primary/5 border-primary/20 text-primary">
                  프라임
                </Badge>
              )}
            </div>
          ) : (
            <div className="h-7 mb-3" />
          )}

          {/* Title */}
          <h3 className="font-semibold text-slate-900 line-clamp-2 mb-3 leading-snug group-hover:text-primary transition-colors flex-1">
            {service.title}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {service.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Price & Rating */}
          <div className="flex items-end justify-between pt-3 border-t border-slate-100 mt-auto">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">시작가</p>
              <p className="text-xl font-bold text-slate-900 font-number">
                {formatPrice(service.price)}
                <span className="text-sm font-normal text-slate-500">원~</span>
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm font-number">{service.rating.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
