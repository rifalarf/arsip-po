// ==========================================
// POST /api/upload — Upload file to Cloudflare R2
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const poId = formData.get("poId") as string | null;

        if (!file || !poId) {
            return NextResponse.json(
                { success: false, message: "File dan poId wajib diisi." },
                { status: 400 },
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Tipe file tidak didukung. Gunakan: PDF atau DOCX.`,
                },
                { status: 400 },
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: "Ukuran file maksimal 10MB." },
                { status: 400 },
            );
        }

        // Generate unique key
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `po-docs/${poId}/${timestamp}-${safeName}`;

        // Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: Buffer.from(arrayBuffer),
                ContentType: file.type,
            }),
        );

        // Build public URL
        const fileUrl = `${R2_PUBLIC_URL}/${key}`;

        // Update Supabase — use service role key for server-side
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase
            .from("pos")
            .update({ file_url: fileUrl })
            .eq("id", poId);

        if (error) {
            return NextResponse.json(
                { success: false, message: `Gagal update database: ${error.message}` },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "File berhasil diupload.",
            file_url: fileUrl,
            file_key: key,
        });
    } catch (err) {
        console.error("Upload error:", err);
        return NextResponse.json(
            {
                success: false,
                message:
                    err instanceof Error ? err.message : "Terjadi kesalahan saat upload.",
            },
            { status: 500 },
        );
    }
}
