import { useState } from "react"
import { AlertTriangle, ImageOff, LoaderCircle, RefreshCcw } from "lucide-react"

export function AdminLoading({ title = "Đang tải dữ liệu...", description = "Vui lòng chờ trong giây lát." }) {
  return (
    <div className="admin-card flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-base font-bold text-[#43382b]">{title}</p>
      <p className="product-meta mt-1 text-sm text-[#837464]">{description}</p>
    </div>
  )
}

export function AdminError({ title = "Không tải được dữ liệu", message, actionLabel = "Thử lại", onRetry }) {
  return (
    <div className="admin-card flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#c85b34]">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="mt-4 text-base font-bold text-[#43382b]">{title}</p>
      {message ? <p className="product-meta mt-2 max-w-xl text-sm text-[#837464]">{message}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="admin-button-secondary mt-5 px-4 py-2 text-sm">
          <RefreshCcw className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export function AdminEmpty({ title, message, children }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#eadfcd] bg-[#fffaf3] px-6 py-12 text-center">
      <p className="section-title text-[20px]">{title}</p>
      {message ? <p className="product-meta mx-auto mt-2 max-w-xl text-sm text-[#7f7160]">{message}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}

export function AdminImage({ src, alt, className = "", fallbackClassName = "" }) {
  const [failed, setFailed] = useState(false)

  return src && !failed ? (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`flex items-center justify-center bg-[#faf3e9] text-[#b49d83] ${fallbackClassName || className}`}>
      <ImageOff className="h-6 w-6" />
    </div>
  )
}
