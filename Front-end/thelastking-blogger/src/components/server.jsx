import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Typography,
} from "@material-tailwind/react";
import UserManagement from "./UserManagement";
import ProductManagement from "./ProductManagement";
import Table from "./Table";
import Dashboard from "./DashBoard";
import UserProfile from "./UserProfile";
import axios from "axios";
import LocationManagement from "./LocationManagement";
import FactoriesManagement from "./FactoriesManagement";
import { getAccessToken, setAccessToken, removeAccessToken } from "../utils/tokenMemory";

const API_BASE = "http://localhost:8000/thientancay";

// Axios instance for HTTP requests
const axiosInstance = axios.create({
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.url.includes('/sign-in') && !config.url.includes('/sign-out')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401 && !error.config.url.includes('/sign-in')) {
      try {
        const res = await axios.post(`${API_BASE}/users/refresh-token`, {}, { withCredentials: true });
        const newAccessToken = res.data.access_token;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(error.config); // Retry the original request
        }
      } catch (refreshErr) {
        removeAccessToken();
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

const AppServer = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedTab, setSelectedTab] = useState(() => {
    // Get initial tab from localStorage or default to 'users'
    const savedTab = localStorage.getItem('selectedTab');
    return savedTab || 'users';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        navigate("/login");
        setLoadingUser(false);
        return;
      }

      try {
        const userRes = await axiosInstance.get(`${API_BASE}/users/profile`);
        const userData = userRes.data.data;
        if (!userData || typeof userData !== "object") {
          throw new Error("Invalid user data received from server.");
        }
        setCurrentUser(userData);

        const usersRes = await axiosInstance.get(`${API_BASE}/users/list`);
        setUsers(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);

        const productsRes = await axiosInstance.get(`${API_BASE}/product/list`);
        setProducts(Array.isArray(productsRes.data.data) ? productsRes.data.data : []);

        // Determine available tabs based on user role
        const availableTabs = [];
        if (userData?.role_user === "ADMIN" || userData?.role_user === "ROOT") {
          availableTabs.push("users");
        }
        if (userData?.role_user === "ADMIN" || userData?.role_user === "ROOT" || userData?.role_user === "USER") {
          availableTabs.push("products");
        }
        availableTabs.push("table");
        availableTabs.push("locations");
        availableTabs.push("factories");
        if (userData?.role_user !== "GUEST") {
          availableTabs.push("dashboard");
        }

        // Check if the saved tab is available, otherwise default to the first available tab
        const savedTab = localStorage.getItem('selectedTab');
        if (savedTab && availableTabs.includes(savedTab)) {
          setSelectedTab(savedTab);
        } else if (availableTabs.length > 0) {
          setSelectedTab(availableTabs[0]);
        } else {
            // If no tabs are available, default to a specific message or handle as needed
            // For now, just set to null or an empty string to indicate no tab is selected/available
            setSelectedTab(null); // Or setSelectedTab(''); depending on desired behavior
        }

      } catch (err) {
        setError(err.response?.data?.comment || "Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleUpdateProfile = async (updatedData) => {
    try {
      await axiosInstance.patch(`${API_BASE}/users/upd`, updatedData);
      const userRes = await axiosInstance.get(`${API_BASE}/users/profile`);
      setCurrentUser(userRes.data.data);
      alert("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      console.error("Update profile failed:", err.response?.data || err.message);
      alert(err.response?.data?.comment || "Không thể cập nhật thông tin cá nhân.");
    }
  };

  const handleChangePassword = async (passwordData) => {
    const backendPasswordData = {
      old_password: passwordData.oldPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    };
    try {
      await axiosInstance.patch(`${API_BASE}/users/updPwd`, backendPasswordData);
      alert("Đổi mật khẩu thành công!");
    } catch (err) {
      console.error("Change password failed:", err.response?.data || err.message);
      alert(err.response?.data?.comment || "Không thể đổi mật khẩu.");
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post(`${API_BASE}/users/sign-out`);
      removeAccessToken();
      setCurrentUser(null);
      setUsers([]);
      setProducts([]);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.comment || "Đăng xuất thất bại.");
    }
  };

  useEffect(() => {
    // Save selected tab to localStorage whenever it changes
    if (selectedTab) { // Only save if a tab is selected
      localStorage.setItem('selectedTab', selectedTab);
    }
  }, [selectedTab]);

  if (error) {
    return (
      <Typography className="text-center mt-8 text-red-500">
        {error}
      </Typography>
    );
  }

  if (loadingUser || !currentUser) {
    return (
      <Typography className="text-center mt-8">
        Đang tải dữ liệu...
      </Typography>
    );
  }

  const canManageUsers = currentUser?.role_user === "ADMIN" || currentUser?.role_user === "ROOT";
  const canManageProducts =
    currentUser?.role_user === "ADMIN" ||
    currentUser?.role_user === "ROOT" ||
    currentUser?.role_user === "USER";
  const canViewDashboard = currentUser?.role_user !== "GUEST";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h3">Thiên Tân Server</Typography>
        {currentUser && (
          <UserProfile
            user={currentUser}
            onUpdate={handleUpdateProfile}
            onLogout={handleLogout}
            onChangePassword={handleChangePassword}
          />
        )}
      </div>

      {!loadingUser && currentUser && (
        <Tabs value={selectedTab} onChange={(e, value) => setSelectedTab(value)}>
          <TabsHeader>
            {canManageUsers && <Tab value="users">Quản lý người dùng</Tab>}
            {canManageProducts && <Tab value="products">Quản lý sản phẩm</Tab>}
            <Tab value="table">Danh sách sản phẩm</Tab>
            <Tab value="locations">Quản lý địa điểm</Tab>
            <Tab value="factories">Quản lý nhà máy</Tab>
            {canViewDashboard && <Tab value="dashboard">Dashboard</Tab>}
          </TabsHeader>

          <TabsBody className="z-[999]">
            {canManageUsers && (
              <TabPanel value="users">
                <UserManagement
                  users={users}
                  setUsers={setUsers}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  selectedTab={selectedTab}
                />
              </TabPanel>
            )}

            {canManageProducts && (
              <TabPanel value="products">
                <ProductManagement products={products} setProducts={setProducts} selectedTab={selectedTab} />
              </TabPanel>
            )}

            <TabPanel value="table">
              <Table products={products} setProducts={setProducts} selectedTab={selectedTab} />
            </TabPanel>

            <TabPanel value="locations">
              <LocationManagement selectedTab={selectedTab} />
            </TabPanel>

            <TabPanel value="factories">
              <FactoriesManagement selectedTab={selectedTab} />
            </TabPanel>

            {canViewDashboard && (
              <TabPanel value="dashboard" className="overflow-hidden">
                <Dashboard products={products} selectedTab={selectedTab} />
              </TabPanel>
            )}
          </TabsBody>
        </Tabs>
      )}
    </div>
  );
};

export { axiosInstance };
export default AppServer;