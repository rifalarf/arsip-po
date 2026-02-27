"use client";

import {
  usePOTransferHistory,
  useBoxLocationHistory,
  useBoxes,
  useBins,
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
import { ArrowRightLeft, MapPin } from "lucide-react";

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

  function getBoxLabel(boxId: string) {
    const box = boxes.find((box) => box.id === boxId);
    return box?.no_gungyu ?? `Box ${box?.tahun ?? boxId}`;
  }

  function getBinLabel(binId: string | null) {
    if (!binId) return "—";
    const bin = bins.find((bin) => bin.id === binId);
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

      <Tabs defaultValue="po">
        <TabsList>
          <TabsTrigger value="po">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Perpindahan PO ({poTransferHistory.length})
          </TabsTrigger>
          <TabsTrigger value="box">
            <MapPin className="h-4 w-4 mr-2" />
            Relokasi Box ({boxLocationHistory.length})
          </TabsTrigger>
        </TabsList>

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
