import { useEffect, useState } from 'react';
import { Bot, Save, AlertCircle, CheckCircle2, History, Trash2, Power, PowerOff, Sparkles, SlidersHorizontal, Info, KeySquare, MessageSquareWarning, CirclePlus, LoaderCircle, CopyPlus } from "lucide-react";
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal";
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminStates';

function createFaq() {
  return {
    question: '',
    answer: '',
    keywords: []
  };
}

export default function ChatbotConsole() {
  const { api } = useAdminAuth();
  const { pushToast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [faqs, setFaqs] = useState([createFaq()]);
  const [unanswered, setUnanswered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
    api('/admin/chatbot/faqs').catch((err) => ({ __error: err })),
    api('/admin/chatbot/unanswered').catch(() => null)]
    ).
    then(([faqData, unansweredData]) => {
      if (faqData?.__error) {
        setError(faqData.__error?.message || 'Không tải được cấu hình chatbot.');
        return;
      }
      if (faqData) {
        setEnabled(faqData.enabled !== false);
        setFaqs(faqData.faqs?.length ? faqData.faqs : [createFaq()]);
      }
      if (unansweredData) {
        setUnanswered(unansweredData.items || []);
      }
    }).
    finally(() => setLoading(false));
  }, [api]);

  const updateFaq = (index, key, value) => {
    setFaqs((prev) => prev.map((item, current) => current === index ? { ...item, [key]: value } : item));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/admin/chatbot/faqs', {
        method: 'POST',
        body: {
          enabled,
          faqs: faqs.
          map((faq) => ({
            ...faq,
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            keywords: String(faq.keywords || '').
            split(',').
            map((item) => item.trim()).
            filter(Boolean)
          })).
          filter((faq) => faq.question && faq.answer)
        }
      });
      pushToast('Đã lưu cấu hình chatbot thành công.', 'success');
    } catch {
      pushToast('Lưu cấu hình thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnanswered = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá câu hỏi này khỏi danh sách huấn luyện không?")) return;
    try {
      await api(`/admin/chatbot/unanswered/${id}`, { method: 'DELETE' });
      setUnanswered(prev => prev.filter(item => item.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      pushToast("Đã xoá câu hỏi", "success");
    } catch {
      pushToast("Lỗi khi xoá câu hỏi", "error");
    }
  };

  const handleBulkDelete = async (deleteAll = false) => {
    if (!deleteAll && selectedIds.size === 0) return;
    if (!window.confirm(deleteAll ? "Bạn có chắc muốn xoá TẤT CẢ câu hỏi chưa trả lời không?" : `Bạn có chắc muốn xoá ${selectedIds.size} câu hỏi đã chọn không?`)) return;
    
    setDeleting(true);
    try {
      await api('/admin/chatbot/unanswered', {
        method: 'DELETE',
        body: {
          deleteAll,
          ids: deleteAll ? [] : Array.from(selectedIds)
        }
      });
      if (deleteAll) {
        setUnanswered([]);
      } else {
        setUnanswered(prev => prev.filter(item => !selectedIds.has(item.id)));
      }
      setSelectedIds(new Set());
      pushToast("Đã xoá thành công", "success");
    } catch {
      pushToast("Lỗi khi xoá câu hỏi", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return <AdminError message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">AI & Khám phá</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> Chatbot AI
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Huấn luyện dữ liệu và theo dõi cấu hình trợ lý AI.</p>
          </div>
          
        </div>
      </AdminHeaderPortal>
      <div className="mb-6 flex justify-end">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-[#fffaf4] px-3 py-1.5 rounded-full border border-[#efe4d4]">
              <div className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`} />
              <button
              type="button"
              onClick={() => setEnabled((value) => !value)}
              className={`relative h-6 w-10 rounded-full transition-colors duration-300 ease-in-out ${enabled ? 'bg-primary' : 'bg-[#d9cbbc]'}`}>
              
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm ${enabled ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            <button
            onClick={handleSave}
            disabled={saving}
            className="admin-button-primary px-4 py-2 text-sm flex items-center gap-2">
            
              <Save className="w-4 h-4" />
              {saving ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
          </div>
      </div>{loading ? <AdminLoading /> : <>

      {/* Guide Section */}
      <div className="bg-white rounded-[24px] border border-[#efe4d4] shadow-sm p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fff4ea] to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
        
        <h2 className="text-[20px] font-bold text-[#3f352b] flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-[#fff4ea] text-primary flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          Hướng dẫn thiết lập Chatbot AI
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c85b34] font-bold text-[15px]">
              <Bot className="w-4 h-4" /> 1. AI & RAG (Tự động hiểu ý)
            </div>
            <p className="text-[14px] text-[#766957] leading-relaxed">
              Hệ thống đã được tích hợp <strong>Groq LLM (Llama 3)</strong>. Chatbot sẽ tự phân tích ý định khách hàng, tìm kiếm trong <strong className="text-[#4f453b]">FAQ Rules</strong> và <strong className="text-[#4f453b]">Sản phẩm</strong> liên quan, sau đó sinh ra câu trả lời tiếng Việt vô cùng tự nhiên.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c85b34] font-bold text-[15px]">
              <KeySquare className="w-4 h-4" /> 2. Tối ưu Nguồn Dữ Liệu
            </div>
            <p className="text-[14px] text-[#766957] leading-relaxed">
              Hãy nhập các từ khóa trọng tâm ở mỗi FAQ. Ví dụ: <code className="bg-[#fff4ea] text-primary px-1.5 py-0.5 rounded text-xs font-semibold">phí ship, vận chuyển</code>. AI sẽ đọc các từ khóa này để lấy câu trả lời tương ứng đưa vào Prompt ngữ cảnh, giúp tư vấn chuẩn xác 100%.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c85b34] font-bold text-[15px]">
              <Sparkles className="w-4 h-4" /> 3. Huấn luyện liên tục
            </div>
            <p className="text-[14px] text-[#766957] leading-relaxed">
              Hãy thường xuyên kiểm tra mục <strong className="text-[#4f453b]">Câu hỏi chưa xử lý tốt</strong> ở dưới cùng. Dựa vào đó, bạn có thể bấm "Thêm FAQ" để dạy bot trả lời các tình huống thực tế hiệu quả hơn.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* FAQ Section (Left - Takes up 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] border border-[#efe4d4] shadow-sm p-6 md:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efe4d4] pb-6">
              <div>
                <h2 className="text-[22px] font-bold text-[#3f352b]">FAQ Rules (Quy tắc trả lời)</h2>
                <p className="text-[14px] text-[#8a7a67] mt-1 font-medium">Kịch bản có sẵn để bot phản hồi ngay lập tức.</p>
              </div>
              <button
                  type="button"
                  onClick={() => setFaqs((prev) => [{ ...createFaq() }, ...prev])}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fffaf4] text-[#c85b34] hover:bg-primary hover:text-white font-bold text-sm rounded-xl border border-[#f2d7cf] hover:border-primary transition-all shadow-sm shrink-0">
                  
                <CirclePlus className="h-5 w-5" />
                Thêm FAQ mới
              </button>
            </div>

            <div className="space-y-5">
              {faqs.map((faq, index) =>
                <div key={index} className="group relative rounded-[20px] border-2 border-transparent bg-[#fffaf4] hover:border-primary/20 hover:bg-white p-5 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white">
                    {faqs.length - index}
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 pl-3">
                    <h3 className="text-sm font-bold text-[#8a7a67] uppercase tracking-wider">Cấu hình Câu hỏi</h3>
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, current) => current !== index))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#f2d7cf] text-[#c85b34] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      title="Xóa FAQ này">
                      
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4 pl-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#5d5246] ml-1">Câu hỏi mẫu của khách</label>
                        <input
                          value={faq.question}
                          onChange={(event) => updateFaq(index, 'question', event.target.value)}
                          placeholder="Ví dụ: Phí ship tính thế nào?"
                          className="w-full bg-white border border-[#eadfcd] rounded-xl px-4 py-3 text-[14px] text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                        
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#5d5246] ml-1">Từ khóa nhận diện (cách nhau bởi dấu phẩy)</label>
                        <input
                          value={Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords}
                          onChange={(event) => updateFaq(index, 'keywords', event.target.value)}
                          placeholder="Ví dụ: phí ship, vận chuyển, giao hàng"
                          className="w-full bg-white border border-[#eadfcd] rounded-xl px-4 py-3 text-[14px] text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                        
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#5d5246] ml-1">Câu trả lời của Bot</label>
                      <textarea
                        value={faq.answer}
                        onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                        placeholder="Nhập nội dung trả lời chi tiết và thân thiện cho khách hàng..."
                        rows={3}
                        className="w-full bg-white border border-[#eadfcd] rounded-xl px-4 py-3 text-[14px] text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all leading-relaxed resize-none" />
                      
                    </div>
                  </div>
                </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-[#efe4d4] flex justify-end">
              <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
                  
                {saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                {saving ? 'Đang lưu thiết lập...' : 'Lưu toàn bộ thay đổi'}
              </button>
            </div>
          </div>
        </div>

        {/* Unanswered Section (Right - Takes up 1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-[#efe4d4] shadow-sm p-6 md:p-8 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-[18px] font-bold text-[#3f352b]">Cần huấn luyện thêm</h2>
                <p className="text-[13px] text-[#8a7a67] font-medium mt-0.5">Tin nhắn bot chưa hiểu được</p>
              </div>
            </div>

            {unanswered.length > 0 && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#efe4d4]">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === unanswered.length && unanswered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(unanswered.map(i => i.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer border-[#eadfcd]"
                  />
                  <span className="text-sm font-semibold text-[#8a7a67] group-hover:text-[#4d4339] transition-colors">
                    Chọn tất cả
                  </span>
                </label>
                
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => handleBulkDelete(false)}
                      disabled={deleting}
                      className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xoá ({selectedIds.size})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
              {unanswered.map((item) =>
                <div key={item.id} className="relative group rounded-2xl border border-[#efe4d4] bg-[#fffaf4] p-4 hover:border-primary/30 hover:bg-white transition-colors flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(item.id);
                          else next.delete(item.id);
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer border-[#eadfcd]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#f2d7cf] rounded-r-full group-hover:bg-primary transition-colors" />
                    <p className="text-[14px] font-semibold text-[#43382f] leading-snug pl-2 break-words">"{item.message}"</p>
                  <p className="text-[12px] font-medium text-[#a08d79] mt-2 pl-2">
                    {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                    }) : 'No timestamp'}
                  </p>
                  
                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteUnanswered(item.id)}
                      className="p-2 bg-white rounded-lg shadow-sm border border-[#efe4d4] text-red-500 hover:bg-red-50 transition-colors"
                      title="Xoá câu này">
                      
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setFaqs((prev) => [{ ...createFaq(), question: item.message }, ...prev]);
                        pushToast('Đã copy tin nhắn này sang FAQ Rules. Vui lòng kéo lên để điền câu trả lời!', 'success');
                      }}
                      className="p-2 bg-white rounded-lg shadow-sm border border-[#efe4d4] text-primary hover:bg-[#fff4ea] transition-colors"
                      title="Thêm vào FAQ">
                      
                      <CopyPlus className="w-4 h-4" />
                    </button>
                  </div>
                  </div>
                </div>
                )}
              {unanswered.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#3f352b] mb-2">Bot đang làm rất tốt!</h3>
                  <p className="text-[14px] text-[#8a7a67] max-w-[200px]">Chưa có câu hỏi nào làm khó được AI của bạn trong thời gian qua.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>}</div>);

}
