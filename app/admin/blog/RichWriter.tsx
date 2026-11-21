"use client";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Markdown } from "@tiptap/markdown";
import DragHandle from "@tiptap/extension-drag-handle-react";
import {
  Bold,
  Italic,
  Heading2,
  List,
  Undo2,
  Redo2,
  ImagePlus,
  Link2,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  imagePath,
  richText,
  validateRichDoc,
  type RichNode,
} from "@/lib/blog/rich-content";
import type { ArticleContent } from "@/lib/blog/model";

function ImageView({ node, selected, editor, getPos }: NodeViewProps) {
  const width = Number(node.attrs.width) || 100,
    align = node.attrs.align;
  return (
    <NodeViewWrapper
      as="figure"
      className={`writer-image ${selected ? "is-selected" : ""}`}
      style={{
        width: `${width}%`,
        marginLeft: align === "left" ? 0 : "auto",
        marginRight: align === "right" ? 0 : "auto",
      }}
    >
      <div
        contentEditable={false}
        onClick={() => {
          const pos = getPos();
          if (typeof pos === "number") editor.commands.setNodeSelection(pos);
        }}
      >
        {/* Native image sizing preserves the source aspect ratio in the editor. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          draggable={false}
        />
        {node.attrs.caption && <figcaption>{node.attrs.caption}</figcaption>}
      </div>
    </NodeViewWrapper>
  );
}
const EditorialImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: 100 },
      align: { default: "center" },
      caption: { default: "" },
    };
  },
  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (element) =>
          imagePath((element as HTMLElement).getAttribute("src")) ? {} : false,
      },
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});
export default function RichWriter({
  content,
  onChange,
  onPickImage,
  onProblem,
  disabled = false,
}: {
  content: ArticleContent;
  onChange: (doc: RichNode, body: string) => void;
  onPickImage: (insert: (url: string) => void) => void;
  onProblem: (message: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          protocols: ["https", "http", "mailto", "tel"],
        },
      }),
      EditorialImage,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Markdown,
    ],
    content: content.richDoc || content.body || "",
    contentType: content.richDoc ? "json" : "markdown",
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        "aria-label": "Article writing area",
        role: "textbox",
        "aria-multiline": "true",
        class: "editor-rich-prose",
      },
    },
    onUpdate: ({ editor }) => {
      const doc = validateRichDoc(editor.getJSON());
      if (!doc) {
        onProblem(
          "This content contains an unsupported image or formatting. Use the image library to add images.",
        );
        return;
      }
      const body = richText(doc);
      if (body.length > 60000) {
        onProblem(
          "This edition is over the 60,000 character limit. Shorten it before saving.",
        );
        return;
      }
      onChange(doc, body);
    },
  });
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  if (!editor)
    return <div className="editor-loading">Opening the writing canvas…</div>;
  function moveBlock(direction: number) {
    if (!editor) return;
    const nodes: { node: typeof editor.state.doc; pos: number }[] = [];
    editor.state.doc.forEach((node, pos) => nodes.push({ node, pos }));
    const position = editor.state.selection.from;
    const index = nodes.findIndex(
      (n, i) =>
        position >= n.pos &&
        (i === nodes.length - 1 || position < nodes[i + 1].pos),
    );
    const next = index + direction;
    if (index < 0 || next < 0 || next >= nodes.length) return;
    [nodes[index], nodes[next]] = [nodes[next], nodes[index]];
    editor.commands.setContent({
      type: "doc",
      content: nodes.map((n) => n.node.toJSON()),
    });
  }
  const image = editor.isActive("image") ? editor.getAttributes("image") : null;
  return (
    <div className="writer-shell">
      <div className="writer-toolbar" role="toolbar" aria-label="Writing tools">
        <button
          type="button"
          disabled={disabled || !editor.can().undo()}
          title="Undo"
          aria-label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          disabled={disabled || !editor.can().redo()}
          title="Redo"
          aria-label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Heading"
          aria-pressed={editor.isActive("heading")}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={17} />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Bullet list"
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={17} />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Add link"
          onClick={() => {
            const href = window.prompt(
              "Link address",
              editor.getAttributes("link").href || "https://",
            );
            if (href === null) return;
            if (!href) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            if (!/^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(href)) {
              onProblem("Use a website, email, phone, or internal link.");
              return;
            }
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href })
              .run();
          }}
        >
          <Link2 size={17} />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onPickImage((url) =>
              editor.chain().focus().setImage({ src: url, alt: "" }).run(),
            )
          }
        >
          <ImagePlus size={17} /> Insert image
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Move block up"
          title="Move selected paragraph or image up"
          onClick={() => moveBlock(-1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Move block down"
          title="Move selected paragraph or image down"
          onClick={() => moveBlock(1)}
        >
          <ArrowDown size={16} />
        </button>
      </div>
      {image && (
        <div className="image-inspector" aria-label="Selected image controls">
          <strong>Selected image</strong>
          <div className="editor-actions">
            {[25, 50, 75, 100].map((width, i) => (
              <button
                type="button"
                key={width}
                disabled={disabled}
                aria-pressed={Number(image.width) === width}
                onClick={() =>
                  editor.commands.updateAttributes("image", { width })
                }
              >
                {["Small", "Medium", "Large", "Full width"][i]}
              </button>
            ))}
          </div>
          <label>
            Width: {image.width}%
            <input
              disabled={disabled}
              type="range"
              min="20"
              max="100"
              value={Number(image.width) || 100}
              onChange={(event) =>
                editor.commands.updateAttributes("image", {
                  width: Number(event.target.value),
                })
              }
            />
          </label>
          <div className="editor-actions">
            {["left", "center", "right"].map((align) => (
              <button
                type="button"
                key={align}
                disabled={disabled}
                aria-pressed={image.align === align}
                onClick={() =>
                  editor.commands.updateAttributes("image", { align })
                }
              >
                {align[0].toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
          <label>
            Image description
            <input
              disabled={disabled}
              maxLength={300}
              value={image.alt || ""}
              onChange={(e) =>
                editor.commands.updateAttributes("image", {
                  alt: e.target.value,
                })
              }
            />
          </label>
          <label>
            Visible caption
            <input
              disabled={disabled}
              maxLength={500}
              value={image.caption || ""}
              onChange={(e) =>
                editor.commands.updateAttributes("image", {
                  caption: e.target.value,
                })
              }
            />
          </label>
          <button
            type="button"
            disabled={disabled}
            className="editor-quiet"
            onClick={() => editor.chain().focus().deleteSelection().run()}
          >
            Remove this image
          </button>
        </div>
      )}
      <p className="editor-helper">
        Write directly below. Drag the grip beside a paragraph or image to
        rearrange it, or use the up/down buttons.
      </p>
      <div className="writer-canvas">
        {!disabled && (
          <DragHandle editor={editor}>
            <div
              className="writer-grip"
              aria-label="Drag block to rearrange"
              title="Drag to rearrange"
            >
              <GripVertical size={19} />
            </div>
          </DragHandle>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
