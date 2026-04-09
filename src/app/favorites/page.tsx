"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getServiceByIdClient, getExpertByIdClient } from "@/lib/db-client";
import type { Service, Expert } from "@/types";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [favoriteServices, setFavoriteServices] = useState<Service[]>([]);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});

  useEffect(() => {
    if (favorites.length === 0) {
      setFavoriteServices([]);
      return;
    }
    Promise.all(favorites.map((id) => getServiceByIdClient(id))).then((results) => {
      const svcs = results.filter((s): s is Service => s !== null);
      setFavoriteServices(svcs);

      const expertIds = [...new Set(svcs.map((s) => s.expertId))];
      Promise.all(expertIds.map((id) => getExpertByIdClient(id).then((e) => ({ id, expert: e })))).then(
        (expertResults) => {
          const map: Record<string, Expert> = {};
          for (const { id, expert } of expertResults) {
            if (expert) map[id] = expert;
          }
          setExpertMap(map);
        }
      );
    });
  }, [favorites]);

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
            {favoriteServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                expert={expertMap[service.expertId]}
              />
            ))}
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
