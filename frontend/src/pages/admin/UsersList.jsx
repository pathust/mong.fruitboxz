import { useMemo, useState, useEffect } from "react";
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal";
import { Shield, UserPlus, X, Mail, ShieldAlert, BadgeCheck, Users, Trash2 } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminListFilters, filterBySearch } from "../../components/admin/AdminListFilters";
import { AdminLoading } from "../../components/admin/AdminStates"


export default function UsersList() {
  const { api, user: currentUser } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    Promise.all([
    api("/admin/users"),
    api("/admin/roles").catch(() => ({ roles: [] }))]
    ).then(([u, r]) => {
      setUsers(u.users || []);
      setRoles(r.roles || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [api]);

  const setUserRoles = async (userId, roleIds) => {
    await api(`/admin/users/${userId}/roles`, {
      method: "POST",
      body: { roles: roleIds }
    });
    const update = await api(`/admin/users/${userId}`);
    setUsers((prev) => prev.map((u) => u.id === userId ? update.user : u));
    if (showAssignModal && showAssignModal.id === userId) {
      setShowAssignModal(update.user);
    }
  };

  const toggleRole = async (userId, roleId) => {
    const currentUser = users.find((u) => u.id === userId);
    const currentRoleIds = currentUser?.metadata?.roles || [];

    const isAssigned = currentRoleIds.includes(roleId);
    const newRoleIds = isAssigned ?
    currentRoleIds.filter((id) => id !== roleId) :
    [...currentRoleIds, roleId];

    await setUserRoles(userId, newRoleIds);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      const result = await api("/admin/users", {
        method: "POST",
        body: { email: newEmail }
      });
      setUsers((prev) => [result.user, ...prev]);
      setIsCreating(false);
      setNewEmail("");
    } catch (err) {
      alert(err.message || "Lỗi tạo tài khoản");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.")) return;
    try {
      await api(`/admin/users/${userId}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message || "Lỗi khi xóa nhân viên");
    }
  };

  const roleOptions = useMemo(() => {
    return [
    { value: "all", label: "Tất cả vai trò" },
    { value: "none", label: "Chưa phân quyền" },
    ...roles.map((role) => ({ value: role.id, label: role.name }))];

  }, [roles]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const userRoleIds = user.metadata?.roles || [];
      return (
        filterBySearch(user, query, ["email", "first_name", "last_name"]) && (
        roleFilter === "all" || (
        roleFilter === "none" ? userRoleIds.length === 0 : userRoleIds.includes(roleFilter))));

    });
  }, [users, query, roleFilter]);



  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Hệ thống</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Quản trị viên
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý tài khoản quản trị và phân quyền truy cập.</p>
          </div>
        
      </div>
      </AdminHeaderPortal>

      {isCreating &&
      <div className="admin-card p-6 bg-gradient-to-br from-[#fffaf4] to-white border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-secondary text-lg">Cấp tài khoản mới</h3>
            <button onClick={() => setIsCreating(false)} className="text-[#a08d79] hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a08d79]" />
              <input
              type="email"
              required
              autoFocus
              placeholder="Nhập email nhân viên..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#eadfcd] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
            
            </div>
            <button type="submit" className="h-12 px-6 bg-secondary text-white font-bold rounded-xl hover:bg-[#2c2018] transition-colors shrink-0">
              Khởi tạo
            </button>
          </form>
          <p className="text-xs text-[#8a7a67] mt-3 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Mật khẩu mặc định sẽ tự động được tạo và gửi hoặc yêu cầu đổi mật khẩu sau.</p>
        </div>
      }

      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters disableSticky={true}
        actions={
        <>
            <button
            onClick={() => setIsCreating(true)}
            className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
            
          <UserPlus className="w-4 h-4" /> Thêm tài khoản
        </button>
          </>
        }
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm nhân viên..."
        showing={filteredUsers.length}
        total={users.length}
        />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
              <tr>
                <th className="px-5 py-4 text-left w-[40%]">Tài khoản</th>
                <th className="px-5 py-4 text-left">Vai trò & Quyền hạn</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]/50">
              {filteredUsers.map((u) => {
                const userRoleIds = u.metadata?.roles || [];
                const isMe = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="group hover:bg-[#fffaf4]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f0e5d5] to-[#eadfcd] flex items-center justify-center text-secondary font-bold uppercase shrink-0">
                        {u.email.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#3f352b] flex items-center gap-2">
                          {u.email}
                          {isMe && <span className="bg-primary/10 text-primary text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full tracking-wider">Bạn</span>}
                        </p>
                        {(u.first_name || u.last_name) &&
                        <p className="text-xs text-[#8a7a67] mt-0.5">{u.first_name} {u.last_name}</p>
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {userRoleIds.length === 0 ?
                      <span className="text-xs font-medium text-[#a08d79] bg-[#fffaf4] px-3 py-1 rounded-full border border-[#eadfcd] border-dashed">Chưa cấp quyền</span> :

                      userRoleIds.map((rid) => {
                        const role = roles.find((r) => r.id === rid);
                        return role ?
                        <span key={rid} className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-[#f0e5d5] px-3 py-1 rounded-full border border-[#eadfcd]">
                              <Shield className="w-3.5 h-3.5 text-[#a08d79]" /> {role.name}
                            </span> :
                        null;
                      })
                      }
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowAssignModal(u)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-primary/20">
                        <BadgeCheck className="w-4 h-4" /> Quản lý Vai trò
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200">
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>);

            })}
          </tbody>
          </table>
          {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-[#eadfcd] mx-auto mb-4" />
              <p className="text-[#8a7a67] font-medium text-lg">Không tìm thấy nhân viên</p>
          </div>
          ) : null}
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showAssignModal &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2c2018]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 bg-gradient-to-b from-[#fffaf4] to-white border-b border-[#eadfcd]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-extrabold text-secondary">Cấp Quyền Tài Khoản</h2>
                  <p className="text-[#766957] font-medium mt-1">{showAssignModal.email}</p>
                </div>
                <button onClick={() => setShowAssignModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#eadfcd] text-[#a08d79] hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
              {roles.length === 0 ?
            <div className="text-center py-8">
                  <p className="text-[#a08d79] font-medium">Chưa có vai trò nào trong hệ thống.</p>
                </div> :

            <div className="space-y-3">
                  {roles.map((role) => {
                const isSelected = (showAssignModal.metadata?.roles || []).includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(showAssignModal.id, role.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ${isSelected ? 'border-primary bg-[#fff4ea]' : 'border-[#eadfcd] bg-white hover:border-primary/40 hover:bg-[#fffaf4]'}`}>
                    
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-[#d0c1af] bg-white group-hover:border-primary/50'}`}>
                            {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div>
                            <p className={`font-bold ${isSelected ? 'text-primary' : 'text-secondary'}`}>{role.name}</p>
                            {role.description && <p className="text-xs text-[#8a7a67] mt-0.5">{role.description}</p>}
                          </div>
                        </div>
                      </button>);

              })}
                </div>
            }
            </div>

            <div className="p-6 bg-gray-50 border-t border-[#eadfcd] flex justify-end">
              <button
              onClick={() => setShowAssignModal(null)}
              className="bg-secondary text-white font-bold px-6 py-3 rounded-xl hover:bg-[#2c2018] transition-colors">
              
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
