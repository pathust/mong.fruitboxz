/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const CarouselContext = createContext(null)

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function Carousel({ children, className = "", opts = {} }) {
  const viewportRef = useRef(null)
  const [viewport, setViewport] = useState(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const setViewportRef = useCallback((node) => {
    viewportRef.current = node
    setViewport(node)
  }, [])

  const updateScrollState = useCallback(() => {
    if (!viewport) return

    setCanScrollPrev(viewport.scrollLeft > 4)
    setCanScrollNext(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 4)
  }, [viewport])

  const scrollByPage = useCallback((direction) => {
    const viewport = viewportRef.current
    if (!viewport) return

    const distance = viewport.clientWidth * (opts.pageSize || 1)
    viewport.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: opts.behavior || "smooth",
    })
  }, [opts.behavior, opts.pageSize])

  useEffect(() => {
    if (!viewport) return undefined

    updateScrollState()
    viewport.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      viewport.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [viewport, updateScrollState])

  return (
    <CarouselContext.Provider value={{ setViewportRef, canScrollPrev, canScrollNext, scrollByPage }}>
      <div className={joinClassNames("relative", className)}>{children}</div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ children, className = "" }) {
  const context = useContext(CarouselContext)
  if (!context) throw new Error("CarouselContent must be used within Carousel")

  return (
    <div
      ref={context.setViewportRef}
      className="scrollbar-hide -mx-2 overflow-x-auto overscroll-x-contain scroll-smooth px-2"
    >
      <div className={joinClassNames("flex snap-x snap-mandatory gap-3", className)}>
        {children}
      </div>
    </div>
  )
}

export function CarouselItem({ children, className = "" }) {
  return (
    <div className={joinClassNames("min-w-0 shrink-0 grow-0 snap-start basis-1/2 md:basis-1/4 xl:basis-1/5", className)}>
      {children}
    </div>
  )
}

export function CarouselPrevious({ className = "", ...props }) {
  const context = useContext(CarouselContext)
  if (!context) throw new Error("CarouselPrevious must be used within Carousel")

  return (
    <button
      type="button"
      aria-label="Sản phẩm trước"
      disabled={!context.canScrollPrev}
      onClick={() => context.scrollByPage("prev")}
      className={joinClassNames(
        "absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#eadfcd] bg-white/90 text-[#4f4034] shadow-[0_14px_34px_-24px_rgba(60,42,25,0.45)] backdrop-blur transition hover:bg-white hover:text-primary disabled:pointer-events-none disabled:opacity-0",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

export function CarouselNext({ className = "", ...props }) {
  const context = useContext(CarouselContext)
  if (!context) throw new Error("CarouselNext must be used within Carousel")

  return (
    <button
      type="button"
      aria-label="Sản phẩm tiếp theo"
      disabled={!context.canScrollNext}
      onClick={() => context.scrollByPage("next")}
      className={joinClassNames(
        "absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#eadfcd] bg-white/90 text-[#4f4034] shadow-[0_14px_34px_-24px_rgba(60,42,25,0.45)] backdrop-blur transition hover:bg-white hover:text-primary disabled:pointer-events-none disabled:opacity-0",
        className
      )}
      {...props}
    >
      <ChevronRight className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
