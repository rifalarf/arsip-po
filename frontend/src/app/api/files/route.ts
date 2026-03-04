// ==========================================
// DELETE /api/files — Delete file from Cloudflare R2
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: NextRequest) {
    try {
        const { poId, fileUrl } = await request.json();

        if (!poId || !fileUrl) {
            return NextResponse.json(
                { success: false, message: "poId dan fileUrl wajib diisi." },
                { status: 400 },
            );
        }

        // Extract key from fileUrl
        const key = fileUrl.replace(`${R2_PUBLIC_URL}/`, "");

        // Delete from R2
        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
            }),
        );

        // Clear file_url in Supabase
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase
            .from("pos")
            .update({ file_url: null })
            .eq("id", poId);

        if (error) {
            return NextResponse.json(
                { success: false, message: `Gagal update database: ${error.message}` },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "File berhasil dihapus.",
        });
    } catch (err) {
        console.error("Delete file error:", err);
        return NextResponse.json(
            {
                success: false,
                message:
                    err instanceof Error ? err.message : "Terjadi kesalahan saat hapus file.",
            },
            { status: 500 },
        );
    }
}
