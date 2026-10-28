import type { Metadata } from "next";
import BlogEditor from "./BlogEditor";
import { localEditor } from "@/lib/blog/database";
export const metadata: Metadata = {
  title: "Private Editorial",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function BlogEditorPage() {
  return (
    <main id="main-content">
      <BlogEditor localPreview={localEditor()} />
    </main>
  );
}
