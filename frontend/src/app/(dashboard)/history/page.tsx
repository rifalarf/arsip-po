"use client";

import {
  usePOTransferHistory,
  useBoxLocationHistory,
  useBoxes,
  useBins,
  usePOs,
} from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, MapPin, PackagePlus } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const { data: poTransferHistory = [] } = usePOTransferHistory();
  const { data: boxLocationHistory = [] } = useBoxLocationHistory();
  const { data: boxes = [] } = useBoxes();
  const { data: bins = [] } = useBins();
  const { data: pos = [] } = usePOs();

  // Count POs per box
  const poCountByBox = pos.reduce<Record<string, number>>((acc, po) => {
    acc[po.box_id] = (acc[po.box_id] || 0) + 1;
    return acc;
  }, {});

  // Boxes sorted by created_at descending for Arsip Masuk
  const sortedBoxes = [...boxes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  function getBoxLabel(boxId: string) {
    const box = boxes.find((b) => b.id === boxId);
    return box?.no_gungyu ?? `Box ${box?.tahun ?? boxId}`;
  }

  function getBinLabel(binId: string | null) {
    if (!binId) return "—";
    const bin = bins.find((b) => b.id === binId);
    return bin?.bin_code ?? binId;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histori</h1>
        <p className="text-muted-foreground">
          Riwayat perpindahan PO dan relokasi box
        </p>
      </div>

      <Tabs defaultValue="arsip">
        <TabsList>
          <TabsTrigger value="arsip">
            <PackagePlus className="h-4 w-4 mr-2" />
            Arsip Masuk ({boxes.length})
          </TabsTrigger>
          <TabsTrigger value="po">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Perpindahan PO ({poTransferHistory.length})
          </TabsTrigger>
          <TabsTrigger value="box">
            <MapPin className="h-4 w-4 mr-2" />
            Relokasi Box ({boxLocationHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Arsip Masuk */}
        <TabsContent value="arsip" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catatan Arsip Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedBoxes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada arsip.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>No. Gungyu</TableHead>
                        <TableHead>Tahun</TableHead>
                        <TableHead>Dibuat Oleh</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead className="text-right">Jumlah PO</TableHead>
                        <TableHead>Waktu Dibuat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBoxes.map((box, idx) => (
                        <TableRow key={box.id}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-mono font-medium">
                            {box.no_gungyu ?? <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>{box.tahun}</TableCell>
                          <TableCell>{box.owner_name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {box.location_code ?? <span className="text-muted-foreground">Belum ditempatkan</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {poCountByBox[box.id] ?? 0}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(box.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PO Transfer History */}
        <TabsContent value="po" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Riwayat Perpindahan PO
              </CardTitle>
            </CardHeader>
            <CardContent>
              {poTransferHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat perpindahan PO.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>NO. PO</TableHead>
                        <TableHead>Dari Box</TableHead>
                        <TableHead>Ke Box</TableHead>
                        <TableHead>Dipindahkan Oleh</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Alasan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poTransferHistory
                        .slice()
                        .reverse()
                        .map((h, idx) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {h.no_po}
                            </TableCell>
                            <TableCell>{getBoxLabel(h.from_box_id)}</TableCell>
                            <TableCell>{getBoxLabel(h.to_box_id)}</TableCell>
                            <TableCell>{h.moved_by}</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(h.moved_at)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {h.reason || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Box Location History */}
        <TabsContent value="box" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Relokasi Box</CardTitle>
            </CardHeader>
            <CardContent>
              {boxLocationHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat relokasi box.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Box</TableHead>
                        <TableHead>Dari Bin</TableHead>
                        <TableHead>Ke Bin</TableHead>
                        <TableHead>Dipindahkan Oleh</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boxLocationHistory
                        .slice()
                        .reverse()
                        .map((h, idx) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell>{getBoxLabel(h.box_id)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {getBinLabel(h.from_bin_id)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {getBinLabel(h.to_bin_id)}
                            </TableCell>
                            <TableCell>{h.moved_by}</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(h.moved_at)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {h.notes || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
