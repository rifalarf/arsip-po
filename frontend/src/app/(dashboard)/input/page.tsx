"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "@/lib/context";
import { useCreateBox } from "@/hooks/mutations";
import { useUsers } from "@/hooks/queries";
import { createBoxSchema, type CreateBoxInput } from "@/lib/schemas";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PackagePlus, Plus, X, CheckCircle2, Eye, Loader2, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PrintLabel } from "@/components/PrintLabel";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THIS_YEAR = String(new Date().getFullYear());

const PO_PREFIXES: { prefix: string; label: string; color: string }[] = [
  {
    prefix: "51000",
    label: "PI",
    color: "bg-violet-100 text-violet-700 border-violet-200",
  },
  {
    prefix: "52000",
    label: "PKC",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
];

function getPrefixSuggestions(value: string): typeof PO_PREFIXES {
  if (!value) return [];
  // Already at or beyond the full prefix length — no suggestion needed
  return PO_PREFIXES.filter(
    (p) => p.prefix.startsWith(value) && value.length < p.prefix.length,
  );
}

export default function BuatBoxPage() {
  const { user } = useApp();
  const createBox = useCreateBox();
  const { data: users = [] } = useUsers();
  const buyers = users.filter((u) => u.role === "buyer");
  const isAdmin = user?.role === "admin";

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  const form = useForm<CreateBoxInput>({
    resolver: zodResolver(createBoxSchema),
    defaultValues: {
      entries: [{ tahun: Number(THIS_YEAR), no_po: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  const watchedEntries = form.watch("entries");

  const [createdSummary, setCreatedSummary] = useState<string>("");
  const [createdBoxData, setCreatedBoxData] = useState<{
    boxId: string;
    no_gungyu: string;
    location_code: string | null;
    pos: { no_po: string; tahun: number }[];
  } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntries, setPreviewEntries] = useState<
    { tahun: number; no_po: string }[]
  >([]);

  const addField = () => {
    const last = watchedEntries[watchedEntries.length - 1];
    const lastTahun = last?.tahun ?? Number(THIS_YEAR);
    append({ tahun: lastTahun, no_po: "" });
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    remove(index);
  };

  const updateNoPO = (index: number, value: string) =>
    form.setValue(`entries.${index}.no_po`, value);

  const updateTahun = (index: number, value: string) =>
    form.setValue(`entries.${index}.tahun`, Number(value) || 0);

  const handlePaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = e.clipboardData.getData("text");
    const lines = pasted
      .split(/[\n,;\t]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      e.preventDefault();
      const baseTahun = watchedEntries[index]?.tahun ?? Number(THIS_YEAR);
      form.setValue(`entries.${index}.no_po`, lines[0]);
      lines.slice(1).forEach((no_po) => append({ tahun: baseTahun, no_po }));
    }
  };

  const handleSubmit = () => {
    const entries = watchedEntries
      .filter((f) => f.no_po.trim().length > 0)
      .map((f) => ({ tahun: f.tahun, no_po: f.no_po.trim() }));

    if (entries.length === 0) {
      toast.error("Gagal", { description: "Minimal 1 NO. PO harus diisi." });
      return;
    }

    setPreviewEntries(entries);
    setPreviewOpen(true);
  };

  const handleConfirm = async () => {
    if (!user) return;
    // Determine the owner: for admin, use selected buyer; for buyer, use self
    let owner = { id: user.id, name: user.name };
    if (isAdmin) {
      const selectedBuyer = buyers.find((b) => b.id === selectedOwnerId);
      if (!selectedBuyer) {
        toast.error("Gagal", {
          description: "Pilih PIC/Buyer terlebih dahulu.",
        });
        return;
      }
      owner = { id: selectedBuyer.id, name: selectedBuyer.name };
    }
    try {
      const result = await createBox.mutateAsync({
        entries: previewEntries,
        user: owner,
      });
      setPreviewOpen(false);
      if (result.success) {
        toast.success("Arsip dibuat", { description: result.message });
        setCreatedSummary(result.message);
        setCreatedBoxData(result.data || null);
        form.reset({ entries: [{ tahun: Number(THIS_YEAR), no_po: "" }] });
        setPreviewEntries([]);
      } else {
        toast.error("Gagal", { description: result.message });
      }
    } catch (err) {
      toast.error("Gagal", {
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
      });
    }
  };

  const filledCount = watchedEntries.filter((f) => f.no_po.trim()).length;

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 animate-in fade-in duration-500 print:hidden">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Buat Arsip Baru
          </h1>
          <p className="text-muted-foreground">
            Masukkan daftar NO. PO untuk membuat satu arsip baru
          </p>
        </div>

        <div className="w-full max-w-xl space-y-4">
          {createdSummary && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Arsip berhasil dibuat!
                </p>
                <p className="text-xs text-green-700 mt-0.5">{createdSummary}</p>
                <div className="mt-3 flex items-center gap-2">
                  {createdBoxData && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setTimeout(() => window.print(), 100);
                      }}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Cetak Label
                    </Button>
                  )}
                  {createdBoxData?.boxId && (
                    <Link href={`/boxes/${createdBoxData.boxId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100 bg-white"
                      >
                        Lihat Detail Box
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <button
                className="ml-auto text-green-500 hover:text-green-700"
                onClick={() => {
                  setCreatedSummary("");
                  setCreatedBoxData(null);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Card className="border-0 shadow-lg ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" />
                Detail Arsip
              </CardTitle>
              <CardDescription>
                Satu kali submit = satu arsip baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* PIC Selector for admin */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    PIC / Buyer <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedOwnerId}
                    onValueChange={setSelectedOwnerId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pilih buyer…" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Pilih buyer yang bertanggung jawab atas arsip ini.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Daftar NO. PO <span className="text-destructive">*</span>
                  </Label>
                  {filledCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filledCount} PO
                    </Badge>
                  )}
                </div>
                {/* Column headers */}
                <div className="flex items-center gap-2 px-0">
                  <span className="w-6 shrink-0" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0 font-medium">
                    Tahun
                  </span>
                  <span className="text-xs text-muted-foreground flex-1 font-medium">
                    No. PO
                  </span>
                  <span className="w-9 shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste multiple baris di kolom No. PO, atau tekan Enter untuk
                  tambah baris.
                </p>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {fields.map((field, index) => {
                    const entry = watchedEntries[index];
                    const suggestions = getPrefixSuggestions(entry?.no_po ?? "");
                    const showSuggestions =
                      focusedIndex === index && suggestions.length > 0;
                    return (
                      <div
                        key={field.id}
                        className="animate-in slide-in-from-left-2 duration-200"
                      >
                        <div className="flex items-center gap-2 group">
                          <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                            {index + 1}.
                          </span>
                          <Input
                            type="number"
                            placeholder="2025"
                            value={entry?.tahun || ""}
                            onChange={(e) => updateTahun(index, e.target.value)}
                            className="w-20 shrink-0 font-mono h-9 text-center"
                            min={2000}
                            max={new Date().getFullYear() + 1}
                          />
                          <div className="relative flex-1">
                            <Input
                              placeholder="Contoh: 5200019231"
                              value={entry?.no_po ?? ""}
                              onChange={(e) => updateNoPO(index, e.target.value)}
                              onPaste={(e) => handlePaste(index, e)}
                              onFocus={() => setFocusedIndex(index)}
                              onBlur={() => setFocusedIndex(null)}
                              onKeyDown={(e) => {
                                const s = getPrefixSuggestions(
                                  entry?.no_po ?? "",
                                );
                                if (e.key === "Tab" && s.length > 0) {
                                  e.preventDefault();
                                  updateNoPO(index, s[0].prefix);
                                } else if (e.key === "Enter") {
                                  e.preventDefault();
                                  addField();
                                }
                              }}
                              className="font-mono w-full h-9"
                              autoFocus={index === fields.length - 1 && index > 0}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeField(index)}
                            disabled={fields.length === 1}
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {showSuggestions && (
                          <div className="flex items-center gap-1.5 pl-8 pt-1 pb-0.5">
                            {suggestions.map((s, si) => (
                              <button
                                key={s.prefix}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  updateNoPO(index, s.prefix);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono shadow-sm hover:opacity-75 transition-opacity ${s.color}`}
                              >
                                {si === 0 && (
                                  <kbd className="text-[9px] font-sans bg-white/60 border border-black/10 rounded px-0.5 leading-3.5">
                                    Tab
                                  </kbd>
                                )}
                                <span>{s.prefix}</span>
                                <span className="font-sans font-semibold">
                                  {s.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t mt-2">
                <Button
                  variant="outline"
                  onClick={addField}
                  className="flex-1 border-dashed h-10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Baris
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all h-10"
                >
                  Buat Arsip
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Logged in sebagai <strong>{user?.name ?? "—"}</strong> (
            {user?.role ?? "—"})
          </p>
        </div>

        {/* Preview Confirmation Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Konfirmasi Arsip Baru
              </DialogTitle>
              <DialogDescription>
                Periksa kembali sebelum menyimpan. Box akan langsung berstatus{" "}
                <strong>Diarsipkan</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex-1 rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Jumlah PO
                  </p>
                  <p className="font-bold text-xl text-primary">
                    {previewEntries.length}
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-muted-foreground text-xs mb-0.5">Tahun</p>
                  <p className="font-bold text-xl">
                    {[...new Set(previewEntries.map((e) => e.tahun))].join(", ")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-8 py-2">#</TableHead>
                        <TableHead className="py-2">No. PO</TableHead>
                        <TableHead className="py-2 w-16">Tahun</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewEntries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="py-1.5 text-muted-foreground text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="py-1.5 font-mono text-sm font-medium">
                            {entry.no_po}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm">
                            {entry.tahun}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Kembali Edit
              </Button>
              <Button
                onClick={handleConfirm}
                className="gap-2"
                disabled={createBox.isPending}
              >
                {createBox.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Konfirmasi & Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      {/* Print label (hidden on screen, visible on print) */}
      {createdBoxData && (
        <PrintLabel
          boxId={createdBoxData.no_gungyu}
          location={createdBoxData.location_code}
          pos={createdBoxData.pos}
        />
      )}
    </>
  );
}
