import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Select,
  Option,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { getAccessToken, setAccessToken, removeAccessToken } from "../utils/tokenMemory";

const API_BASE = "http://localhost:8000/thientancay/users";
const AUTH_API_PROFILE = "http://localhost:8000/thientancay/users/profile";
const SIGN_OUT_API = "http://localhost:8000/thientancay/users/sign-out";
const WS_URL = "ws://localhost:8000/ws/users";

const axiosInstance = axios.create({
  withCredentials: true,
  timeout: 15000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.url.includes("/sign-in") && !config.url.includes("/sign-out")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401 && !error.config.url.includes("/sign-in")) {
      try {
        const res = await axios.post(`${API_BASE}/refresh-token`, {}, { withCredentials: true });
        const newAccessToken = res.data.access_token;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(error.config);
        }
      } catch (refreshErr) {
        removeAccessToken();
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

const UserManagement = ({ currentUser, setCurrentUser, selectedTab, onTabSelect }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "", // Đổi từ FullName thành full_name để khớp với server
    account: "",
    password_user: "", // Đã đúng
    rePassword: "",
    tag: "",
    role_user: "user", // Đổi từ role thành role_user để khớp với server
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [showPassword, setShowPassword] = useState(false); // Keep password visibility state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userUpdateTrigger, setUserUpdateTrigger] = useState(0);
  const [ws, setWs] = useState(null);
  const [showToast, setShowToast] = useState({ visible: false, message: '', isError: false });
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  }); // Keep password strength checks state

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`${API_BASE}/list`, {
        params: { page: pagination.page, limit: pagination.limit },
      });
      let data = Array.isArray(res.data.data) ? res.data.data : [];
      if (currentUser?.role_user?.toLowerCase() === "admin") {
        data = data.filter((user) => (user.role_user?.toLowerCase() || "").toLowerCase() !== "root");
      }
      data = data.map((user) => ({
        ...user,
        id: user.user_id || user.id,
        full_name: user.full_name || "N/A", // Đồng bộ với server
        account: user.account || "N/A",
        tag: user.tag || "N/A",
        role_user: user.role_user || "Chưa gán",
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
      }));
      setUsers(data);
      setPagination((p) => ({ ...p, total: res.data.count || 0 }));
    } catch (err) {
      setError("Không thể tải danh sách người dùng: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, pagination.page, pagination.limit, currentUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let token = getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      window.location.assign("/login");
      return;
    }

    const refreshTokenIfNeeded = async () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const exp = decoded.exp * 1000;
        const timeLeft = exp - Date.now();
        if (timeLeft < 60000) {
          const res = await axios.post(`${API_BASE}/refresh-token`, {}, { withCredentials: true });
          const newAccessToken = res.data.access_token;
          if (newAccessToken) {
            localStorage.setItem("accessToken", newAccessToken);
            token = newAccessToken;
          }
        }
      } catch (e) {
        // Không log lỗi
      }
      return token;
    };

    const connectWebSocket = async () => {
      const currentToken = await refreshTokenIfNeeded();
      const wsUrl = `${WS_URL}?authorization=Bearer%20${encodeURIComponent(currentToken)}`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        websocket.send(JSON.stringify({ event: "subscribe", data: "users-room" }));
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === "subscribed") {
            setShowToast({ visible: true, message: 'WebSocket người dùng đã kết nối!', isError: false });
          } else if (message.event === "users:created") {
            setUserUpdateTrigger((prev) => prev + 1);
          } else if (message.event === "users:updated") {
            setUserUpdateTrigger((prev) => prev + 1);
          } else if (message.event === "users:deleted") {
            setUserUpdateTrigger((prev) => prev + 1);
          }
        } catch (err) {
          // Không log lỗi
        }
      };

      websocket.onclose = (event) => {
        if (isAuthenticated) {
          setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      websocket.onerror = (err) => {
        setError("Kết nối WebSocket thất bại.");
      };

      setWs(websocket);
    };

    if (selectedTab === 'users') { // Only connect if this tab is selected
      connectWebSocket();

      return () => {
        if (ws) {
          ws.close();
        }
      };
    } else {
      // If not the selected tab, ensure any existing connection is closed
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      setWs(null);
      // Clean up function returns nothing when not connected
      return () => {};
    }
  }, [isAuthenticated, selectedTab]); // Added selectedTab dependency

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setIsAuthenticated(true);
    } else {
      window.location.assign("/login");
    }
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isAuthenticated || currentUser) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(AUTH_API_PROFILE);
        const userData = res.data.data || res.data;
        const role_user = userData.role_user || "unknown";
        const updatedUserData = { ...userData, role_user, id: userData.user_id || userData.id };
        setCurrentUser(updatedUserData);
      } catch (err) {
        setError("Không thể tải thông tin người dùng hiện tại.");
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, [isAuthenticated, currentUser, setCurrentUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, pagination.page, pagination.limit, fetchUsers, userUpdateTrigger]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post(SIGN_OUT_API);
    } catch (err) {
      // Không log lỗi
    } finally {
      removeAccessToken();
      setCurrentUser(null);
      setUsers([]);
      setIsAuthenticated(false);
      window.location.assign("/login");
    }
  };

  const filteredUsers = useMemo(() => {
    const lower = search.toLowerCase();
    const filtered = users.filter(
      (u) =>
        (u.full_name?.toLowerCase() || "").includes(lower) ||
        (u.account?.toLowerCase() || "").includes(lower) ||
        (u.tag?.toLowerCase() || "").includes(lower) ||
        (u.role_user?.toLowerCase() || "").includes(lower)
    );
    return filtered;
  }, [search, users]);

  const handleOpenForm = (user = null) => {
    setEditingUser(user);
    setFormData(
      user
        ? { ...user, password_user: "", rePassword: "" }
        : { full_name: "", account: "", password_user: "", rePassword: "", tag: "", role_user: "user" }
    );
    setPasswordChecks({
      minLength: false,
      uppercase: false,
      number: false,
      specialChar: false,
    }); // Reset password checks on form open
    setOpenForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target || e;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));

    // Password strength check only for password field
    if (name === "password_user") {
      setPasswordChecks({
        minLength: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        number: /\d/.test(value),
        specialChar: /[@$!%*?&]/.test(value),
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const { full_name, account, password_user, rePassword, tag, role_user } = formData;

    if (!full_name) errors.full_name = "Họ tên là bắt buộc.";
    if (!account) errors.account = "Tài khoản là bắt buộc.";
    if (!tag) errors.tag = "Tag là bắt buộc.";
    if (!editingUser && !password_user) errors.password_user = "Mật khẩu là bắt buộc.";

    if (currentUser?.role_user?.toLowerCase() !== "root") {
      if (account && !account.endsWith("@thientan.com")) {
        errors.account = "Tài khoản phải có đuôi @thientan.com";
      }
    }

    if (editingUser && currentUser?.role_user?.toLowerCase() === "admin" && !["user", "admin"].includes(editingUser.role_user?.toLowerCase())) {
      errors.account = "Chỉ có thể chỉnh sửa user hoặc admin.";
    }

    if (!["admin", "user"].includes(role_user.toLowerCase())) {
      errors.role_user = "Vai trò phải là admin hoặc user.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      if (editingUser) {
        const updateData = {
          id: editingUser.id,
          full_name: formData.full_name,
          tag: formData.tag,
          role_user: formData.role_user,
        };
        await axiosInstance.patch(`${API_BASE}/updUser/${editingUser.id}`, updateData);
        setShowToast({ visible: true, message: 'Cập nhật người dùng thành công!', isError: false });
      } else {
        const createData = {
          full_name: formData.full_name,
          account: formData.account,
          password_user: formData.password_user,
          tag: formData.tag,
          role_user: formData.role_user,
        };
        await axiosInstance.post(`${API_BASE}/createUser`, createData);
        setShowToast({ visible: true, message: 'Tạo người dùng thành công!', isError: false });
      }
      setOpenForm(false);
      fetchUsers();
    } catch (err) {
      let errorMessage = err.response?.data?.comment || err.response?.data?.error || "Không thể lưu người dùng.";
      setError(errorMessage);
      setShowToast({ visible: true, message: `Thất bại: ${errorMessage}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete?.id) return;
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.delete(`${API_BASE}/del/${confirmDelete.id}`);
      setConfirmDelete(null);
      fetchUsers();
      setShowToast({ visible: true, message: 'Xóa người dùng thành công!', isError: false });
    } catch (err) {
      const errorMessage = "Không thể xóa người dùng: " + (err.response?.data?.error || err.message);
      setError(errorMessage);
      setShowToast({ visible: true, message: `Thất bại: ${errorMessage}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (user) => {
    const role = currentUser?.role_user?.toLowerCase();
    if (!role) {
      return false;
    }
    if (role === "root") return true;
    if (role === "admin") return ["user", "admin"].includes(user.role_user?.toLowerCase()) && currentUser?.id !== user.id;
    return false;
  };

  const canDelete = (user) => {
    const role = currentUser?.role_user?.toLowerCase();
    if (!role) {
      return false;
    }
    if (role === "root") return currentUser?.id !== user.id;
    if (role === "admin") return user.role_user?.toLowerCase() === "user" && currentUser?.id !== user.id;
    return false;
  };

  const canAdd = () => {
    const role = currentUser?.role_user?.toLowerCase();
    if (!role) {
      return false;
    }
    return role === "root" || role === "admin";
  };

  // Effect to hide toast automatically after 5 seconds
  useEffect(() => {
    if (showToast.visible) {
      const timer = setTimeout(() => {
        setShowToast({ visible: false, message: '', isError: false });
      }, 3000); // Hide after 5000 milliseconds (5 seconds)

      // Cleanup function to clear the timer if the component unmounts or toast changes
      return () => clearTimeout(timer);
    }
  }, [showToast]); // Rerun effect when showToast state changes

  return (
    <Card className="mt-6">
      {/* Toast */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out
        ${showToast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}
        style={{ minWidth: '220px' }}
      >
        <div className={`rounded-lg px-5 py-2 shadow-lg flex items-center space-x-2 border 
          ${showToast.isError ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d={showToast.isError ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'} />
          </svg>
          <span className="text-sm font-semibold">{showToast.message}</span>
        </div>
      </div>

      <CardHeader floated={false} shadow={false} className="flex items-center justify-between">
        <Typography variant="h5">Quản lý người dùng</Typography>
        <div className="flex w-full shrink-0 gap-2 md:w-max">
          <div className="w-full md:w-72">
            <Input label="Tìm kiếm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {canAdd() && (
            <Button onClick={() => handleOpenForm()} className="flex items-center gap-1" color="blue">
              <PlusIcon className="h-4 w-4" /> Thêm người dùng
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody className="px-0">
        {loading && <Typography className="text-center">Đang tải...</Typography>}
        {error && (
          <Typography color="red" className="text-center">
            {error.includes("WebSocket") ? "Không thể cập nhật thời gian thực. Hiển thị dữ liệu đã tải trước đó." : error}
          </Typography>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Họ tên
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Tài khoản
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Vai trò
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Tag
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Ngày tạo
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Ngày cập nhật
                    </Typography>
                  </th>
                  <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                      Hành động
                    </Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const isLast = index === filteredUsers.length - 1;
                  const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

                  return (
                    <tr key={user.id || index}>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {user.full_name}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {user.account}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {user.role_user}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {user.tag}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {user.created_at && !isNaN(Date.parse(user.created_at))
                            ? new Date(user.created_at).toLocaleDateString()
                            : "N/A"}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {user.updated_at && !isNaN(Date.parse(user.updated_at))
                            ? new Date(user.updated_at).toLocaleDateString()
                            : "N/A"}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex gap-2">
                          {canEdit(user) && <Button size="sm" color="blue" onClick={() => handleOpenForm(user)}>Sửa</Button>}
                          {canDelete(user) && <Button size="sm" color="red" onClick={() => setConfirmDelete(user)}>Xóa</Button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filteredUsers.length === 0 && (
          <Typography className="text-center mt-4">Không tìm thấy người dùng.</Typography>
        )}
      </CardBody>

      <Dialog open={openForm} handler={() => setOpenForm(false)} size="sm">
        <DialogHeader>{editingUser ? "Sửa người dùng" : "Thêm người dùng"}</DialogHeader>
        <DialogBody divider>
          <div className="grid gap-4">
            <Input
              label="Họ tên"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              error={!!formErrors.full_name}
            />
            {formErrors.full_name && (
              <Typography variant="small" color="red" className="-mt-3">
                {formErrors.full_name}
              </Typography>
            )}

            <Input
              label="Tài khoản"
              name="account"
              value={formData.account}
              onChange={handleChange}
              disabled={!!editingUser}
              error={!!formErrors.account}
            />
            {formErrors.account && (
              <Typography variant="small" color="red" className="-mt-3">
                {formErrors.account}
              </Typography>
            )}

            {/* Password fields appear only for new users */}
            {!editingUser && (
              <>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="Mật khẩu *"
                    name="password_user"
                    value={formData.password_user}
                    onChange={handleChange}
                    error={!!formErrors.password_user}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 z-10"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {formData.password_user && (
                  <div className="mt-2">
                    <Typography variant="small" color={passwordChecks.minLength ? "green" : "red"} className="text-sm">
                      • Tối thiểu 8 ký tự: {passwordChecks.minLength ? "✓" : "✗"}
                    </Typography>
                    <Typography variant="small" color={passwordChecks.uppercase ? "green" : "red"} className="text-sm">
                      • Có ít nhất 1 ký tự viết hoa: {passwordChecks.uppercase ? "✓" : "✗"}
                    </Typography>
                    <Typography variant="small" color={passwordChecks.number ? "green" : "red"} className="text-sm">
                      • Có ít nhất 1 ký tự số: {passwordChecks.number ? "✓" : "✗"}
                    </Typography>
                    <Typography variant="small" color={passwordChecks.specialChar ? "green" : "red"} className="text-sm">
                      • Có ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*): {passwordChecks.specialChar ? "✓" : "✗"}
                    </Typography>
                  </div>
                )}
                {formErrors.password_user && (
                  <Typography variant="small" color="red" className="-mt-1">
                    {formErrors.password_user}
                  </Typography>
                )}

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="Nhập lại mật khẩu *"
                    name="rePassword"
                    value={formData.rePassword}
                    onChange={handleChange}
                    error={!!formErrors.rePassword}
                  />
                </div>
                {formErrors.rePassword && (
                  <Typography variant="small" color="red" className="-mt-3">
                    {formErrors.rePassword}
                  </Typography>
                )}
              </>
            )}

            <Input label="Tag" name="tag" value={formData.tag} onChange={handleChange} error={!!formErrors.tag} />
            {formErrors.tag && (
              <Typography variant="small" color="red" className="-mt-3">
                {formErrors.tag}
              </Typography>
            )}

           <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
  Vai trò
</label>
<select
  id="role"
  name="role_user"
  value={formData.role_user}
  onChange={(e) => handleChange({ name: "role_user", value: e.target.value })}
  className={`block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
    formErrors.role_user ? 'border-red-500' : ''
  }`}
>
  <option value="admin">Admin</option>
  <option value="user">User</option>
</select>
            {formErrors.role_user && (
              <Typography variant="small" color="red" className="-mt-3">
                {formErrors.role_user}
              </Typography>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setOpenForm(false)} color="blue-gray">
            Hủy
          </Button>
          <Button variant="gradient" onClick={handleSave} disabled={loading}>
            Lưu
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!confirmDelete} handler={() => setConfirmDelete(null)} size="sm">
        <DialogHeader>Xác nhận xóa</DialogHeader>
        <DialogBody>
          Bạn có chắc muốn xóa người dùng <b>{confirmDelete?.full_name}</b>?
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setConfirmDelete(null)} color="blue-gray">
            Hủy
          </Button>
          <Button variant="gradient" color="red" onClick={handleDelete} disabled={loading}>
            Xóa
          </Button>
        </DialogFooter>
      </Dialog>

      {pagination.total > pagination.limit - 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="text"
            disabled={pagination.page === 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Trước
          </Button>
          <Typography color="gray" className="font-normal">
            Trang <strong className="text-blue-gray-900">{pagination.page}</strong> /{" "}
            <strong className="text-blue-gray-900">{Math.ceil(pagination.total / pagination.limit)}</strong>
          </Typography>
          <Button
            variant="text"
            disabled={pagination.page * pagination.limit >= pagination.total}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Tiếp
          </Button>
        </div>
      )}
    </Card>
  );
};

export default UserManagement;