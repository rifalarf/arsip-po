"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock Data
const MOCK_BOX_ID = "27-N";
const MOCK_LOKASI = "A-01-02";
const MOCK_TAHUN = 2025;
const MOCK_POS = [
    "5200028142",
    "5200028144",
    "5200028166",
    "5200028169",
    "5200028179",
    "5200028181",
];

// Fill slots to exactly 40
const slotsArray = Array.from({ length: 40 }).map((_, i) => ({
    index: i + 1,
    po: MOCK_POS[i] || "",
    tahun: MOCK_POS[i] ? MOCK_TAHUN : "",
}));

// Helper logic for 2-column variants (20 rows, 2 cols = 40 entries)
const halfLength = 20;
const leftCol = slotsArray.slice(0, halfLength);
const rightCol = slotsArray.slice(halfLength, 40);

export default function PrintPreviewPage() {
    return (
        <div className="p-8 pb-20 space-y-12 max-w-7xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary">
                    Opsi Desain Cetak Label
                </h1>
                <p className="text-muted-foreground">
                    Silakan tinjau 3 opsi layout di bawah ini. Semua opsi dirancang dengan
                    kapasitas 40 slot nomor PO.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start justify-items-center">
                {/* VARIANT 1: Standard 2-Column */}
                <Card className="shadow-lg border-2 w-full max-w-[400px]">
                    <CardHeader className="bg-muted text-center py-4">
                        <CardTitle>Opsi 1: Standard 2-Column</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            (Tahun | No. PO) Kiri & Kanan
                        </p>
                    </CardHeader>
                    <CardContent className="p-6 bg-white flex justify-center">
                        {/* The Print Layout Wrapper */}
                        <div className="border border-black p-4 w-[280px]">
                            <div className="text-center mb-2">
                                <h2 className="text-4xl font-bold mb-1">{MOCK_BOX_ID}</h2>
                                <p className="text-sm font-semibold py-1">
                                    {MOCK_LOKASI}
                                </p>
                            </div>
                            <table className="w-full text-[10px] border-collapse border border-black text-center font-mono">
                                <thead>
                                    <tr>
                                        <th className="border border-black w-8">Tahun</th>
                                        <th className="border border-black">No. PO</th>
                                        <th className="border border-black w-8">Tahun</th>
                                        <th className="border border-black">No. PO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leftCol.map((item, i) => (
                                        <tr key={item.index}>
                                            <td className="border border-black h-4 px-1">
                                                {item.tahun}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {item.po}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {rightCol[i].tahun}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {rightCol[i].po}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td
                                            className="border border-black py-1 font-bold"
                                            colSpan={4}
                                        >
                                            {MOCK_BOX_ID}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* VARIANT 2: Numbered 2-Column */}
                <Card className="shadow-lg border-2 w-full max-w-[400px]">
                    <CardHeader className="bg-muted text-center py-4">
                        <CardTitle>Opsi 2: Numbered 2-Column</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Ada Nomor Urut (1-40)
                        </p>
                    </CardHeader>
                    <CardContent className="p-6 bg-white flex justify-center">
                        {/* The Print Layout Wrapper */}
                        <div className="border border-black p-4 w-[320px]">
                            <div className="text-center mb-2">
                                <h2 className="text-4xl font-bold mb-1">{MOCK_BOX_ID}</h2>
                                <p className="text-sm font-semibold py-1">
                                    {MOCK_LOKASI}
                                </p>
                            </div>
                            <table className="w-full text-[9px] border-collapse border border-black text-center font-mono">
                                <thead>
                                    <tr>
                                        <th className="border border-black w-4">No</th>
                                        <th className="border border-black w-8">Tahun</th>
                                        <th className="border border-black">No. PO</th>
                                        <th className="border border-black w-4">No</th>
                                        <th className="border border-black w-8">Tahun</th>
                                        <th className="border border-black">No. PO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leftCol.map((item, i) => (
                                        <tr key={item.index}>
                                            <td className="border border-black h-4">{item.index}</td>
                                            <td className="border border-black h-4 px-1">
                                                {item.tahun}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {item.po}
                                            </td>
                                            <td className="border border-black h-4">
                                                {rightCol[i].index}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {rightCol[i].tahun}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {rightCol[i].po}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td
                                            className="border border-black py-1 font-bold text-[11px]"
                                            colSpan={6}
                                        >
                                            {MOCK_BOX_ID}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* VARIANT 3: Single Column */}
                <Card className="shadow-lg border-2 w-full max-w-[400px]">
                    <CardHeader className="bg-muted text-center py-4">
                        <CardTitle>Opsi 3: Single Column</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Satu kolom memanjang (40 baris)
                        </p>
                    </CardHeader>
                    <CardContent className="p-6 bg-white flex justify-center">
                        {/* The Print Layout Wrapper */}
                        <div className="border border-black p-4 w-[200px]">
                            <div className="text-center mb-2">
                                <h2 className="text-4xl font-bold mb-1">{MOCK_BOX_ID}</h2>
                                <p className="text-sm font-semibold py-1">
                                    {MOCK_LOKASI}
                                </p>
                            </div>
                            <table className="w-full text-[10px] border-collapse border border-black text-center font-mono">
                                <thead>
                                    <tr>
                                        <th className="border border-black w-5">No</th>
                                        <th className="border border-black w-8">Tahun</th>
                                        <th className="border border-black">No. PO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slotsArray.map((item) => (
                                        <tr key={item.index}>
                                            <td className="border border-black h-4">{item.index}</td>
                                            <td className="border border-black h-4 px-1">
                                                {item.tahun}
                                            </td>
                                            <td className="border border-black h-4 px-1">
                                                {item.po}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td
                                            className="border border-black py-1 font-bold text-[12px]"
                                            colSpan={3}
                                        >
                                            {MOCK_BOX_ID}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
