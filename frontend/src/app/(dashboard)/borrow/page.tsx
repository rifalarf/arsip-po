"use client";

import { useState } from "react";
import { usePOs, useBoxes, useBorrowLogs } from "@/hooks/queries";
import { useBorrowPO, useReturnPO } from "@/hooks/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

export default function BorrowPage() {
  const { data: pos = [] } = usePOs();
  const { data: borrowLogs = [] } = useBorrowLogs();
  const { data: boxes = [] } = useBoxes();
  const borrowPO = useBorrowPO();
  const returnPO = useReturnPO();

  // Dialog state
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowNotes, setBorrowNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const borrowedPOs = pos.filter((p) => p.borrow_status === "BORROWED");
  const activeLogs = borrowLogs.filter((l) => !l.returned_at);

  // Searchable POs for borrowing (only AVAILABLE ones)
  const availablePOs = pos.filter(
    (p) =>
      p.borrow_status === "AVAILABLE" &&
      (searchQuery === "" ||
        p.no_po.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const toggleBorrowPO = (id: string) => {
    setSelectedPOIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBorrow = async () => {
    if (selectedPOIds.length === 0 || !borrowerName.trim()) return;
    for (const id of selectedPOIds) {
      await borrowPO.mutateAsync({
        poId: id,
        borrowerName: borrowerName.trim(),
        notes: borrowNotes.trim(),
      });
    }
    toast.success(`${selectedPOIds.length} PO berhasil dipinjam`);
    setBorrowDialogOpen(false);
    setSelectedPOIds([]);
    setBorrowerName("");
    setBorrowNotes("");
    setSearchQuery("");
  };

  const handleReturn = async () => {
    if (!selectedPOId) return;
    await returnPO.mutateAsync({ poId: selectedPOId });
    toast.success("PO berhasil dikembalikan");
    setReturnDialogOpen(false);
    setSelectedPOId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peminjaman PO</h1>
          <p className="text-muted-foreground">
            Kelola peminjaman dan pengembalian PO
          </p>
        </div>
        <Button onClick={() => setBorrowDialogOpen(true)}>
          <BookOpen className="mr-2 h-4 w-4" />
          Pinjam PO
        </Button>
      </div>

      {/* Active Borrows */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            PO Sedang Dipinjam ({borrowedPOs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {borrowedPOs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada PO yang sedang dipinjam.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NO. PO</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Tgl Pinjam</TableHead>
                    <TableHead>Keperluan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowedPOs.map((po) => {
                    const log = activeLogs.find((l) => l.po_id === po.id);
                    const box = boxes.find((b) => b.id === po.box_id);
                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">
                          {po.no_po}
                        </TableCell>
                        <TableCell>{po.nama_barang}</TableCell>
                        <TableCell>{log?.borrower_name ?? "—"}</TableCell>
                        <TableCell>
                          {log?.borrowed_at
                            ? new Date(log.borrowed_at).toLocaleDateString(
                                "id-ID",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>{log?.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPOId(po.id);
                              setReturnDialogOpen(true);
                            }}
                          >
                            Kembalikan
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Peminjaman</CardTitle>
        </CardHeader>
        <CardContent>
          {borrowLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada riwayat peminjaman.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NO. PO</TableHead>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Tgl Pinjam</TableHead>
                    <TableHead>Tgl Kembali</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.no_po}
                        </TableCell>
                        <TableCell>{log.borrower_name}</TableCell>
                        <TableCell>
                          {new Date(log.borrowed_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell>
                          {log.returned_at
                            ? new Date(log.returned_at).toLocaleDateString(
                                "id-ID",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.returned_at ? "secondary" : "destructive"
                            }
                          >
                            {log.returned_at ? "Dikembalikan" : "Dipinjam"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Borrow Dialog */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pinjam PO</DialogTitle>
            <DialogDescription>
              Cari dan pilih PO yang akan dipinjam
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Cari PO</Label>
              <Input
                placeholder="Ketik NO. PO atau Nama Barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-md">
              {availablePOs.length === 0 && searchQuery ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Tidak ditemukan
                </p>
              ) : availablePOs.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Ketik untuk mencari PO...
                </p>
              ) : (
                availablePOs.slice(0, 20).map((po) => (
                  <label
                    key={po.id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPOIds.includes(po.id)}
                      onChange={() => toggleBorrowPO(po.id)}
                      className="h-3.5 w-3.5 shrink-0 accent-primary"
                    />
                    <span className="font-mono font-medium">{po.no_po}</span>
                    {po.nama_barang && (
                      <span className="text-muted-foreground truncate">
                        — {po.nama_barang}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
            {selectedPOIds.length > 0 && (
              <p className="text-xs text-primary font-medium">
                {selectedPOIds.length} PO dipilih
              </p>
            )}

            <div>
              <Label>Nama Peminjam</Label>
              <Input
                placeholder="Nama lengkap peminjam"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
              />
            </div>

            <div>
              <Label>Keperluan (opsional)</Label>
              <Input
                placeholder="Alasan peminjaman"
                value={borrowNotes}
                onChange={(e) => setBorrowNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBorrowDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleBorrow}
              disabled={selectedPOIds.length === 0 || !borrowerName.trim()}
            >
              Pinjam{" "}
              {selectedPOIds.length > 0 ? `(${selectedPOIds.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kembalikan PO</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengembalikan PO ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleReturn}>Kembalikan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
