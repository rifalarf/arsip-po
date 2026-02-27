"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchPO, useBoxes } from "@/hooks/queries";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon,
  Package,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

function SearchContent() {
  const { data: boxes = [] } = useBoxes();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  // Sync URL ↔ input: update URL 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  const results = useSearchPO(query);

  function getBoxInfo(boxId: string) {
    return boxes.find((b) => b.id === boxId);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col transition-all duration-500",
        hasQuery ? "justify-start space-y-8" : "justify-center min-h-[80vh]",
      )}
    >
      <div
        className={cn(
          "space-y-6 text-center transition-all duration-500",
          hasQuery ? "text-left" : "",
        )}
      >
        <div className="space-y-2">
          <h1
            className={cn(
              "font-bold tracking-tight transition-all duration-300",
              hasQuery ? "text-2xl" : "text-4xl text-primary",
            )}
          >
            Cari Dokumen PO
          </h1>
          <p
            className={cn(
              "text-muted-foreground transition-all duration-300",
              hasQuery ? "text-sm" : "text-lg",
            )}
          >
            Sistem pencarian arsip digital terintegrasi
          </p>
        </div>

        {/* Search Input */}
        <div
          className={cn(
            "relative mx-auto transition-all duration-300",
            hasQuery ? "mx-0 max-w-xl" : "max-w-2xl",
          )}
        >
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            name="q"
            placeholder="Ketik NO. PO, NO. GUNGYU, atau Nama Barang\u2026"
            className="h-14 pl-12 pr-4 text-lg rounded-full shadow-sm hover:shadow-md transition-shadow border-muted-foreground/20 focus-visible:ring-primary/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Results */}
      {hasQuery && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Ditemukan{" "}
              <span className="text-foreground">{results.length}</span> hasil
            </p>
          </div>

          {results.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="py-12 text-center">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Tidak ada hasil</h3>
                <p className="text-muted-foreground">
                  Coba kata kunci lain atau pastikan nomor PO benar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((po) => {
                const box = getBoxInfo(po.box_id);
                return (
                  <div
                    key={po.id}
                    className="group relative bg-card rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant={
                          po.borrow_status === "BORROWED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="font-normal"
                      >
                        {po.borrow_status === "BORROWED"
                          ? "Dipinjam"
                          : "Tersedia"}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-primary">
                        {po.no_po}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {box?.no_gungyu ?? "No Gungyu —"}
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-start gap-2.5">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="font-medium">{po.nama_barang}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{po.dok_date}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-foreground/80 font-mono text-xs">
                          {box?.location_code ?? "Belum ditempatkan"}
                        </span>
                      </div>
                      {po.keterangan && (
                        <div className="flex items-start gap-2.5 pt-1 border-t mt-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="italic text-muted-foreground text-xs">
                            {po.keterangan}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
