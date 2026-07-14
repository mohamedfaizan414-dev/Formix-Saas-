import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export function RichTextInput({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
      }),
      Underline,
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      ListItem,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-ink/15 bg-white dark:bg-paper-darkdim overflow-hidden focus-within:border-clinical-teal transition-all w-full">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink/10 bg-paper-dim p-1.5 dark:bg-paper-dark">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-xs text-ink-soft hover:bg-ink/5 transition-colors",
            editor.isActive("bold") && "bg-ink/10 text-ink font-bold dark:bg-white/10 dark:text-white"
          )}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-xs text-ink-soft hover:bg-ink/5 transition-colors",
            editor.isActive("italic") && "bg-ink/10 text-ink font-bold dark:bg-white/10 dark:text-white"
          )}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded-xs text-ink-soft hover:bg-ink/5 transition-colors",
            editor.isActive("underline") && "bg-ink/10 text-ink font-bold dark:bg-white/10 dark:text-white"
          )}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-ink/10 mx-0.5 dark:bg-white/10" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "p-1.5 rounded-xs text-ink-soft hover:bg-ink/5 transition-colors",
            editor.isActive("heading", { level: 1 }) && "bg-ink/10 text-ink font-bold dark:bg-white/10 dark:text-white"
          )}
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded-xs text-ink-soft hover:bg-ink/5 transition-colors",
            editor.isActive("heading", { level: 2 }) && "bg-ink/10 text-ink font-bold dark:bg-white/10 dark:text-white"
          )}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-xs text-ink-soft hover:bg-ink/5 transition-colors",
            editor.isActive("bulletList") && "bg-ink/10 text-ink font-bold dark:bg-white/10 dark:text-white"
          )}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>

      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-sm dark:prose-invert max-h-48 overflow-y-auto p-3 text-sm focus:outline-none min-h-[100px] text-ink dark:text-white w-full",
          "list-[disc] list-inside ml-4 prose-li:my-0.5"
        )} 
      />
    </div>
  );
}
