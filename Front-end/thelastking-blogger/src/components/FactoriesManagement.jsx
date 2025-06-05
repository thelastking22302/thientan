import React, { useState, useEffect, useCallback } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";
import { axiosInstance } from "../components/server";
import { getAccessToken } from "../utils/tokenMemory";

const API_BASE = "http://localhost:8000/thientancay/factory";
const LOCATION_BASE = "http://localhost:8000/thientancay/location"; // New endpoint for locations
const WS_URL = "ws://localhost:8000/ws/factory";
const WEBSOCKET_BASE_URL = "ws://localhost:8000/ws/location"; // WebSocket for locations

const FactoriesManagement = () => {
  const [factories, setFactories] = useState([]);
  const [locations, setLocations] = useState([]); // State for locations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const [locationWs, setLocationWs] = useState(null); // WebSocket for locations
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFactoryName, setNewFactoryName] = useState('');
  const [newFactoryLocation, setNewFactoryLocation] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]); // State for filtered locations
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentFactory, setCurrentFactory] = useState(null);
  const [editFactoryName, setEditFactoryName] = useState('');
  const [showToast, setShowToast] = useState({ visible: false, message: '', isError: false });

  const fetchFactories = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setFactories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`${API_BASE}/list`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setFactories(Array.isArray(res.data.data) ? [...res.data.data] : []);
    } catch (err) {
      setError("Lỗi tải nhà máy từ " + `${API_BASE}/list` + ": " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setLocations([]);
      return;
    }

    try {
      const res = await axiosInstance.get(`${LOCATION_BASE}/list`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setLocations(Array.isArray(res.data.data) ? [...res.data.data] : []);
    } catch (err) {
      setError("Lỗi tải địa điểm: " + (err.response?.data?.error || err.message));
    }
  }, []);

  useEffect(() => {
    fetchFactories();
    fetchLocations();

    const accessToken = getAccessToken();
    const websocketUrl = accessToken ? `${WS_URL}?authorization=Bearer ${encodeURIComponent(accessToken)}` : WS_URL;

    let socket;
    try {
      socket = new WebSocket(websocketUrl);
      setWs(socket);

      socket.onopen = () => {
        setShowToast({ visible: true, message: 'WebSocket nhà máy đã kết nối!', isError: false });
        socket.send(JSON.stringify({ event: "subscribe" }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event.startsWith("factory:")) {
            fetchFactories();
          }
        } catch (error) {
          // No need to log here as per the instructions
        }
      };

      socket.onerror = (error) => {
        setShowToast({ visible: true, message: 'Lỗi kết nối WebSocket nhà máy!', isError: true });
      };

      socket.onclose = (event) => {
        setWs(null);
        setShowToast({ visible: true, message: 'WebSocket nhà máy đã đóng kết nối.', isError: false });
      };
    } catch (err) {
      setShowToast({ visible: true, message: 'Không thể thiết lập kết nối WebSocket nhà máy.', isError: true });
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [fetchFactories]);

  // WebSocket for locations
  useEffect(() => {
    const accessToken = getAccessToken();
    const locationWebSocketUrl = accessToken ? `${WEBSOCKET_BASE_URL}?authorization=Bearer ${encodeURIComponent(accessToken)}` : WEBSOCKET_BASE_URL;

    let locationSocket;
    try {
      locationSocket = new WebSocket(locationWebSocketUrl);
      setLocationWs(locationSocket);

      locationSocket.onopen = () => {
        setShowToast({ visible: true, message: 'WebSocket địa điểm đã kết nối!', isError: false });
        locationSocket.send(JSON.stringify({ event: "subscribe" }));
      };

      locationSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event.startsWith("location:")) {
            fetchLocations(); // Fetch updated locations
          }
        } catch (error) {
          // No need to log here as per the instructions
        }
      };

      locationSocket.onerror = (error) => {
        setShowToast({ visible: true, message: 'Lỗi kết nối WebSocket địa điểm!', isError: true });
      };

      locationSocket.onclose = (event) => {
        setLocationWs(null);
        setShowToast({ visible: true, message: 'WebSocket địa điểm đã đóng kết nối.', isError: false });
      };
    } catch (err) {
      setShowToast({ visible: true, message: 'Không thể thiết lập kết nối WebSocket địa điểm.', isError: true });
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (locationSocket && locationSocket.readyState === WebSocket.OPEN) {
        locationSocket.close();
      }
    };
  }, []);

  // Effect to hide toast automatically after 5 seconds
  useEffect(() => {
    if (showToast.visible) {
      const timer = setTimeout(() => {
        setShowToast({ visible: false, message: '', isError: false });
      }, 5000); // Hide after 5000 milliseconds (5 seconds)

      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleCreateFactory = async (newFactoryData) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setShowToast({ visible: true, message: 'Vui lòng đăng nhập để tạo nhà máy.', isError: true });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post(`${API_BASE}/`, newFactoryData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setNewFactoryName('');
      setNewFactoryLocation('');
      handleCloseCreateModal();
      setShowToast({ visible: true, message: 'Đã gửi yêu cầu tạo nhà máy!', isError: false });
    } catch (err) {
      const errorMessage = err.response?.data?.comment || "Failed to create factory.";
      console.error("Failed to create factory:", err);
      setShowToast({ visible: true, message: errorMessage, isError: true });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFactory = async (factoryId, updatedData) => {
    const accessToken = getAccessToken();
    if (!accessToken || !factoryId) {
      setShowToast({ visible: true, message: 'Không có token hoặc ID nhà máy.', isError: true });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axiosInstance.patch(`${API_BASE}/upd/${factoryId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setCurrentFactory(null);
      handleCloseEditModal();
      setShowToast({ visible: true, message: 'Đã gửi yêu cầu cập nhật nhà máy!', isError: false });
    } catch (err) {
      const errorMessage = err.response?.data?.comment || "Failed to update factory.";
      console.error("Failed to update factory:", err);
      setShowToast({ visible: true, message: errorMessage, isError: true });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactory = async (factory) => {
    const accessToken = getAccessToken();
    if (!accessToken || !factory?.factory_id) {
      setShowToast({ visible: true, message: 'Không có token hoặc ID nhà máy.', isError: true });
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa nhà máy ${factory.name_factory}?`)) {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.delete(`${API_BASE}/del/${factory.factory_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.data?.comment === "Delete suscess!") {
          setShowToast({ visible: true, message: "Xóa nhà máy thành công!", isError: false });
        }
      } catch (err) {
        const errorMessage = err.response?.data?.comment || "Failed to delete factory.";
        console.error("Failed to delete factory:", err);
        setShowToast({ visible: true, message: errorMessage, isError: true });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewFactoryName('');
    setNewFactoryLocation('');
    setFilteredLocations([]); // Clear filtered locations
  };

  const handleOpenEditModal = (factory) => {
    setCurrentFactory(factory);
    setIsEditModalOpen(true);
    setEditFactoryName(factory.name_factory || '');
  };

  const handleCloseEditModal = () => {
    setCurrentFactory(null);
    setIsEditModalOpen(false);
    setEditFactoryName('');
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setNewFactoryLocation(value);

    // Filter locations based on the input value
    setFilteredLocations(
      locations.filter(location => location.name_local.toLowerCase().includes(value.toLowerCase()))
    );
  };

  if (loading) {
    return <Typography className="text-center mt-4">Loading factories...</Typography>;
  }

  if (error) {
    return <Typography className="text-center mt-4 text-red-500">{error}</Typography>;
  }

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-4">Quản lý nhà máy</Typography>
      <Button className="mb-4" onClick={handleOpenCreateModal}>Thêm nhà máy mới</Button>

      <ul>
        {factories.map((factory) => (
          factory && factory.factory_id && factory.name_factory ? (
            <li key={factory.factory_id} className="border-b py-2 flex justify-between items-center">
              {factory.name_factory}
              <div>
                <Button size="sm" variant="gradient" className="mr-2" onClick={() => handleOpenEditModal(factory)}>Edit</Button>
                <Button size="sm" color="red" variant="gradient" onClick={() => handleDeleteFactory(factory)}>Delete</Button>
              </div>
            </li>
          ) : null
        ))}
      </ul>

      <Dialog open={isCreateModalOpen} handler={handleCloseCreateModal} size="sm">
        <DialogHeader>Thêm nhà máy mới</DialogHeader>
        <DialogBody divider>
          <div className="grid gap-4">
            <Input
              type="text"
              label="Tên nhà máy"
              value={newFactoryName}
              onChange={(e) => setNewFactoryName(e.target.value)}
              required
            />
            <Input
              type="text"
              label="Tên địa điểm"
              value={newFactoryLocation}
              onChange={handleLocationInputChange}
              onFocus={() => setFilteredLocations(locations)} // Show suggestions when focused
              required
            />
            {filteredLocations.length > 0 && (
              <ul className="absolute bg-white border border-gray-300 z-10 mt-1 rounded-md w-full">
                {filteredLocations.map(location => (
                  <li
                    key={location.location_id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setNewFactoryLocation(location.name_local);
                      setFilteredLocations([]); // Clear suggestions after selection
                    }}
                  >
                    {location.name_local}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="blue-gray" onClick={handleCloseCreateModal} className="mr-1">
            Hủy
          </Button>
          <Button variant="gradient" color="green" onClick={async () => {
            await handleCreateFactory({ name_factory: newFactoryName, name_local: newFactoryLocation });
          }}>
            Tạo nhà máy
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={isEditModalOpen} handler={handleCloseEditModal} size="sm">
        <DialogHeader>Sửa nhà máy</DialogHeader>
        <DialogBody divider>
          <div className="grid gap-4">
            <Input
              type="text"
              label="Tên nhà máy"
              value={editFactoryName}
              onChange={(e) => setEditFactoryName(e.target.value)}
              required
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="blue-gray" onClick={handleCloseEditModal} className="mr-1">
            Hủy
          </Button>
          <Button variant="gradient" color="green" onClick={async () => {
            if (currentFactory) {
              await handleUpdateFactory(currentFactory.factory_id, { name_factory: editFactoryName });
            }
          }}>
            Cập nhật
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default FactoriesManagement;