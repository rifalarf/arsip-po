"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBoxes, usePOs } from "@/hooks/queries";
import { PrintLabel } from "@/components/PrintLabel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

// Helper function to chunk array
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
};

function PrintMassalContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const idsParam = searchParams.get("ids");
    const selectedIds = idsParam ? idsParam.split(",") : [];

    const { data: boxes = [] } = useBoxes();
    const { data: pos = [] } = usePOs();

    // Filter boxes
    const selectedBoxes = boxes.filter((b) => selectedIds.includes(b.id));

    // Chunk boxes into pages of 6 labels each (2 columns x 3 rows fit well on A4)
    const boxChunks = chunkArray(selectedBoxes, 6);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation Bar - Hidden when printing */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 print:hidden shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Preview Cetak Massal</h1>
                        <p className="text-sm text-muted-foreground">
                            {selectedBoxes.length} Label siap dicetak
                        </p>
                    </div>
                </div>
                <Button onClick={() => window.print()} className="bg-primary shadow-md">
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Sekarang
                </Button>
            </div>

            {/* Print Area */}
            <div className="flex-1 p-8 print:p-0 flex flex-col items-center">
                {selectedBoxes.length === 0 ? (
                    <div className="text-center mt-20 text-muted-foreground print:hidden">
                        <p>Tidak ada box yang dipilih untuk dicetak.</p>
                    </div>
                ) : (
                    <div className="print-container w-[21cm] mx-auto">
                        <style
                            type="text/css"
                            media="print"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    @page { size: A4 portrait; margin: 1cm; }
                                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                `,
                            }}
                        />
                        
                        {/* Render each chunk as a separate A4 page */}
                        {boxChunks.map((chunk, pageIndex) => (
                            <div 
                                key={pageIndex} 
                                className="bg-white shadow-xl print:shadow-none p-[1cm] print:p-[0cm] mb-8 print:mb-0 print:break-after-page"
                                style={{
                                    height: '29.7cm', // A4 height roughly
                                    overflow: 'hidden'
                                }}
                            >
                                {/* A4 Grid Layout: 2 Columns */}
                                <div className="grid grid-cols-2 justify-items-center column-gap-4 row-gap-8" style={{ rowGap: "1cm", columnGap: "0.5cm" }}>
                                    {chunk.map((box) => {
                                        const boxPOs = pos.filter((p) => p.box_id === box.id);
                                        return (
                                            <PrintLabel
                                                key={box.id}
                                                boxId={box.no_gungyu ?? "Box"}
                                                location={box.location_code}
                                                pos={boxPOs.map((p) => ({ no_po: p.no_po, tahun: p.tahun }))}
                                                standalone={false}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PrintMassalPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat data cetak...</div>}>
            <PrintMassalContent />
        </Suspense>
    );
}
