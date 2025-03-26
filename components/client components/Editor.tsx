"use client"

import { useEffect, useRef, useState } from "react"

interface EditorProps {
  value: string
  onChange: (value: string) => void
}

export function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [initialRender, setInitialRender] = useState(true)

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && initialRender) {
      editorRef.current.innerHTML = value
      setInitialRender(false)
    }
  }, [value, initialRender])

  // Handle manual content updates without resetting cursor position
  useEffect(() => {
    if (!initialRender && editorRef.current && editorRef.current.innerHTML !== value) {
      // Save selection position
      const selection = window.getSelection()
      let range = null
      let selectionSaved = false

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
        selectionSaved = true
      }

      // Update content
      editorRef.current.innerHTML = value

      // Restore selection if possible
      if (selectionSaved && range && editorRef.current.contains(range.startContainer)) {
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }, [value, initialRender])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      className="p-4 h-full outline-none prose prose-sm max-w-none"
      onInput={handleInput}
      onBlur={handleInput}
      onKeyUp={handleInput}
    />
  )
}

