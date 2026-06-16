/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect, useState } from 'react'

const CartContext = createContext()

const CART_KEY = 'mong_fruitbox_cart'

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY)
    if (!saved) return { items: [], count: 0 }
    const parsed = JSON.parse(saved)

    // Migration: strip items that have old external image URLs (pre-media-migration)
    const cleanItems = (parsed.items || []).map(item => {
      if (item.image && item.image.startsWith('http') && !item.image.startsWith(window.location.origin)) {
        return { ...item, image: null }
      }
      return item
    })
    const totalCount = cleanItems.reduce((sum, i) => sum + (i.quantity || 1), 0)
    return { items: cleanItems, count: totalCount }
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
    case 'CLEAR_CART':
      newState = { items: [], count: 0 }
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

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
    setToast(`Đã thêm "${item.title}" vào giỏ hàng`)
    setTimeout(() => setToast(null), 3000)
  }
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id })
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

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
