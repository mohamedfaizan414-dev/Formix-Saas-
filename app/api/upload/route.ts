import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadDataUri } from "@/lib/cloudinary/upload";
import { prisma } from "@/lib/prisma";

// Accepts { dataUri, resourceType, folder } and stores the asset in Cloudinary,
// recording a FileAsset row so uploads are attributable and auditable.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { dataUri, resourceType, folder, originalName } = await req.json();
  if (!dataUri) return NextResponse.json({ error: "dataUri is required" }, { status: 400 });

  try {
    const result = await uploadDataUri(dataUri, {
      folder: `formix/${folder ?? "uploads"}`,
      resourceType: resourceType ?? "auto",
    });

    const asset = await prisma.fileAsset.create({
      data: {
        uploadedById: session.sub,
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        originalName,
        bytes: result.bytes,
      },
    });

    return NextResponse.json({ asset });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed. Check Cloudinary credentials." }, { status: 502 });
  }
}
