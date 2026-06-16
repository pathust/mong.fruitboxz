import { useEffect, useRef } from "react"
import { Bold, Heading2, Italic, List, ListOrdered, Pilcrow, Quote, Redo2, Undo2 } from "lucide-react"

const toolbarActions = [
  { command: "formatBlock", value: "p", label: "Đoạn", icon: Pilcrow },
  { command: "formatBlock", value: "h2", label: "Tiêu đề", icon: Heading2 },
  { command: "bold", label: "Đậm", icon: Bold },
  { command: "italic", label: "Nghiêng", icon: Italic },
  { command: "insertUnorderedList", label: "Danh sách", icon: List },
  { command: "insertOrderedList", label: "Đánh số", icon: ListOrdered },
  { command: "formatBlock", value: "blockquote", label: "Trích dẫn", icon: Quote },
  { command: "undo", label: "Hoàn tác", icon: Undo2 },
  { command: "redo", label: "Làm lại", icon: Redo2 },
]

export default function RichTextEditor({ value = "", onChange, minHeight = 260 }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const emitChange = () => {
    onChange?.(editorRef.current?.innerHTML || "")
  }

  const runCommand = (action) => {
    editorRef.current?.focus()
    document.execCommand(action.command, false, action.value)
    emitChange()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8dccb] bg-[#fffaf4] focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(234,90,42,0.12)]">
      <div className="flex flex-wrap gap-1 border-b border-[#eadfcd] bg-[#fff7ed] px-3 py-2">
        {toolbarActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={`${action.command}-${action.value || ""}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(action)}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-[#655747] transition hover:bg-white hover:text-primary"
              title={action.label}
              aria-label={action.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        className="admin-rich-editor px-4 py-3 text-sm leading-7 text-[#443a31] outline-none"
        style={{ minHeight }}
      />
    </div>
  )
}
