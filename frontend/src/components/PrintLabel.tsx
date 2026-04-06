import React from "react";
import { Scissors } from "lucide-react";

interface PrintLabelProps {
    boxId: string;
    location?: string | null;
    pos: { no_po: string; tahun: number | string }[];
    standalone?: boolean;
}

export function PrintLabel({ boxId, location, pos, standalone = true }: PrintLabelProps) {
    const ROWS = 12;

    const content = (
        <div className="relative border border-dashed border-gray-500 p-1 w-[8cm] h-[8.2cm] overflow-visible flex flex-col bg-white">
            {/* Scissors Icon pushed slightly out */}
            <div className="absolute -top-3.5 -left-3.5 bg-transparent text-gray-500">
                <Scissors size={18} />
            </div>

            {/* Inner Border Constraint matching illustration exactly */}
            <div className="m-1 flex-1 flex flex-col">
                <div className="flex items-center mb-1 pb-1 border-b border-black">
                    {/* Logo */}
                    <div className="w-12 pl-1 flex-shrink-0">
                        <img src="/logo-kujang.png" alt="Logo" className="w-full h-auto object-contain grayscale" />
                    </div>

                    {/* Text Center */}
                    <div className="flex-1 text-center">
                        <p className="text-[7px] uppercase tracking-wider font-semibold text-gray-600 mb-0.5">Arsip Pengadaan Barang & Jasa</p>
                        <h2 className="text-xl font-black tracking-tight mb-0.5 leading-none">{boxId}</h2>
                        <div className="inline-block border border-black px-1 py-0.5 bg-gray-100">
                            <p className="text-[6px] font-bold leading-none uppercase">
                                LOKASI: {location || "BELUM DITENTUKAN"}
                            </p>
                        </div>
                    </div>

                    {/* Spacer for centering balance */}
                    <div className="w-12 flex-shrink-0"></div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col justify-center">
                    <table className="w-full h-full text-[9px] border-collapse border border-black text-center font-mono tracking-tighter">
                        <thead>
                            <tr>
                                <th className="border border-black w-5 px-0.5 py-0.5 align-middle">No</th>
                                <th className="border border-black w-8 px-0.5 py-0.5 align-middle">Thn</th>
                                <th className="border border-black w-auto px-0.5 py-0.5 align-middle">No. PO</th>
                                <th className="border border-black w-5 px-0.5 py-0.5 align-middle">No</th>
                                <th className="border border-black w-8 px-0.5 py-0.5 align-middle">Thn</th>
                                <th className="border border-black w-auto px-0.5 py-0.5 align-middle">No. PO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: ROWS }).map((_, i) => {
                                const leftIndex = i;
                                const rightIndex = i + ROWS;

                                const leftPO = pos[leftIndex];
                                const rightPO = pos[rightIndex];

                                return (
                                    <tr key={i}>
                                        {/* Left Column */}
                                        <td className="border border-black px-0.5 py-0 text-center align-middle text-[9px] font-medium text-foreground">
                                            {leftIndex + 1}
                                        </td>
                                        <td className="border border-black px-0.5 py-0 text-center align-middle text-[9px] font-medium text-foreground">
                                            {leftPO?.tahun || ""}
                                        </td>
                                        <td className="border border-black px-0.5 py-0 text-center align-middle text-[9px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[65px]">
                                            {leftPO?.no_po || ""}
                                        </td>

                                        {/* Right Column */}
                                        <td className="border border-black px-0.5 py-0 text-center align-middle text-[9px] font-medium text-foreground">
                                            {rightIndex + 1}
                                        </td>
                                        <td className="border border-black px-0.5 py-0 text-center align-middle text-[9px] font-medium text-foreground">
                                            {rightPO?.tahun || ""}
                                        </td>
                                        <td className="border border-black px-0.5 py-0 text-center align-middle text-[9px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[65px]">
                                            {rightPO?.no_po || ""}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr>
                                <td
                                    className="border border-black py-1 font-bold text-[12px]"
                                    colSpan={6}
                                >
                                    {location || "BELUM DITENTUKAN"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (!standalone) {
        return content;
    }

    return (
        <div className="hidden print:flex print:w-full print:justify-start print:p-0">
            <style
                type="text/css"
                media="print"
                dangerouslySetInnerHTML={{ __html: "@page { size: auto; margin: 0mm; }" }}
            />
            {content}
        </div>
    );
}
