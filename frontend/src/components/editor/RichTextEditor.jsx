import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar.jsx";

const RichTextEditor = ({ value, onChange, placeholder = "Start writing…" }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "nowrite-code-block" } },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "nowrite-link" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "nowrite-prose focus:outline-none min-h-[260px] max-h-[50vh] overflow-y-auto px-1 py-2",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // Treat empty paragraph as empty string
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g., switching between create/edit)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && next !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-2">
      <EditorToolbar editor={editor} />
      <div className="border border-stone-200 dark:border-stone-700 rounded-lg bg-white/60 dark:bg-stone-900/40 px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
