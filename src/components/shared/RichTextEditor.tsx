import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import DOMPurify from 'dompurify';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, Heading1, Heading2, 
  Heading3, Undo, Redo, Quote
} from 'lucide-react';
import { cn } from '@/utils';

interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  maxLength?: number;
  className?: string;
  placeholder?: string;
}

const ToolbarButton = ({ 
  onClick, 
  active, 
  children, 
  disabled 
}: { 
  onClick: () => void; 
  active?: boolean; 
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "p-1.5 rounded transition-colors",
      active ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  maxLength,
  className,
  placeholder,
}) => {
  const editor = useEditor({
    extensions: [
      // @ts-ignore
      StarterKit.configure(),
      // @ts-ignore
      Underline.configure(),
      // @ts-ignore
      Link.configure({
        openOnClick: false,
      }),
      // @ts-ignore
      Image.configure(),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className={cn(
      "border rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all",
      readOnly && "border-none shadow-none",
      className
    )}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleHeading({ level: 1 })?.run()} 
            active={editor?.isActive('heading', { level: 1 })}
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleHeading({ level: 2 })?.run()} 
            active={editor?.isActive('heading', { level: 2 })}
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="w-px h-4 bg-gray-300 mx-1" />
          
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleBold()?.run()} 
            active={editor?.isActive('bold')}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleItalic()?.run()} 
            active={editor?.isActive('italic')}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleUnderline()?.run()} 
            active={editor?.isActive('underline')}
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="w-px h-4 bg-gray-300 mx-1" />
          
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleBulletList()?.run()} 
            active={editor?.isActive('bulletList')}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleOrderedList()?.run()} 
            active={editor?.isActive('orderedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => (editor?.chain()?.focus() as any).toggleBlockquote()?.run()} 
            active={editor?.isActive('blockquote')}
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="w-px h-4 bg-gray-300 mx-1" />
          
          <ToolbarButton onClick={() => {
            const url = window.prompt('Nhập URL liên kết');
            if (url) (editor?.chain()?.focus() as any).setLink({ href: url })?.run();
          }} active={editor?.isActive('link')}>
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton onClick={() => {
            const url = window.prompt('Nhập URL hình ảnh');
            if (url) (editor?.chain()?.focus() as any).setImage({ src: url })?.run();
          }}>
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          
          <div className="flex-1" />
          
          <ToolbarButton onClick={() => (editor?.chain()?.focus() as any).undo()?.run()} disabled={!(editor?.can() as any).undo()}>
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => (editor?.chain()?.focus() as any).redo()?.run()} disabled={!(editor?.can() as any).redo()}>
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}

      <div className={cn(
        "prose prose-sm max-w-none p-4 min-h-[150px] outline-none",
        readOnly && "p-0 min-h-0"
      )}>
        <EditorContent editor={editor} />
      </div>

      {!readOnly && maxLength && (
        <div className="px-4 py-2 border-t bg-gray-50 text-[10px] text-gray-500 text-right">
          {editor?.getText()?.length || 0} / {maxLength} ký tự
        </div>
      )}
    </div>
  );
};

export const RichTextViewer: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  const sanitizedHtml = (DOMPurify as any).sanitize(html);
  
  return (
    <div 
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
