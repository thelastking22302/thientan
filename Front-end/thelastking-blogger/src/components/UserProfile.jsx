import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Typography,
} from '@material-tailwind/react';
import { AiOutlineSetting } from 'react-icons/ai';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const UserProfile = ({ user, onUpdate, onLogout, onChangePassword }) => {
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: user?.full_name || '',
    tag: user?.tag || '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const menuRef = useRef(null);
  const [profileFormErrors, setProfileFormErrors] = useState({});
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: { met: false, message: "Tối thiểu 8 ký tự." },
    upperCase: { met: false, message: "Có ít nhất 1 ký tự viết hoa." },
    number: { met: false, message: "Có ít nhất 1 ký tự số." },
    specialChar: { met: false, message: "Có ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*)." },
  });

  useEffect(() => {
    setProfileFormData({
      full_name: user?.full_name || '',
      tag: user?.tag || '',
    });
    setPasswordFormData({
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setPasswordFormErrors({});
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const { newPassword } = passwordFormData;
    const hasMinLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);

    setPasswordRequirements({
      minLength: { met: hasMinLength, message: "Tối thiểu 8 ký tự." },
      upperCase: { met: hasUpperCase, message: "Có ít nhất 1 ký tự viết hoa." },
      number: { met: hasNumber, message: "Có ít nhất 1 ký tự số." },
      specialChar: { met: hasSpecialChar, message: "Có ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*)." },
    });
  }, [passwordFormData.newPassword]);

  const handleProfileUpdate = () => {
    const errors = {};
    if (!profileFormData.full_name) errors.full_name = "Họ tên không được để trống.";
    if (!profileFormData.tag) errors.tag = "Chức vụ không được để trống.";
    setProfileFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (onUpdate) {
      onUpdate({
        full_name: profileFormData.full_name,
        tag: profileFormData.tag,
      });
    }
    setOpenProfileDialog(false);
    setShowMenu(false);
  };

  const handlePasswordChange = () => {
    const errors = {};
    if (!passwordFormData.oldPassword) errors.oldPassword = "Mật khẩu hiện tại không được để trống.";
    if (!passwordFormData.newPassword) errors.newPassword = "Mật khẩu mới không được để trống.";
    if (!passwordFormData.confirmNewPassword) errors.confirmNewPassword = "Xác nhận mật khẩu mới không được để trống.";

    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      errors.confirmNewPassword = "Mật khẩu mới và xác nhận không khớp.";
    }

    const hasMinLength = passwordFormData.newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(passwordFormData.newPassword);
    const hasNumber = /[0-9]/.test(passwordFormData.newPassword);
    const hasSpecialChar = /[!@#$%^&*]/.test(passwordFormData.newPassword);

    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      errors.newPassword = "Mật khẩu không đáp ứng đủ yêu cầu.";
      setPasswordFormErrors(errors);
      return;
    }

    setPasswordFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (onChangePassword) {
      onChangePassword({
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmNewPassword,
      });
    }
    setOpenPasswordDialog(false);
    setPasswordFormData({
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setPasswordFormErrors({});
  };

  const handlePasswordDialogClose = () => {
    setOpenPasswordDialog(false);
    setPasswordFormData({
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setPasswordFormErrors({});
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  return (
    <div className="relative flex items-center space-x-4">
      <div className="flex items-center space-x-2 relative" ref={menuRef}>
        <Typography
          variant="h6"
          color="blue-gray"
          className="font-medium mr-1 hover:text-blue-500 transition-colors duration-200"
        >
          {user?.full_name || 'Người dùng'}
        </Typography>
        <AiOutlineSetting
          className="text-4xl p-1 cursor-pointer hover:text-blue-500 transition-colors duration-200"
          onClick={() => {
            setShowMenu(prev => !prev);
          }}
        />
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-[9999999] top-10">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-blue-100"
              onClick={() => {
                setOpenProfileDialog(true);
                setShowMenu(false);
              }}
            >
              chỉnh sửa cá nhân
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-blue-100"
              onClick={() => {
                setOpenPasswordDialog(true);
                setShowMenu(false);
              }}
            >
              Đổi mật khẩu
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
              onClick={() => {
                setShowMenu(false);
                if (onLogout) onLogout();
              }}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {openProfileDialog && (
        <Dialog
          open={openProfileDialog}
          handler={() => setOpenProfileDialog(false)}
          size="sm"
          className="rounded-xl overflow-visible z-[9999]"
          animate={false}
        >
          <DialogHeader>Cập nhật thông tin cá nhân</DialogHeader>
          <DialogBody className="overflow-visible space-y-4">
            <Input
              label="Họ tên"
              value={profileFormData.full_name}
              onChange={e => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
              error={!!profileFormErrors.full_name}
            />
            {profileFormErrors.full_name && <Typography variant="small" color="red" className="mt-1">{profileFormErrors.full_name}</Typography>}

            {user?.account && (
              <Typography variant="small" color="blue-gray" className="mt-1">Tài khoản: {user.account}</Typography>
            )}

            <Input
              label="Chức vụ"
              value={profileFormData.tag}
              onChange={e => setProfileFormData({ ...profileFormData, tag: e.target.value })}
              error={!!profileFormErrors.tag}
            />
            {profileFormErrors.tag && <Typography variant="small" color="red" className="mt-1">{profileFormErrors.tag}</Typography>}
          </DialogBody>
          <DialogFooter>
            <Button variant="text" color="blue" onClick={() => setOpenProfileDialog(false)}>
              Hủy
            </Button>
            <Button variant="gradient" color="green" onClick={handleProfileUpdate}>
              Lưu
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {openPasswordDialog && (
        <Dialog
          open={openPasswordDialog}
          handler={handlePasswordDialogClose}
          size="sm"
          className="rounded-xl overflow-visible z-[9999]"
          animate={false}
        >
          <DialogHeader>Đổi mật khẩu</DialogHeader>
          <DialogBody className="overflow-visible space-y-4">
            <div className="relative">
              <Input
                label="Mật khẩu hiện tại"
                type={showOldPassword ? 'text' : 'password'}
                value={passwordFormData.oldPassword}
                onChange={e => setPasswordFormData({ ...passwordFormData, oldPassword: e.target.value })}
                error={!!passwordFormErrors.oldPassword}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-3 z-10"
              >
                {showOldPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            {passwordFormErrors.oldPassword && <Typography variant="small" color="red" className="mt-1">{passwordFormErrors.oldPassword}</Typography>}

            <div className="relative">
              <Input
                label="Mật khẩu mới"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordFormData.newPassword}
                onChange={e => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                error={!!passwordFormErrors.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 z-10"
              >
                {showNewPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
              {Object.entries(passwordRequirements).map(([key, requirement]) => (
                <li key={key}>
                  <Typography
                    variant="small"
                    color={requirement.met ? "green" : "red"}
                  >
                    {requirement.message}
                  </Typography>
                </li>
              ))}
            </ul>
            {passwordFormErrors.newPassword && (
              <Typography variant="small" color="red" className="mt-1">
                {passwordFormErrors.newPassword}
              </Typography>
            )}

            <div className="relative">
              <Input
                label="Nhập lại mật khẩu mới"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={passwordFormData.confirmNewPassword}
                onChange={e => setPasswordFormData({ ...passwordFormData, confirmNewPassword: e.target.value })}
                error={!!passwordFormErrors.confirmNewPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-3 top-3 z-10"
              >
                {showConfirmNewPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            {passwordFormErrors.confirmNewPassword && <Typography variant="small" color="red" className="mt-1">{passwordFormErrors.confirmNewPassword}</Typography>}
          </DialogBody>
          <DialogFooter>
            <Button variant="text" color="blue" onClick={handlePasswordDialogClose}>
              Hủy
            </Button>
            <Button variant="gradient" color="green" onClick={handlePasswordChange}>
              Lưu
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};

export default UserProfile;
// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import {
//   Card,
//   CardHeader,
//   CardBody,
//   Typography,
//   Input,
//   Button,
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Select,
//   Option,
// } from "@material-tailwind/react";
// import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";
// import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
// import axios from "axios";

// const API_BASE = "http://localhost:8000/thientancay/users";
// const AUTH_API_PROFILE = "http://localhost:8000/thientancay/users/profile";
// const SIGN_OUT_API = "http://localhost:8000/thientancay/users/sign-out";
// const WS_URL = "ws://localhost:8000/ws/users";

// const getAccessToken = () => localStorage.getItem("accessToken");

// const axiosInstance = axios.create({
//   withCredentials: true,
//   timeout: 15000,
// });

// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = getAccessToken();
//     if (token && !config.url.includes("/sign-in") && !config.url.includes("/sign-out")) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     console.log("Axios request:", {
//       url: config.url,
//       method: config.method,
//       headers: config.headers,
//     });
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response && error.response.status === 401 && !error.config.url.includes("/sign-in")) {
//       console.error("401 Unauthorized detected:", error.response.data);
//       try {
//         const res = await axios.post(`${API_BASE}/refresh-token`, {}, { withCredentials: true });
//         const newAccessToken = res.data.access_token;
//         if (newAccessToken) {
//           localStorage.setItem("accessToken", newAccessToken);
//           error.config.headers.Authorization = `Bearer ${newAccessToken}`;
//           return axiosInstance(error.config);
//         }
//       } catch (refreshErr) {
//         console.error("Token refresh failed:", refreshErr.response?.data || refreshErr.message);
//         localStorage.removeItem("accessToken");
//         window.location.assign("/login");
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// const UserManagement = ({ currentUser, setCurrentUser }) => {
//   const [users, setUsers] = useState([]);
//   const [search, setSearch] = useState("");
//   const [openForm, setOpenForm] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);
//   const [formData, setFormData] = useState({
//     fullName: "",
//     account: "",
//     password: "",
//     tag: "",
//     role: "user", // Thay "Inner" thành "user"
//   });
//   const [confirmDelete, setConfirmDelete] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [formErrors, setFormErrors] = useState({});
//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
//   const [showPassword, setShowPassword] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [userUpdateTrigger, setUserUpdateTrigger] = useState(0);
//   const [ws, setWs] = useState(null);

//   const fetchUsers = useCallback(async () => {
//     if (!isAuthenticated) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axiosInstance.get(`${API_BASE}/list`, {
//         params: { page: pagination.page, limit: pagination.limit },
//       });
//       console.log("Full API response for users:", res.data);
//       let data = Array.isArray(res.data.data) ? res.data.data : [];
//       if (currentUser?.role_user?.toLowerCase() === "admin") {
//         data = data.filter((user) => (user.role_user?.toLowerCase() || "").toLowerCase() !== "root");
//       }
//       data = data.map((user) => ({
//         ...user,
//         id: user.user_id || user.id, // Ánh xạ id từ user_id nếu API trả về
//         fullName: user.fullName || user.full_name || "N/A",
//         account: user.account || "N/A",
//         tag: user.tag || "N/A",
//         role: user.role_user || "Chưa gán", // Đảm bảo role lấy từ role_user
//         createdAt: user.createdAt || user.created_at || null,
//         updatedAt: user.updatedAt || user.updated_at || null,
//       }));
//       console.log("Processed users data:", data);
//       setUsers(data);
//       setPagination((p) => ({ ...p, total: res.data.count || 0 }));
//     } catch (err) {
//       console.error("Error fetching users:", {
//         message: err.message,
//         response: err.response?.data,
//         stack: err.stack,
//       });
//       setError("Không thể tải danh sách người dùng: " + (err.response?.data?.error || err.message));
//     } finally {
//       setLoading(false);
//     }
//   }, [isAuthenticated, pagination.page, pagination.limit, currentUser]);

//   useEffect(() => {
//     if (!isAuthenticated) return;

//     let token = getAccessToken();
//     if (!token) {
//       console.error("No access token found. Redirecting to login.");
//       setIsAuthenticated(false);
//       window.location.assign("/login");
//       return;
//     }

//     const refreshTokenIfNeeded = async () => {
//       try {
//         const decoded = JSON.parse(atob(token.split(".")[1]));
//         const exp = decoded.exp * 1000;
//         const timeLeft = exp - Date.now();
//         console.log("Token expires in:", timeLeft / 1000, "seconds");
//         if (timeLeft < 60000) {
//           console.log("Token near expiration. Refreshing...");
//           const res = await axios.post(`${API_BASE}/refresh-token`, {}, { withCredentials: true });
//           const newAccessToken = res.data.access_token;
//           if (newAccessToken) {
//             localStorage.setItem("accessToken", newAccessToken);
//             token = newAccessToken;
//             console.log("Refreshed token:", newAccessToken.slice(0, 10) + "...");
//           }
//         }
//       } catch (e) {
//         console.error("Error checking/refreshing token:", e);
//       }
//       return token;
//     };

//     const connectWebSocket = async () => {
//       const currentToken = await refreshTokenIfNeeded();
//       const wsUrl = `${WS_URL}?authorization=Bearer%20${encodeURIComponent(currentToken)}`;
//       console.log("Connecting to WebSocket:", wsUrl.slice(0, 50) + "...");

//       const websocket = new WebSocket(wsUrl);

//       websocket.onopen = () => {
//         console.log("WebSocket connected to /users namespace");
//         websocket.send(JSON.stringify({ event: "subscribe", data: "users-room" }));
//       };

//       websocket.onmessage = (event) => {
//         try {
//           const message = JSON.parse(event.data);
//           console.log("Raw WebSocket message:", event.data);
//           console.log("Parsed WebSocket message:", message);
//           if (message.event === "subscribed") {
//             console.log("Subscribed to /users:users-room", message.data);
//           } else if (message.event === "user:created") {
//             console.log("User created event:", message.data);
//             setUserUpdateTrigger((prev) => prev + 1);
//           } else if (message.event === "user:updated") {
//             console.log("User updated event:", message.data);
//             setUserUpdateTrigger((prev) => prev + 1);
//           } else if (message.event === "user:deleted") {
//             console.log("User deleted event:", message.data);
//             setUserUpdateTrigger((prev) => prev + 1);
//           }
//         } catch (err) {
//           console.error("Error parsing WebSocket message:", err);
//         }
//       };

//       websocket.onclose = (event) => {
//         console.log("WebSocket closed:", { code: event.code, reason: event.reason });
//         if (isAuthenticated) {
//           setTimeout(() => {
//             console.log("Attempting WebSocket reconnect...");
//             connectWebSocket();
//           }, 5000);
//         }
//       };

//       websocket.onerror = (err) => {
//         console.error("WebSocket error:", err);
//         setError("Kết nối WebSocket thất bại.");
//       };

//       setWs(websocket);
//     };

//     connectWebSocket();

//     return () => {
//       if (ws) {
//         ws.close();
//         console.log("WebSocket disconnected from /users namespace");
//       }
//     };
//   }, [isAuthenticated]);

//   useEffect(() => {
//     const token = getAccessToken();
//     if (token) {
//       console.log("Access token found:", token.slice(0, 10) + "...");
//       setIsAuthenticated(true);
//     } else {
//       console.log("No access token found. Redirecting to login.");
//       window.location.assign("/login");
//     }
//   }, []);

//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       if (!isAuthenticated || currentUser) return;
//       setLoading(true);
//       try {
//         const res = await axiosInstance.get(AUTH_API_PROFILE);
//         const userData = res.data.data || res.data;
//         const role_user = userData.role_user || "unknown";
//         const updatedUserData = { ...userData, role_user, id: userData.user_id || userData.id }; // Ánh xạ id từ user_id
//         console.log("Current user response (raw):", res.data);
//         console.log("Current user data after mapping:", updatedUserData);
//         setCurrentUser(updatedUserData);
//       } catch (err) {
//         console.error("Error fetching current user:", err.response?.data || err.message);
//         setError("Không thể tải thông tin người dùng hiện tại.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     console.log("Fetching current user - isAuthenticated:", isAuthenticated, "currentUser:", currentUser);
//     fetchCurrentUser();
//   }, [isAuthenticated, currentUser, setCurrentUser]);

//   useEffect(() => {
//     if (isAuthenticated) {
//       console.log("Fetching users due to trigger:", { page: pagination.page, userUpdateTrigger });
//       fetchUsers();
//     }
//   }, [isAuthenticated, pagination.page, pagination.limit, fetchUsers, userUpdateTrigger]);

//   const handleLogout = async () => {
//     try {
//       await axiosInstance.post(SIGN_OUT_API);
//       console.log("Đăng xuất thành công");
//     } catch (err) {
//       console.error("Lỗi khi đăng xuất:", err.response?.data || err.message);
//     } finally {
//       localStorage.removeItem("accessToken");
//       setCurrentUser(null);
//       setUsers([]);
//       setIsAuthenticated(false);
//       window.location.assign("/login");
//     }
//   };

//   const filteredUsers = useMemo(() => {
//     const lower = search.toLowerCase();
//     const filtered = users.filter(
//       (u) =>
//         (u.fullName?.toLowerCase() || "").includes(lower) ||
//         (u.account?.toLowerCase() || "").includes(lower) ||
//         (u.tag?.toLowerCase() || "").includes(lower) ||
//         (u.role?.toLowerCase() || "").includes(lower)
//     );
//     console.log("Filtered users:", filtered);
//     return filtered;
//   }, [search, users]);

//   const handleOpenForm = (user = null) => {
//     setEditingUser(user);
//     setFormData(
//       user
//         ? { ...user, password: "" }
//         : { fullName: "", account: "", password: "", tag: "", role: "user" } // Thay "Inner" thành "user"
//     );
//     setFormErrors({});
//     setOpenForm(true);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target || e;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setFormErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const validateForm = () => {
//     const errors = {};
//     const { fullName, account, password, tag, role } = formData;

//     if (!fullName) errors.fullName = "Họ tên là bắt buộc.";
//     if (!account) errors.account = "Tài khoản là bắt buộc.";
//     if (!tag) errors.tag = "Tag là bắt buộc.";
//     if (!editingUser && !password) errors.password = "Mật khẩu là bắt buộc.";

//     if (account && !account.endsWith("@thientan.co")) {
//       errors.account = "Đây là tài khoản nội bộ";
//     } else if (editingUser && currentUser?.role_user?.toLowerCase() === "root") {
//       // Root có thể chỉnh sửa tất cả, bỏ qua kiểm tra tài khoản nội bộ
//     } else if (editingUser && currentUser?.role_user?.toLowerCase() === "admin" && !["user", "admin"].includes(editingUser.role.toLowerCase())) {
//       errors.account = "Chỉ có thể chỉnh sửa user hoặc admin."; // Thay "Inner" thành "user"
//     }

//     if (password) {
//       const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//       if (!passwordRegex.test(password)) {
//         errors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
//       }
//     }

//     if (!["admin", "user"].includes(role.toLowerCase())) { // Thay "Inner" thành "user"
//       errors.role = "Vai trò phải là admin hoặc user.";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleSave = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     setError(null);
//     try {
//       if (editingUser) {
//         const updateData = {
//           id: editingUser.id,
//           fullName: formData.fullName,
//           tag: formData.tag,
//           role: formData.role,
//           ...(formData.password && { password: formData.password }),
//         };
//         console.log("Updating user with data:", updateData);
//         await axiosInstance.patch(`${API_BASE}/upd`, updateData);
//       } else {
//         const createData = {
//           fullName: formData.fullName,
//           account: formData.account,
//           password: formData.password,
//           tag: formData.tag,
//           role: formData.role,
//         };
//         console.log("Creating user with data:", createData);
//         const res = await axiosInstance.post(`${API_BASE}/id`, createData);
//         console.log("New user created, current user token unchanged:", res.data);
//       }
//       setOpenForm(false);
//       fetchUsers();
//     } catch (err) {
//       console.error("Lỗi khi lưu người dùng:", err.response?.data || err.message);
//       setError(err.response?.data?.error || "Không thể lưu người dùng.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!confirmDelete?.id) return;
//     setLoading(true);
//     setError(null);
//     try {
//       console.log("Deleting user with id:", confirmDelete.id);
//       await axiosInstance.delete(`${API_BASE}/del/${confirmDelete.id}`);
//       setConfirmDelete(null);
//       fetchUsers();
//     } catch (err) {
//       console.error("Lỗi khi xóa người dùng:", err.response?.data || err.message);
//       setError("Không thể xóa người dùng: " + (err.response?.data?.error || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const canEdit = (user) => {
//     const role = currentUser?.role_user?.toLowerCase();
//     if (!role) {
//       console.warn("Role_user is undefined for current user, defaulting to false:", currentUser);
//       return false;
//     }
//     console.log("Can edit check - Current role_user:", role, "User role_user:", user.role?.toLowerCase(), "User ID:", user.id);
//     if (role === "root") return true;
//     if (role === "admin") return ["user", "admin"].includes(user.role?.toLowerCase()) && currentUser?.id !== user.id; // Thay "inner" thành "user"
//     return false;
//   };

//   const canDelete = (user) => {
//     const role = currentUser?.role_user?.toLowerCase();
//     if (!role) {
//       console.warn("Role_user is undefined for current user, defaulting to false:", currentUser);
//       return false;
//     }
//     console.log("Can delete check - Current role_user:", role, "User role_user:", user.role?.toLowerCase(), "User ID:", user.id, "Current User ID:", currentUser?.id);
//     if (role === "root") return currentUser?.id !== user.id;
//     if (role === "admin") return user.role?.toLowerCase() === "user" && currentUser?.id !== user.id; // Thay "inner" thành "user"
//     return false;
//   };

//   const canAdd = () => {
//     const role = currentUser?.role_user?.toLowerCase();
//     if (!role) {
//       console.warn("Role_user is undefined for current user, defaulting to false:", currentUser);
//       return false;
//     }
//     console.log("Can add check - Current role_user:", role);
//     return role === "root" || role === "admin";
//   };

//   return (
//     <Card className="mt-6">
//       <CardHeader floated={false} shadow={false} className="flex items-center justify-between">
//         <Typography variant="h5">Quản lý người dùng</Typography>
//         <div className="flex w-full shrink-0 gap-2 md:w-max">
//           <div className="w-full md:w-72">
//             <Input label="Tìm kiếm" value={search} onChange={(e) => setSearch(e.target.value)} />
//           </div>
//           {canAdd() && (
//             <Button onClick={() => handleOpenForm()} className="flex items-center gap-1" color="blue">
//               <PlusIcon className="h-4 w-4" /> Thêm người dùng
//             </Button>
//           )}
//         </div>
//       </CardHeader>

//       <CardBody className="px-0">
//         {loading && <Typography className="text-center">Đang tải...</Typography>}
//         {error && (
//           <Typography color="red" className="text-center">
//             {error.includes("WebSocket") ? "Không thể cập nhật thời gian thực. Hiển thị dữ liệu đã tải trước đó." : error}
//           </Typography>
//         )}
//         {!loading && !error && (
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-max table-auto text-left">
//               <thead>
//                 <tr>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Họ tên
//                     </Typography>
//                   </th>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Tài khoản
//                     </Typography>
//                   </th>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Vai trò
//                     </Typography>
//                   </th>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Tag
//                     </Typography>
//                   </th>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Ngày tạo
//                     </Typography>
//                   </th>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Ngày cập nhật
//                     </Typography>
//                   </th>
//                   <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                     <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
//                       Hành động
//                     </Typography>
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredUsers.map((user, index) => {
//                   const isLast = index === filteredUsers.length - 1;
//                   const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

//                   return (
//                     <tr key={user.id || index}>
//                       <td className={classes}>
//                         <Typography variant="small" color="blue-gray" className="font-normal">
//                           {user.fullName}
//                         </Typography>
//                       </td>
//                       <td className={classes}>
//                         <Typography variant="small" color="blue-gray" className="font-normal">
//                           {user.account}
//                         </Typography>
//                       </td>
//                       <td className={classes}>
//                         <Typography variant="small" color="blue-gray" className="font-normal">
//                           {user.role}
//                         </Typography>
//                       </td>
//                       <td className={classes}>
//                         <Typography variant="small" color="blue-gray" className="font-normal">
//                           {user.tag}
//                         </Typography>
//                       </td>
//                       <td className={classes}>
//                         <Typography variant="small" color="blue-gray" className="font-normal">
//                           {user.createdAt && !isNaN(Date.parse(user.createdAt))
//                             ? new Date(user.createdAt).toLocaleDateString()
//                             : "N/A"}
//                         </Typography>
//                       </td>
//                       <td className={classes}>
//                         <Typography variant="small" color="blue-gray" className="font-normal">
//                           {user.updatedAt && !isNaN(Date.parse(user.updatedAt))
//                             ? new Date(user.updatedAt).toLocaleDateString()
//                             : "N/A"}
//                         </Typography>
//                       </td>
//                       <td className={classes}>
//                         <div className="flex gap-2">
//                           {canEdit(user) && <Button size="sm" color="blue" onClick={() => handleOpenForm(user)}>Sửa</Button>}
//                           {canDelete(user) && <Button size="sm" color="red" onClick={() => setConfirmDelete(user)}>Xóa</Button>}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//         {!loading && !error && filteredUsers.length === 0 && (
//           <Typography className="text-center mt-4">Không tìm thấy người dùng.</Typography>
//         )}
//       </CardBody>

//       <Dialog open={openForm} handler={() => setOpenForm(false)} size="sm">
//         <DialogHeader>{editingUser ? "Sửa người dùng" : "Thêm người dùng"}</DialogHeader>
//         <DialogBody divider>
//           <div className="grid gap-4">
//             <Input
//               label="Họ tên"
//               name="fullName"
//               value={formData.fullName}
//               onChange={handleChange}
//               error={!!formErrors.fullName}
//             />
//             {formErrors.fullName && (
//               <Typography variant="small" color="red" className="-mt-3">
//                 {formErrors.fullName}
//               </Typography>
//             )}

//             <Input
//               label="Tài khoản"
//               name="account"
//               value={formData.account}
//               onChange={handleChange}
//               disabled={!!editingUser}
//               error={!!formErrors.account}
//             />
//             {formErrors.account && (
//               <Typography variant="small" color="red" className="-mt-3">
//                 {formErrors.account}
//               </Typography>
//             )}

//             <div className="relative">
//               <Input
//                 type={showPassword ? "text" : "password"}
//                 label={editingUser ? "Mật khẩu (để trống nếu không đổi)" : "Mật khẩu *"}
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 error={!!formErrors.password}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-3 z-10"
//               >
//                 {showPassword ? (
//                   <EyeSlashIcon className="h-5 w-5 text-gray-500" />
//                 ) : (
//                   <EyeIcon className="h-5 w-5 text-gray-500" />
//                 )}
//               </button>
//             </div>
//             {formErrors.password && (
//               <Typography variant="small" color="red" className="-mt-3">
//                 {formErrors.password}
//               </Typography>
//             )}

//             <Input label="Tag" name="tag" value={formData.tag} onChange={handleChange} error={!!formErrors.tag} />
//             {formErrors.tag && (
//               <Typography variant="small" color="red" className="-mt-3">
//                 {formErrors.tag}
//               </Typography>
//             )}

//             <Select
//               label="Vai trò"
//               name="role"
//               value={formData.role}
//               onChange={(value) => handleChange({ name: "role", value })}
//               error={!!formErrors.role}
//             >
//               <Option value="admin">Admin</Option>
//               <Option value="user">User</Option> {/* Thay "Inner" thành "user" */}
//             </Select>
//             {formErrors.role && (
//               <Typography variant="small" color="red" className="-mt-3">
//                 {formErrors.role}
//               </Typography>
//             )}
//           </div>
//         </DialogBody>
//         <DialogFooter>
//           <Button variant="text" onClick={() => setOpenForm(false)} color="blue-gray">
//             Hủy
//           </Button>
//           <Button variant="gradient" onClick={handleSave} disabled={loading}>
//             Lưu
//           </Button>
//         </DialogFooter>
//       </Dialog>

//       <Dialog open={!!confirmDelete} handler={() => setConfirmDelete(null)} size="sm">
//         <DialogHeader>Xác nhận xóa</DialogHeader>
//         <DialogBody>
//           Bạn có chắc muốn xóa người dùng <b>{confirmDelete?.fullName}</b>?
//         </DialogBody>
//         <DialogFooter>
//           <Button variant="text" onClick={() => setConfirmDelete(null)} color="blue-gray">
//             Hủy
//           </Button>
//           <Button variant="gradient" color="red" onClick={handleDelete} disabled={loading}>
//             Xóa
//           </Button>
//         </DialogFooter>
//       </Dialog>

//       {pagination.total > pagination.limit && (
//         <div className="flex items-center justify-center gap-4 mt-4">
//           <Button
//             variant="text"
//             disabled={pagination.page === 1}
//             onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
//           >
//             Trước
//           </Button>
//           <Typography color="gray" className="font-normal">
//             Trang <strong className="text-blue-gray-900">{pagination.page}</strong> /{" "}
//             <strong className="text-blue-gray-900">{Math.ceil(pagination.total / pagination.limit)}</strong>
//           </Typography>
//           <Button
//             variant="text"
//             disabled={pagination.page * pagination.limit >= pagination.total}
//             onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
//           >
//             Tiếp
//           </Button>
//         </div>
//       )}
//     </Card>
//   );
// };

// export default UserManagement;