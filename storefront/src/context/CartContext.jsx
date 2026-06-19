/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { apiFetch } from '../lib/api'

const CartContext = createContext()

const CART_KEY = 'mong_fruitbox_cart'
const CART_SESSION_KEY = 'mong_fruitbox_cart_session'

function getCartSessionId() {
  const existing = localStorage.getItem(CART_SESSION_KEY)
  if (existing) return existing
  const id = globalThis.crypto?.randomUUID?.() || `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`
  localStorage.setItem(CART_SESSION_KEY, id)
  return id
}

function isExternalImage(url) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.origin !== window.location.origin
  } catch {
    return false
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? JSON.parse(saved) : { items: [], count: 0 }
  } catch {
    return { items: [], count: 0 }
  }
}

function cartReducer(state, action) {
  let newState
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id)
      if (existing) {
        newState = {
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + (action.payload.quantity || 1) }
              : i
          ),
          count: state.count + (action.payload.quantity || 1),
        }
      } else {
        newState = {
          items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
          count: state.count + (action.payload.quantity || 1),
        }
      }
      break
    }
    case 'REMOVE_ITEM':
      newState = {
        items: state.items.filter(i => i.id !== action.payload),
        count: state.count - (state.items.find(i => i.id === action.payload)?.quantity || 0),
      }
      break
    case 'UPDATE_QUANTITY': {
      const diff = action.payload.quantity - (state.items.find(i => i.id === action.payload.id)?.quantity || 0)
      newState = {
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
        ),
        count: Math.max(0, state.count + diff),
      }
      break
    }
    case 'PATCH_IMAGE':
      // Patch a single item's image without touching count; persist immediately
      newState = {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, image: action.payload.image } : i
        ),
      }
      localStorage.setItem(CART_KEY, JSON.stringify(newState))
      return newState
    case 'CLEAR_CART':
      newState = { items: [], count: 0 }
      break
    case 'REPLACE_CART':
      newState = action.payload
      break
    default:
      return state
  }
  localStorage.setItem(CART_KEY, JSON.stringify(newState))
  return newState
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, null, loadCart)
  const [toast, setToast] = useState(null)
  const [sessionId] = useState(getCartSessionId)
  const remoteReady = useRef(false)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    let mounted = true
    async function hydrateRemoteCart() {
      try {
        const data = await apiFetch(`/store/session-cart/${encodeURIComponent(sessionId)}`)
        const remoteCart = data?.cart
        if (mounted && remoteCart?.items?.length) {
          dispatch({ type: 'REPLACE_CART', payload: remoteCart })
        } else if (mounted) {
          await apiFetch(`/store/session-cart/${encodeURIComponent(sessionId)}`, {
            method: 'POST',
            body: cart,
          })
        }
      } catch {
        // Local cart remains authoritative while Redis is unavailable.
      } finally {
        if (mounted) remoteReady.current = true
      }
    }
    hydrateRemoteCart()
    return () => { mounted = false }
  // Hydrate once; later updates are handled by the debounced sync below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    if (!remoteReady.current) return undefined
    const timer = window.setTimeout(() => {
      apiFetch(`/store/session-cart/${encodeURIComponent(sessionId)}`, {
        method: 'POST',
        body: cart,
      }).catch(() => undefined)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [cart, sessionId])

  // On mount: for any cart item that still has an old external image URL,
  // fetch the correct thumbnail from the local Medusa store API and patch it.
  useEffect(() => {
    const brokenItems = cart.items.filter(i => isExternalImage(i.image))
    if (brokenItems.length === 0) return

    brokenItems.forEach(async (item) => {
      try {
        const slug = item.slug || item.id
        const data = await apiFetch(
          `/store/products?handle=${encodeURIComponent(slug)}&fields=thumbnail,*images`,
          { timeoutMs: 8000 }
        )
        const product = data?.products?.[0]
        const freshImage = product?.thumbnail || product?.images?.[0]?.url || null
        if (freshImage) {
          dispatch({ type: 'PATCH_IMAGE', payload: { id: item.id, image: freshImage } })
        }
      } catch {
        // Silently ignore – onError fallback in the UI handles the display
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  const addItem = useCallback((item) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
    setToast(`Đã thêm "${item.title}" vào giỏ hàng`)
    setTimeout(() => setToast(null), 3000)
  }, [])
  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', payload: id }), [])
  const updateQuantity = useCallback((id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[#ef6840] text-white px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {toast}
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
