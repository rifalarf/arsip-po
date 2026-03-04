import React from "react";

interface PrintLabelProps {
    boxId: string;
    location?: string | null;
    pos: { no_po: string; tahun: number | string }[];
}

export function PrintLabel({ boxId, location, pos }: PrintLabelProps) {
    // Fill slots to exactly 40 (20 rows, 2 columns)
    const ROWS = 20;

    return (
        <div className="hidden print:flex print:w-full print:justify-start print:p-0">
            {/* The Print Layout Wrapper */}
            <div className="border border-black p-4 w-[400px]">
                <div className="text-center mb-2">
                    <h2 className="text-4xl font-bold mb-1">{boxId}</h2>
                    <p className="text-sm font-semibold py-1">
                        {location || "-"}
                    </p>
                </div>
                <table className="w-full text-[10px] border-collapse border border-black text-center font-mono tracking-tighter">
                    <thead>
                        <tr>
                            <th className="border border-black w-6 p-0.5">No</th>
                            <th className="border border-black w-10 p-0.5">Thn</th>
                            <th className="border border-black w-[100px] p-0.5">No. PO</th>
                            <th className="border border-black w-6 p-0.5">No</th>
                            <th className="border border-black w-10 p-0.5">Thn</th>
                            <th className="border border-black w-[100px] p-0.5">No. PO</th>
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
                                    <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                        {leftIndex + 1}
                                    </td>
                                    <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                        {leftPO?.tahun || ""}
                                    </td>
                                    <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                        {leftPO?.no_po || ""}
                                    </td>

                                    {/* Right Column */}
                                    <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                        {rightIndex + 1}
                                    </td>
                                    <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                        {rightPO?.tahun || ""}
                                    </td>
                                    <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
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
                                {boxId}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
