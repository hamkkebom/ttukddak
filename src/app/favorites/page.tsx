"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getServiceById } from "@/data/services";
import { getExpertById } from "@/data/experts";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  const favoriteServices = favorites
    .map((id) => getServiceById(id))
    .filter(Boolean);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">찜 목록</h1>
              <p className="text-muted-foreground text-sm">
                {favoriteServices.length}개의 서비스를 찜했습니다
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {favoriteServices.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteServices.map(
              (service) =>
                service && (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    expert={getExpertById(service.expertId)}
                  />
                )
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              아직 찜한 서비스가 없습니다
            </h3>
            <p className="text-muted-foreground mb-6">
              마음에 드는 서비스를 찜해보세요
            </p>
            <Button asChild>
              <Link href="/categories">
                서비스 둘러보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
