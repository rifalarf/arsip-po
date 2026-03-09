"use client";

import { use, useState } from "react";
import { useApp } from "@/lib/context";
import {
  useBoxById,
  usePOsByBoxId,
  useBoxes,
  useBins,
  useOccupiedBinIds,
} from "@/hooks/queries";
import {
  useAssignBoxToBin,
  useRelocateBox,
  useMovePOToBox,
  useDeleteBox,
} from "@/hooks/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer, ArrowLeft, MapPin, ArrowRightLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BoxStatus } from "@/lib/types";
import { PrintLabel } from "@/components/PrintLabel";

const STATUS_COLORS: Record<BoxStatus, string> = {
  ARCHIVED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<BoxStatus, string> = {
  ARCHIVED: "Diarsipkan",
  CANCELLED: "Dibatalkan",
};

export default function BoxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useApp();
  const box = useBoxById(id);
  const pos = usePOsByBoxId(id);
  const { data: boxes = [] } = useBoxes();
  const { data: bins = [] } = useBins();
  const occupiedBinIds = useOccupiedBinIds();

  const assignBoxToBin = useAssignBoxToBin();
  const relocateBox = useRelocateBox();
  const movePOToBox = useMovePOToBox();

  // Assign bin state
  const [selectedBinId, setSelectedBinId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Relocate dialog
  const [relocateOpen, setRelocateOpen] = useState(false);
  const [relocateBinId, setRelocateBinId] = useState<string>("");
  const [relocateNotes, setRelocateNotes] = useState("");

  // Move PO dialog
  const [movePOOpen, setMovePOOpen] = useState(false);
  const [movePOId, setMovePOId] = useState<string>("");
  const [moveTargetBoxId, setMoveTargetBoxId] = useState<string>("");
  const [moveReason, setMoveReason] = useState("");

  // Delete Box dialog
  const [deleteBoxOpen, setDeleteBoxOpen] = useState(false);
  const deleteBoxMutation = useDeleteBox();
  const router = useRouter();

  if (!box) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Box tidak ditemukan.</p>
        <Link href="/boxes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>
      </div>
    );
  }

  const occupiedBinIdsSet = occupiedBinIds;
  const availableBins = bins.filter(
    (b) => b.is_active && !occupiedBinIdsSet.has(b.id),
  );
  const allBinsExceptCurrent = bins.filter(
    (b) => b.is_active && b.id !== box.bin_id && !occupiedBinIdsSet.has(b.id),
  );
  const otherBoxes = boxes.filter(
    (b) => b.id !== box.id && b.status !== "CANCELLED",
  );

  const handleAssign = async () => {
    if (!selectedBinId) {
      toast.error("Pilih bin terlebih dahulu");
      return;
    }
    setAssignLoading(true);
    const result = await assignBoxToBin.mutateAsync({
      boxId: box.id,
      binId: selectedBinId,
      userName: user?.name ?? "",
    });
    setAssignLoading(false);
    if (result.success)
      toast.success("Berhasil", { description: result.message });
    else toast.error("Gagal", { description: result.message });
    setSelectedBinId("");
  };

  const handleRelocate = async () => {
    if (!relocateBinId) {
      toast.error("Pilih bin tujuan terlebih dahulu");
      return;
    }
    const result = await relocateBox.mutateAsync({
      boxId: box.id,
      newBinId: relocateBinId,
      notes: relocateNotes,
      userName: user?.name ?? "",
    });
    if (result.success) {
      toast.success("Berhasil", { description: result.message });
      setRelocateOpen(false);
      setRelocateBinId("");
      setRelocateNotes("");
    } else toast.error("Gagal", { description: result.message });
  };

  const handleMovePO = async () => {
    if (!moveTargetBoxId) {
      toast.error("Pilih box tujuan terlebih dahulu");
      return;
    }
    const result = await movePOToBox.mutateAsync({
      poId: movePOId,
      targetBoxId: moveTargetBoxId,
      reason: moveReason,
      userName: user?.name ?? "",
    });
    if (result.success) {
      toast.success("Berhasil", { description: result.message });
      setMovePOOpen(false);
      setMovePOId("");
      setMoveTargetBoxId("");
      setMoveReason("");
    } else toast.error("Gagal", { description: result.message });
  };

  const handleDeleteBox = async () => {
    const result = await deleteBoxMutation.mutateAsync({ boxId: box.id });
    if (result.success) {
      toast.success("Berhasil", { description: result.message });
      setDeleteBoxOpen(false);
      router.push("/boxes");
    } else {
      toast.error("Gagal Hapus", { description: result.message });
    }
  };

  return (
    <>
      <div className="space-y-6 print:hidden">
        <Link href="/boxes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Box
          </Button>
        </Link>

        {/* Box Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">
                  {box.no_gungyu ?? `Box — ${box.owner_name.split(" ")[0]}`}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Dibuat oleh <strong>{box.owner_name}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border",
                    STATUS_COLORS[box.status],
                  )}
                >
                  {STATUS_LABELS[box.status]}
                </span>
                {box.status === "ARCHIVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Label
                  </Button>
                )}
                {/* Delete Box Button */}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteBoxOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Box
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">Jumlah PO</p>
                <p className="font-semibold text-lg">{pos.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">No. Gungyu</p>
                <p className="font-semibold text-lg">
                  {box.no_gungyu ?? (
                    <span className="text-muted-foreground text-sm">
                      Belum ditetapkan
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lokasi</p>
                <p className="font-semibold text-lg font-mono">
                  {box.location_code ?? (
                    <span className="text-muted-foreground text-sm font-sans">
                      —
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action panels by status */}
            {box.status === "ARCHIVED" && !box.bin_id && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <p className="text-sm font-medium text-blue-900">
                  Assign Lokasi Bin
                </p>
                <p className="text-xs text-blue-700">
                  Pilih bin kosong untuk mengarsipkan box ini.
                </p>
                <div className="flex gap-2">
                  <Select value={selectedBinId} onValueChange={setSelectedBinId}>
                    <SelectTrigger className="flex-1 h-9 text-sm bg-white">
                      <SelectValue placeholder="Pilih bin kosong…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBins.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          Tidak ada bin tersedia
                        </SelectItem>
                      ) : (
                        availableBins.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            <span className="font-mono">{b.bin_code}</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAssign}
                    disabled={!selectedBinId || assignLoading}
                    className="shrink-0"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Arsipkan
                  </Button>
                </div>
              </div>
            )}

            {box.status === "ARCHIVED" && box.bin_id && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRelocateOpen(true)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Relokasi Box
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* PO List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar PO ({pos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada PO dalam box ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>NO. PO</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>DOK DATE</TableHead>
                      <TableHead>Status</TableHead>
                      {box.status !== "CANCELLED" && (
                        <TableHead className="w-24" />
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pos.map((po, idx) => (
                      <TableRow key={po.id}>
                        <TableCell className="text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium font-mono">
                          {po.no_po}
                        </TableCell>
                        <TableCell>
                          {po.nama_barang || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {po.dok_date || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              po.borrow_status === "BORROWED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {po.borrow_status === "BORROWED"
                              ? "Dipinjam"
                              : "Tersedia"}
                          </Badge>
                        </TableCell>
                        {box.status !== "CANCELLED" && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setMovePOId(po.id);
                                setMovePOOpen(true);
                              }}
                            >
                              <ArrowRightLeft className="mr-1 h-3 w-3" />
                              Pindah
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Print label */}
      {box.status === "ARCHIVED" && (
        <PrintLabel
          boxId={box.no_gungyu ?? "Box"}
          location={box.location_code}
          pos={pos.map((p) => ({ no_po: p.no_po, tahun: p.tahun }))}
        />
      )}

      {/* Relocate Dialog */}
      <Dialog open={relocateOpen} onOpenChange={setRelocateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relokasi Box</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Bin Tujuan</Label>
              <Select value={relocateBinId} onValueChange={setRelocateBinId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bin kosong…" />
                </SelectTrigger>
                <SelectContent>
                  {allBinsExceptCurrent.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Tidak ada bin tersedia
                    </SelectItem>
                  ) : (
                    allBinsExceptCurrent.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <span className="font-mono">{b.bin_code}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Input
                placeholder="Alasan relokasi…"
                value={relocateNotes}
                onChange={(e) => setRelocateNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelocateOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleRelocate} disabled={!relocateBinId}>
              Relokasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move PO Dialog */}
      <Dialog open={movePOOpen} onOpenChange={setMovePOOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindahkan PO ke Box Lain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              PO:{" "}
              <strong className="font-mono text-foreground">
                {pos.find((p) => p.id === movePOId)?.no_po}
              </strong>
            </p>
            <div className="space-y-1.5">
              <Label>Box Tujuan</Label>
              <Select
                value={moveTargetBoxId}
                onValueChange={setMoveTargetBoxId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih box tujuan…" />
                </SelectTrigger>
                <SelectContent>
                  {otherBoxes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.no_gungyu ??
                        `Box — ${b.owner_name.split(" ")[0]}`}
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({b.status})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Alasan</Label>
              <Input
                placeholder="Alasan pemindahan…"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovePOOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleMovePO} disabled={!moveTargetBoxId}>
              Pindahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Box Confirmation Dialog */}
      <Dialog open={deleteBoxOpen} onOpenChange={setDeleteBoxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Box Permanen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground">
              Apakah Anda yakin ingin menghapus Box{" "}
              <strong className="font-mono">{box.no_gungyu}</strong> secara permanen?
            </p>
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20 text-destructive text-sm font-medium">
              Aksi ini bersifat destruktif! Menghapus Box akan turut menghancurkan semua data PO di dalamnya beserta riwayat log transfer dan peminjaman secara cascading.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBoxOpen(false)}
              disabled={deleteBoxMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBox}
              disabled={deleteBoxMutation.isPending}
            >
              {deleteBoxMutation.isPending ? "Menghapus..." : "Ya, Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
