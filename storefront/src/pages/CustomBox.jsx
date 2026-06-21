import { useEffect, useMemo, useState } from 'react'
import { Check, LoaderCircle, PackageOpen, Info, ArrowRight, Minus, Search, X } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { mapProduct, useCatalog } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
import { useSiteSettings } from '../hooks/useSiteSettings'

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(value || 0)

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Slugs/keywords identifying "gift box" categories
const BOX_KEYWORDS = ['hộp', 'quà', 'set', 'gift', 'box']
function isBoxCategory(name = '') {
  const n = name.toLowerCase()
  return BOX_KEYWORDS.some(k => n.includes(k))
}

export default function CustomBox() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem, setCartOpen } = useCart()
  const { settings, loading: settingsLoading, error: settingsError } = useSiteSettings()
  const { categories } = useCatalog()

  const [allProducts, setAllProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  // Custom box selection (multi)
  const [selected, setSelected] = useState([])
  // Pre-designed selection (single)
  const [selectedPredesigned, setSelectedPredesigned] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Parse box type configs from settings
  const boxTypes = useMemo(
    () => parseJson(settings?.custom_box_types_json, []),
    [settings?.custom_box_types_json]
  )
  const allowedSlugs = useMemo(
    () => (settings?.custom_box_product_slugs || settings?.custom_box_product_handles || '')
      .split(',').map(s => s.trim()).filter(Boolean),
    [settings?.custom_box_product_handles, settings?.custom_box_product_slugs]
  )

  // Redirect to first box if no slug
  useEffect(() => {
    if (boxTypes.length > 0 && !slug) {
      navigate(`/custom-box/${boxTypes[0].slug}`, { replace: true })
    }
  }, [slug, boxTypes, navigate])

  const activeBoxSlug = slug || ''
  const activeBox = useMemo(() => boxTypes.find(b => b.slug === activeBoxSlug), [boxTypes, activeBoxSlug])
  const isPreDesigned = activeBoxSlug === 'pre-designed'

  // Fetch ALL products with categories
  useEffect(() => {
    let mounted = true
    setProductsLoading(true)
    Promise.all([
      apiFetch('/store/products?limit=200&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices,+variants.inventory_quantity,*categories'),
      apiFetch('/store/ingredients').catch(() => ({ data: { ingredients: [], recipeItems: [] } }))
    ])
      .then(([productsData, ingredientsResponse]) => {
        if (!mounted) return
        
        // Handle both wrapped and unwrapped responses gracefully
        const ingredientsData = ingredientsResponse?.data || ingredientsResponse || {}
        
        const ingredientsList = ingredientsData.ingredients || []
        const recipeItems = ingredientsData.recipeItems || []

        const mapped = (productsData?.products || [])
          .map(mapProduct)
          .filter(p => p.price)
          .filter(p => !allowedSlugs.length || allowedSlugs.includes(p.slug))
          .map(p => {
            // Check tồn kho qua bảng ingredient và recipe_item
            const variantIds = (p.variants || []).map(v => v.id)
            const pRecipes = recipeItems.filter(r => variantIds.includes(r.variant_id))
            
            if (pRecipes.length > 0) {
              // Nếu sản phẩm có khai báo công thức (recipe_item), ta sẽ check tồn kho qua công thức đó
              let productHasStock = false
              let maxProductPurchasable = 0
              
              for (const v of p.variants || []) {
                const vRecipes = pRecipes.filter(r => r.variant_id === v.id)
                if (vRecipes.length === 0) {
                  v.purchasable_quantity = v.inventory_quantity ?? Infinity
                  if (v.purchasable_quantity > 0) {
                    productHasStock = true
                    maxProductPurchasable = Math.max(maxProductPurchasable, v.purchasable_quantity)
                  }
                  continue
                }
                
                let variantInStock = true
                let minCountX = Infinity
                for (const r of vRecipes) {
                  const stock = Number(r.ingredient?.stock_quantity || 0)
                  const req = Number(r.quantity)
                  if (stock < req) {
                    variantInStock = false
                  }
                  if (req > 0) {
                    const countX = Math.floor(stock / req)
                    if (countX < minCountX) minCountX = countX
                  }
                }
                
                if (variantInStock) {
                  productHasStock = true
                }
                const actualCount = minCountX === Infinity ? 0 : minCountX
                v.purchasable_quantity = Math.min(actualCount, Math.max(5, Math.floor(actualCount * 0.8)))
                maxProductPurchasable = Math.max(maxProductPurchasable, v.purchasable_quantity)
              }
              p.inStock = productHasStock
              p.purchasable_quantity = maxProductPurchasable
            } else {
              // Fallback: Tìm ingredient trùng tên với title
              const ing = ingredientsList.find(i => i.name === p.title)
              if (ing) {
                p.inStock = Number(ing.stock_quantity) > 0
              }
            }
            return p
          })
        setAllProducts(mapped)
      })
      .catch((err) => {
        if (mounted) setProductsError(err?.message || 'Không tải được sản phẩm từ backend.')
      })
      .finally(() => {
        if (mounted) setProductsLoading(false)
      })
    return () => { mounted = false }
  }, [allowedSlugs])

  // Split products by category type
  const boxProducts = useMemo(() =>
    allProducts.filter(p => (p.categoryNames || []).some(n => isBoxCategory(n))),
    [allProducts]
  )
  const ingredientProducts = useMemo(() =>
    allProducts.filter(p => !(p.categoryNames || []).some(n => isBoxCategory(n))),
    [allProducts]
  )

  // Source products depending on mode
  const sourceProducts = isPreDesigned ? boxProducts : ingredientProducts

  // Unique categories for current mode
  const modeCategories = useMemo(() => {
    const seen = new Set()
    const cats = []
    sourceProducts.forEach(p => {
      (p.categoryNames || []).forEach((name, i) => {
        const s = (p.categorySlugs || [])[i] || name
        if (name && !seen.has(s)) { seen.add(s); cats.push({ slug: s, name }) }
      })
    })
    return cats
  }, [sourceProducts])

  // Reset filter when mode changes
  useEffect(() => {
    setCategoryFilter('all')
    setSearchQuery('')
  }, [activeBoxSlug])

  // Filtered products
  const filteredProducts = useMemo(() =>
    sourceProducts.filter(p => {
      const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = categoryFilter === 'all' || (p.categorySlugs || []).includes(categoryFilter)
      return matchSearch && matchCat
    }),
    [sourceProducts, searchQuery, categoryFilter]
  )

  // Auto-trim multi-selection if switching box type
  useEffect(() => {
    if (activeBox && selected.length > Number(activeBox.max_items)) {
      setSelected(cur => cur.slice(0, Number(activeBox.max_items)))
    }
  }, [activeBox, selected.length])

  // Calculations
  const fruitsTotal = selected.reduce((sum, id) => {
    const p = ingredientProducts.find(x => x.medusa_id === id)
    return sum + Number(p?.price || 0)
  }, 0)
  const total = Number(activeBox?.base_price || 0) + fruitsTotal

  // Handlers
  const handleBoxSelect = (boxSlug) => {
    setSelected([])
    setSelectedPredesigned(null)
    navigate(`/custom-box/${boxSlug}`)
  }

  const toggleIngredient = (id) => {
    if (!activeBox) return
    setSelected(cur =>
      cur.includes(id)
        ? cur.filter(x => x !== id)
        : cur.length < Number(activeBox.max_items) ? [...cur, id] : cur
    )
  }

  const selectPredesigned = (id) => {
    setSelectedPredesigned(prev => prev === id ? null : id)
  }

  const handleAddToCart = () => {
    if (isPreDesigned) {
      if (!selectedPredesigned) return
      const p = boxProducts.find(x => x.medusa_id === selectedPredesigned)
      if (!p) return
      addItem({
        id: `predesigned-${selectedPredesigned}-${Date.now()}`,
        title: p.title,
        price: p.price,
        image: p.thumbnail || '',
        quantity: 1,
        slug: p.slug,
        variantId: p.variants?.[0]?.id || null,
        productId: p.medusa_id || null,
        maxAllowed: p.purchasable_quantity ?? Infinity,
      })
    } else {
      if (!activeBox || selected.length === 0) return
      const firstProduct = ingredientProducts.find(x => x.medusa_id === selected[0])
      addItem({
        id: `custom-${activeBoxSlug}-${Date.now()}`,
        title: `${activeBox.name} (Tự chọn ${selected.length} loại)`,
        price: total,
        image: firstProduct?.thumbnail || '',
        quantity: 1,
        metadata: { custom_box_slug: activeBoxSlug, selected_product_ids: selected },
      })
    }
    setCartOpen(true)
  }

  // Render guards
  if (settingsLoading) {
    return <div className="min-h-[500px] flex flex-col items-center justify-center text-primary"><LoaderCircle className="h-10 w-10 animate-spin mb-4" /> <p>Đang tải cấu hình...</p></div>
  }
  if (settingsError || productsError) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-600 bg-red-50 rounded-2xl mt-8">{settingsError || productsError}</div>
  }
  if (boxTypes.length === 0) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500 bg-gray-50 rounded-2xl mt-8">Cửa hàng chưa cấu hình các loại hộp tự chọn.</div>
  }

  const canAddToCart = isPreDesigned ? !!selectedPredesigned : selected.length > 0

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10 pb-32 lg:pb-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="page-title text-3xl md:text-5xl mb-4 text-secondary">Thiết kế hộp quà</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
          Tự tay chọn kích cỡ hộp và mix các sản phẩm yêu thích để tạo nên một món quà hoàn hảo nhất.
        </p>
      </div>

      <div>


        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Main Builder Area */}
          <div className="flex-1 w-full space-y-6">

            {/* STEP 1: CHOOSE BOX TYPE */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eadfcd]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold text-secondary">Chọn loại hộp</h2>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {boxTypes.map((b) => {
                  const isActive = activeBoxSlug === b.slug
                  return (
                    <button key={b.slug} onClick={() => handleBoxSelect(b.slug)}
                      className={`relative text-left p-5 rounded-2xl transition-all duration-300 border-2 ${
                        isActive
                          ? 'border-primary bg-[#fffbf5] shadow-[0_4px_20px_-10px_rgba(199,100,58,0.5)] scale-[1.02]'
                          : 'border-[#eadfcd] bg-white hover:border-primary/40 hover:bg-[#fffdfa]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold text-lg ${isActive ? 'text-primary' : 'text-secondary'}`}>{b.name}</h3>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {isActive && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                        </div>
                      </div>
                      <p className="text-sm text-[#8a7a67] mb-4 min-h-[40px] line-clamp-2">{b.description || `Hộp mix tối đa ${b.max_items} loại`}</p>
                      <div className="flex items-center justify-between border-t border-[#eadfcd]/60 pt-3">
                        <span className="text-xs font-bold text-[#a08d79]">Tối đa: {b.max_items} món</span>
                        <span className="font-bold text-secondary">{formatPrice(b.base_price)}</span>
                      </div>
                    </button>
                  )
                })}

                {/* Pre-designed option */}
                <button onClick={() => handleBoxSelect('pre-designed')}
                  className={`relative text-left p-5 rounded-2xl transition-all duration-300 border-2 ${
                    isPreDesigned
                      ? 'border-primary bg-[#fffbf5] shadow-[0_4px_20px_-10px_rgba(199,100,58,0.5)] scale-[1.02]'
                      : 'border-[#eadfcd] bg-white hover:border-primary/40 hover:bg-[#fffdfa]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-lg ${isPreDesigned ? 'text-primary' : 'text-secondary'}`}>Hộp quà thiết kế sẵn</h3>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isPreDesigned ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                      {isPreDesigned && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                    </div>
                  </div>
                  <p className="text-sm text-[#8a7a67] mb-4 min-h-[40px] line-clamp-2">Khám phá các mẫu hộp quà được thiết kế sẵn cực đẹp từ cửa hàng.</p>
                  <div className="flex items-center justify-between border-t border-[#eadfcd]/60 pt-3">
                    <span className="text-xs font-bold text-[#a08d79]">Đóng gói sẵn</span>
                    <span className="font-bold text-secondary">Nhiều mức giá</span>
                  </div>
                </button>
              </div>
            </section>

            {/* STEP 2: PICK PRODUCTS */}
            {/* Sticky search + filter bar — lives OUTSIDE section so no overflow ancestor can trap it */}
            <div className="sticky top-[76px] z-30 bg-white/95 backdrop-blur-sm border border-[#eadfcd] rounded-2xl px-5 py-3 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <h2 className="text-lg font-bold text-secondary">
                    {isPreDesigned ? 'Chọn hộp quà' : 'Chọn các món'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isPreDesigned && (
                    <div className="hidden sm:block text-xs font-bold px-3 py-1.5 bg-[#fffaf4] rounded-full text-primary border border-[#eadfcd]">
                      {selected.length} / {activeBox?.max_items || 0} món
                    </div>
                  )}
                  {isPreDesigned && selectedPredesigned && (
                    <div className="hidden sm:block text-xs font-bold px-3 py-1.5 bg-primary/10 rounded-full text-primary border border-primary/20">
                      Đã chọn 1 hộp
                    </div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a08d79]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isPreDesigned ? 'Tìm kiếm hộp quà...' : 'Tìm kiếm sản phẩm...'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#eadfcd] bg-[#fffaf4] text-sm text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category chips */}
              {modeCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-[#7a644f] border-[#eadfcd] hover:border-primary/50'
                    }`}
                  >
                    Tất cả
                  </button>
                  {modeCategories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => setCategoryFilter(cat.slug)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        categoryFilter === cat.slug
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-[#7a644f] border-[#eadfcd] hover:border-primary/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-[#eadfcd]">
              <div className="p-6 sm:p-8">
                {productsLoading ? (
                  <div className="py-20 flex justify-center"><LoaderCircle className="w-8 h-8 text-primary animate-spin" /></div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500 text-sm">
                      {searchQuery || categoryFilter !== 'all' ? 'Không tìm thấy sản phẩm phù hợp.' : 'Không có sản phẩm nào phù hợp.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.inStock === false
                      const isSelected = isPreDesigned
                        ? selectedPredesigned === product.medusa_id
                        : selected.includes(product.medusa_id)
                      const isMaxedOut = !isPreDesigned && !isSelected && selected.length >= Number(activeBox?.max_items || 0)
                      const isDisabled = isOutOfStock || isMaxedOut

                      return (
                        <button
                          key={product.medusa_id}
                          onClick={() => {
                            if (isDisabled) return
                            isPreDesigned ? selectPredesigned(product.medusa_id) : toggleIngredient(product.medusa_id)
                          }}
                          disabled={isDisabled}
                          className={`group relative text-left p-3 rounded-2xl border transition-all duration-300 ${
                            isOutOfStock
                              ? 'border-[#e8e2d9] bg-gray-50 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-primary bg-[#fffbf5] ring-2 ring-primary/20'
                                : isMaxedOut
                                  ? 'border-[#f0ece5] bg-gray-50 opacity-60 cursor-not-allowed'
                                  : 'border-[#eadfcd] bg-white hover:border-primary/40 hover:shadow-md'
                          }`}
                        >
                          <div className="aspect-square rounded-xl bg-[#f7eee2] mb-3 overflow-hidden relative">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300"><PackageOpen className="w-8 h-8" /></div>
                            )}
                            {/* Out-of-stock overlay */}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-white/60 flex items-end justify-center pb-2">
                                <span className="text-[11px] font-bold bg-gray-700/80 text-white px-2.5 py-1 rounded-full">
                                  Hết hàng
                                </span>
                              </div>
                            )}
                            {/* Selected overlay */}
                            {isSelected && !isOutOfStock && (
                              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="px-1">
                            <h4 className={`font-bold text-[15px] leading-snug mb-1 line-clamp-2 min-h-[44px] ${
                              isOutOfStock ? 'text-gray-400' : 'text-secondary'
                            }`}>{product.title}</h4>
                            <p className={`font-bold text-sm ${
                              isOutOfStock ? 'text-gray-400 line-through' : 'text-primary'
                            }`}>{formatPrice(product.price)}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sticky Summary Sidebar */}
          <div className="w-full lg:w-[360px] lg:shrink-0 sticky bottom-0 lg:top-[100px] z-40 lg:z-10">
            <div className="bg-white lg:rounded-3xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] lg:shadow-xl border-t lg:border border-[#eadfcd] p-5 sm:p-6 lg:p-8 -mx-4 sm:mx-0">
              <h3 className="hidden lg:block font-bold text-2xl text-secondary mb-6 pb-4 border-b border-[#eadfcd]">Giỏ quà của bạn</h3>

              <div className="hidden lg:block space-y-4 mb-6">
                {isPreDesigned ? (
                  selectedPredesigned ? (() => {
                    const p = boxProducts.find(x => x.medusa_id === selectedPredesigned)
                    return p ? (
                      <div className="flex gap-3 items-center p-3 rounded-2xl bg-[#fffaf4] border border-[#eadfcd]">
                        {p.thumbnail && <img src={p.thumbnail} alt={p.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-bold text-secondary text-sm line-clamp-2">{p.title}</p>
                          <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(p.price)}</p>
                        </div>
                      </div>
                    ) : null
                  })() : (
                    <div className="py-6 text-center">
                      <PackageOpen className="w-12 h-12 text-[#eadfcd] mx-auto mb-3" />
                      <p className="text-sm font-medium text-[#8a7a67]">Hãy chọn một hộp quà bên trái.</p>
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-bold text-secondary">{activeBox?.name || 'Chưa chọn hộp'}</p>
                        <p className="text-sm text-[#8a7a67]">Hộp nền</p>
                      </div>
                      <span className="font-bold text-secondary shrink-0">{formatPrice(activeBox?.base_price)}</span>
                    </div>

                    {selected.length > 0 ? (
                      <div className="pt-4 border-t border-dashed border-[#eadfcd]">
                        <p className="text-sm font-bold text-[#8a7a67] mb-3">Các món đã chọn ({selected.length}/{activeBox?.max_items}):</p>
                        <ul className="space-y-2">
                          {selected.map((id) => {
                            const p = ingredientProducts.find(x => x.medusa_id === id)
                            if (!p) return null
                            return (
                              <li key={id} className="flex justify-between text-sm items-center gap-2">
                                <span className="text-secondary line-clamp-1 flex-1">• {p.title}</span>
                                <button onClick={() => toggleIngredient(id)} className="text-gray-400 hover:text-red-500 shrink-0">
                                  <Minus className="w-3 h-3" />
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-dashed border-[#eadfcd] text-sm text-[#a08d79] flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" /> Hãy chọn các món để lấp đầy hộp quà nhé!
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="pt-2 lg:pt-4 lg:border-t lg:border-[#eadfcd]">
                {!isPreDesigned && (
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-sm font-bold text-[#8a7a67] lg:hidden mb-1">
                        {activeBox?.name} ({selected.length}/{activeBox?.max_items} món)
                      </p>
                      <p className="font-bold text-lg lg:text-xl text-secondary">Tổng cộng</p>
                    </div>
                    <span className="block text-2xl lg:text-3xl font-extrabold text-primary">{formatPrice(total)}</span>
                  </div>
                )}
                {isPreDesigned && selectedPredesigned && (() => {
                  const p = boxProducts.find(x => x.medusa_id === selectedPredesigned)
                  return p ? (
                    <div className="flex justify-between items-end mb-4">
                      <p className="font-bold text-lg text-secondary">Tổng cộng</p>
                      <span className="text-2xl font-extrabold text-primary">{formatPrice(p.price)}</span>
                    </div>
                  ) : null
                })()}

                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 lg:py-4 px-6 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  {isPreDesigned ? 'Thêm hộp vào giỏ' : 'Thêm vào giỏ'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
