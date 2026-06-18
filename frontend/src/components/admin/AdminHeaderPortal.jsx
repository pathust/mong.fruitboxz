import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function AdminHeaderPortal({ children }) {
  const [node, setNode] = useState(null)
  
  useEffect(() => {
    setNode(document.getElementById('admin-header-portal'))
  }, [])
  
  if (!node) return null
  return createPortal(children, node)
}
