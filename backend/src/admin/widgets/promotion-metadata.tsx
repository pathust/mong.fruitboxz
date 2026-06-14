import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Button, Label, toast } from "@medusajs/ui"
import { useState } from "react"

const PromotionMetadataWidget = ({ data }: any) => {
  const [minOrderValue, setMinOrderValue] = useState(data?.metadata?.min_order_value || "")
  const [maxDiscount, setMaxDiscount] = useState(data?.metadata?.max_discount || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // In Medusa v2 admin, widgets can call /admin/promotions/:id directly.
      // The session cookie handles auth.
      const res = await fetch(`/admin/promotions/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            min_order_value: minOrderValue ? Number(minOrderValue) : null,
            max_discount: maxDiscount ? Number(maxDiscount) : null
          }
        })
      })

      if (!res.ok) {
        throw new Error("Failed to update metadata")
      }

      toast.success("Lưu thành công", {
        description: "Đã cập nhật cấu hình nâng cao cho mã giảm giá."
      })
    } catch (error) {
      console.error(error)
      toast.error("Lỗi", {
        description: "Không thể lưu thay đổi, vui lòng thử lại."
      })
    } finally {
      setIsLoading(false)
    }
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
            placeholder="Ví dụ: 200000"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
          />
          <Text className="text-ui-fg-subtle text-xs">Mã chỉ áp dụng khi tổng giá trị đơn hàng đạt mức này.</Text>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="max_discount" className="text-ui-fg-base font-medium">Số tiền giảm tối đa (VNĐ)</Label>
          <Input
            id="max_discount"
            type="number"
            placeholder="Ví dụ: 50000"
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
          />
          <Text className="text-ui-fg-subtle text-xs">Chỉ áp dụng nếu đây là mã giảm theo Phần trăm (%). Số tiền giảm sẽ không vượt quá giới hạn này.</Text>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={handleSave} isLoading={isLoading}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "promotion.details.after",
})

export default PromotionMetadataWidget
