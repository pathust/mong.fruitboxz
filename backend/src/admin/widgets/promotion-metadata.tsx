import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

type PromotionMetadata = {
  min_order_value?: number | null
  max_discount?: number | null
  [key: string]: unknown
}

type Promotion = {
  id: string
  metadata?: Record<string, unknown> | null
}

type ApiEnvelope<T> = {
  data: T
  error: null
  meta: Record<string, unknown> | null
}

const PromotionMetadataWidget = ({ data }: { data: Promotion }) => {
  const [minOrderValue, setMinOrderValue] = useState("")
  const [maxDiscount, setMaxDiscount] = useState("")
  const metadataQuery = useQuery({
    queryKey: ["promotion-metadata", data.id],
    queryFn: () => sdk.client.fetch<ApiEnvelope<{ metadata: PromotionMetadata }>>(
      `/admin/promotions/${data.id}/metadata`
    ),
  })

  useEffect(() => {
    const metadata = metadataQuery.data?.data.metadata
    if (!metadata) return
    setMinOrderValue(metadata.min_order_value ? String(metadata.min_order_value) : "")
    setMaxDiscount(metadata.max_discount ? String(metadata.max_discount) : "")
  }, [metadataQuery.data])

  const saveMutation = useMutation({
    mutationFn: (metadata: PromotionMetadata) => sdk.client.fetch(
      `/admin/promotions/${data.id}/metadata`,
      { method: "POST", body: { metadata } }
    ),
    onSuccess: () => toast.success("Lưu thành công", {
      description: "Đã cập nhật cấu hình nâng cao cho mã giảm giá.",
    }),
    onError: () => toast.error("Lỗi", {
      description: "Không thể lưu thay đổi, vui lòng thử lại.",
    }),
  })

  const handleSave = () => {
    saveMutation.mutate({
      ...(data.metadata || {}),
      min_order_value: minOrderValue ? Number(minOrderValue) : null,
      max_discount: maxDiscount ? Number(maxDiscount) : null,
    })
  }

  return (
    <Container className="p-6">
      <Heading level="h2" className="mb-4 text-xl">Cấu hình nâng cao</Heading>
      <Text className="text-ui-fg-subtle mb-6">Thiết lập đơn hàng tối thiểu và giới hạn số tiền giảm cho khuyến mãi này.</Text>

      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="min_order_value" className="text-ui-fg-base font-medium">Đơn hàng tối thiểu (VNĐ)</Label>
          <Input
            id="min_order_value"
            type="number"
            min="0"
            value={minOrderValue}
            onChange={(event) => setMinOrderValue(event.target.value)}
          />
          <Text className="text-ui-fg-subtle text-xs">Mã chỉ áp dụng khi tổng giá trị đơn hàng đạt mức này.</Text>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="max_discount" className="text-ui-fg-base font-medium">Số tiền giảm tối đa (VNĐ)</Label>
          <Input
            id="max_discount"
            type="number"
            min="0"
            value={maxDiscount}
            onChange={(event) => setMaxDiscount(event.target.value)}
          />
          <Text className="text-ui-fg-subtle text-xs">Áp dụng cho mã giảm theo phần trăm.</Text>
        </div>

        {metadataQuery.isError && (
          <Text className="text-ui-fg-error text-sm">Không tải được cấu hình hiện tại.</Text>
        )}

        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            onClick={handleSave}
            isLoading={metadataQuery.isLoading || saveMutation.isPending}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "promotion.details.after" })

export default PromotionMetadataWidget
