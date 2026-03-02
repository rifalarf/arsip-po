import React from "react";

interface PrintLabelProps {
    boxId: string;
    location?: string | null;
    pos: { no_po: string; tahun: number | string }[];
}

export function PrintLabel({ boxId, location, pos }: PrintLabelProps) {
    // Fill slots to exactly 40
    const slotsArray = Array.from({ length: 40 }).map((_, i) => ({
        index: i + 1,
        po: pos[i]?.no_po || "",
        tahun: pos[i] ? pos[i].tahun : "",
    }));

    return (
        <div className="hidden print:flex print:w-full print:justify-center print:p-8">
            {/* The Print Layout Wrapper */}
            <div className="border border-black p-4 w-[200px]">
                <div className="text-center mb-2">
                    <h2 className="text-4xl font-bold mb-1">{boxId}</h2>
                    <p className="text-sm font-semibold py-1">
                        {location || "-"}
                    </p>
                </div>
                <table className="w-full text-[10px] border-collapse border border-black text-center font-mono">
                    <thead>
                        <tr>
                            <th className="border border-black w-5">No</th>
                            <th className="border border-black w-8">Thn</th>
                            <th className="border border-black">No. PO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slotsArray.map((item) => (
                            <tr key={item.index}>
                                <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">{item.index}</td>
                                <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                    {item.tahun}
                                </td>
                                <td className="border border-black h-4 px-1 text-center text-[10px] leading-tight font-medium text-foreground">
                                    {item.po}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td
                                className="border border-black py-1 font-bold text-[12px]"
                                colSpan={3}
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
