import { useMemo, useState, useEffect } from "react";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { Link } from "react-router-dom";

import { ShoppingCart, Eye } from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters";
import { getOrderCode } from "../../../lib/orderCodes";
import { AdminLoading } from "../../../components/admin/AdminStates"


function getCustomerName(order) {
  const address = order.shipping_address || {};
  return [address.last_name, address.first_name].filter(Boolean).join(" ").trim();
}

function getCustomerAddress(order) {
  const address = order.shipping_address || {};
  return [address.address_1, address.province, address.city].filter(Boolean).join(", ");
}

export default function OrdersList() {
  const { api } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all");

  useEffect(() => {
    api("/admin/orders?limit=50&fields=id,email,status,total,created_at,metadata,customer_id,*shipping_address").
    then((d) => setOrders(d.orders || [])).
    catch(() => setOrders([])).
    finally(() => setLoading(false));
  }, [api]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const payment = order.metadata?.payment_status || "not_paid";
      const fulfillment = order.metadata?.fulfillment_status || "not_fulfilled";
      return (
        filterBySearch(order, query, [
        "email",
        "status",
        (item) => getOrderCode(item),
        (item) => getCustomerName(item),
        (item) => item.shipping_address?.phone,
        (item) => getCustomerAddress(item)]
        ) && (
        status === "all" || order.status === status) && (
        paymentStatus === "all" || payment === paymentStatus) && (
        fulfillmentStatus === "all" || fulfillment === fulfillmentStatus));

    });
  }, [orders, query, status, paymentStatus, fulfillmentStatus]);


  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Đơn hàng
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Theo dõi đơn hàng, trạng thái và thông tin khách hàng.</p>
          </div>
        </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters disableSticky={true}
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm mã đơn, khách hàng..."
            showing={filteredOrders.length}
            total={orders.length}
            onReset={() => {
              setQuery("");
              setStatus("all");
              setPaymentStatus("all");
              setFulfillmentStatus("all");
            }}
            filters={[
            {
              label: "Trạng thái đơn",
              value: status,
              onChange: setStatus,
              options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
              { value: "canceled", label: "Canceled" },
              { value: "requires_action", label: "Requires action" }]

            },
            {
              label: "Thanh toán",
              value: paymentStatus,
              onChange: setPaymentStatus,
              options: [
              { value: "all", label: "Tất cả thanh toán" },
              { value: "not_paid", label: "Chưa TT" },
              { value: "partially_paid", label: "TT 1 phần" },
              { value: "paid", label: "Đã TT" },
              { value: "refunded", label: "Hoàn tiền" }]

            },
            {
              label: "Giao hàng",
              value: fulfillmentStatus,
              onChange: setFulfillmentStatus,
              options: [
              { value: "all", label: "Tất cả giao hàng" },
              { value: "not_fulfilled", label: "Chưa giao" },
              { value: "processing", label: "Chuẩn bị" },
              { value: "shipped", label: "Đang giao" },
              { value: "delivered", label: "Đã giao" },
              { value: "returned", label: "Hoàn trả" }]

            }]
            } />
        </div>
      

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
            <tr>
              <th className="px-5 py-4">STT</th>
              <th className="px-5 py-4">Mã đơn hàng</th>
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Thanh toán</th>
              <th className="px-5 py-4">Giao hàng</th>
              <th className="px-5 py-4 text-right">Tổng tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eadfcd]/50">
            {filteredOrders.map((o, index) => {
              const customerName = getCustomerName(o);
              const customerAddress = getCustomerAddress(o);
              return (
                <tr key={o.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                <td className="px-5 py-4 font-semibold text-[#8d7f6f]">{index + 1}</td>
                <td className="px-5 py-4">
                  <Link to={`/admin/orders/${o.id}`} className="font-bold text-secondary hover:text-primary">
                    {getOrderCode(o)}
                  </Link>
                  <p className="mt-1 text-xs text-[#8d7f6f]">{new Date(o.created_at).toLocaleDateString("vi-VN")}</p>
                </td>
                <td className="px-5 py-4">
                  {o.customer_id ? (
                    <Link to={`/admin/customers/${o.customer_id}`} className="font-bold text-secondary hover:text-primary text-[15px] hover:underline">
                      {customerName || "Khách lẻ"}
                    </Link>
                  ) : (
                    <p className="font-bold text-secondary text-[15px]">{customerName || "Khách lẻ"}</p>
                  )}
                  <div className="mt-1 space-y-0.5 text-xs text-[#8d7f6f]">
                    {o.shipping_address?.phone && <p>{o.shipping_address.phone}</p>}
                    {customerAddress && <p className="line-clamp-2 max-w-[280px]">{customerAddress}</p>}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${o.status === "completed" ? "bg-[#e8f6e9] text-[#2f7a37] border-green-200" : o.status === "pending" ? "bg-[#fff4d8] text-[#9a6a16] border-yellow-200" : "bg-[#f1eadf] text-[#766957] border-[#eadfcd]"}`}>{o.status}</span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {(() => {
                      const ps = o.metadata?.payment_status || 'not_paid';
                      const labels = { not_paid: 'Chưa TT', partially_paid: 'TT 1 phần', paid: 'Đã TT', refunded: 'Hoàn tiền' };
                      const colors = { not_paid: 'bg-[#fff4d8] text-[#9a6a16] border-yellow-200', paid: 'bg-[#e8f6e9] text-[#2f7a37] border-green-200', partially_paid: 'bg-[#e8f0fe] text-[#1a56db] border-blue-200', refunded: 'bg-[#fde8e8] text-[#c81e1e] border-red-200' };
                      return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[ps] || 'bg-[#f1eadf] text-[#766957] border-[#eadfcd]'}`}>{labels[ps] || ps}</span>;
                    })()}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {(() => {
                      const fs = o.metadata?.fulfillment_status || 'not_fulfilled';
                      const labels = { not_fulfilled: 'Chưa giao', processing: 'Chuẩn bị', shipped: 'Đang giao', delivered: 'Đã giao', returned: 'Hoàn trả' };
                      const colors = { not_fulfilled: 'bg-[#fff4d8] text-[#9a6a16] border-yellow-200', delivered: 'bg-[#e8f6e9] text-[#2f7a37] border-green-200', shipped: 'bg-[#e8f0fe] text-[#1a56db] border-blue-200', processing: 'bg-[#f1eadf] text-[#766957] border-[#eadfcd]', returned: 'bg-[#fde8e8] text-[#c81e1e] border-red-200' };
                      return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[fs] || 'bg-[#f1eadf] text-[#766957] border-[#eadfcd]'}`}>{labels[fs] || fs}</span>;
                    })()}
                </td>
                <td className="px-5 py-4 text-right font-bold text-secondary">{o.total ? `${o.total.toLocaleString()} ₫` : "—"}</td>
              </tr>);

            })}
            {filteredOrders.length === 0 ? (
            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#8d7f6f]">Chưa có đơn hàng nào</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </div>
    </div>);

}