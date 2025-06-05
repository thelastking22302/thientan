import React, { useState, useEffect, useCallback } from "react";
import { Typography, Button, Input } from "@material-tailwind/react";
import { axiosInstance } from "./server"; // Import axiosInstance as a named import
import { getAccessToken } from "../utils/tokenMemory";

const API_BASE = "http://localhost:8000/thientancay";
const WEBSOCKET_BASE_URL = "ws://localhost:8000/ws/location";

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [showToast, setShowToast] = useState({ visible: false, message: '', isError: false });

  // Fetch locations using useCallback
  const fetchLocations = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`${API_BASE}/location/list`);
      setLocations(Array.isArray(res.data.data) ? [...res.data.data] : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.comment || "Failed to fetch locations.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setLocations]); // Dependencies for useCallback

  // Effect for WebSocket connection and initial data fetch
  useEffect(() => {
    fetchLocations();

    // Setup WebSocket
    const accessToken = getAccessToken();
    const websocketUrl = accessToken ? `${WEBSOCKET_BASE_URL}?authorization=Bearer ${accessToken}` : WEBSOCKET_BASE_URL;
    const websocket = new WebSocket(websocketUrl);
    setWs(websocket);

    websocket.onopen = () => {
      setShowToast({ visible: true, message: 'WebSocket địa điểm đã kết nối!', isError: false });
      websocket.send(JSON.stringify({ event: "subscribe" }));
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event.startsWith("location:")) {
            fetchLocations(); // Refetch the list
        }
      } catch (error) {
        // No need to log here as per the instructions
      }
    };

    websocket.onerror = (error) => {
      setShowToast({ visible: true, message: 'Lỗi kết nối WebSocket địa điểm!', isError: true });
    };

    websocket.onclose = (event) => {
      setWs(null); // Clear socket instance from state
      setShowToast({ visible: true, message: 'WebSocket địa điểm đã đóng kết nối.', isError: false });
    };

    // Cleanup WebSocket on unmount
    return () => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [fetchLocations]); // Dependency array includes fetchLocations

  // Effect to hide toast automatically after 3 seconds
  useEffect(() => {
    if (showToast.visible) {
      const timer = setTimeout(() => {
        setShowToast({ visible: false, message: '', isError: false });
      }, 5000); // Hide after 5000 milliseconds (5 seconds)

      // Cleanup function to clear the timer if the component unmounts or toast changes
      return () => clearTimeout(timer);
    }
  }, [showToast]); // Rerun effect when showToast state changes

  // Effect to log locations state after it changes (for debugging, will remove later)
  useEffect(() => {
    // console.log("Locations state updated:", locations);
  }, [locations]);

  // Placeholder functions for CRUD operations
  const handleCreateLocation = async (newLocationData) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        // console.error("Access token not found. Please log in."); // Removed console output
        alert("You need to be logged in to create a location.");
        return;
      }
      await axiosInstance.post(`${API_BASE}/location/`, { name_local: newLocationName }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setNewLocationName(''); // Clear input field on success
      handleCloseCreateModal(); // Close modal on success
    } catch (err) {
      // console.error("Create location failed:", err.response?.data || err.message); // Removed console output
      alert(err.response?.data?.comment || "Failed to create location.");
    }
  };

  const handleUpdateLocation = async (locationId, updatedData) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        // console.error("Access token not found. Please log in."); // Removed console output
        alert("You need to be logged in to update a location.");
        return;
      }
      await axiosInstance.patch(`${API_BASE}/location/upd/${locationId}`, { name_local: editLocationName }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setCurrentLocation(null); // Clear current location
      handleCloseEditModal(); // Close modal on success
    } catch (err) {
      // console.error("Update location failed:", err.response?.data || err.message); // Removed console output
      alert(err.response?.data?.comment || "Failed to update location.");
    }
  };

  const handleDeleteLocation = async (location) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa địa điểm ${location.name_local}?`)) {
      try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          // console.error("Access token not found. Please log in."); // Removed console output
          alert("You need to be logged in to delete a location.");
          return;
        }
        await axiosInstance.delete(`${API_BASE}/location/del/${location.location_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // WebSocket will trigger a refetch
        // console.log(`Location ${location.name_local} deleted, waiting for WebSocket update.`); // Removed console output
      } catch (err) {
        // console.error("Delete location failed:", err.response?.data || err.message); // Removed console output
        alert(err.response?.data?.comment || "Failed to delete location.");
      }
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    // Optionally clear form fields when closing the modal without saving
    setNewLocationName('');
  };

  const handleOpenEditModal = (location) => {
    setCurrentLocation(location);
    setEditLocationName(location.name_local || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setCurrentLocation(null);
    setEditLocationName('');
    setIsEditModalOpen(false);
  };

  if (loading) {
    return <Typography className="text-center mt-4">Loading locations...</Typography>;
  }

  if (error) {
    return <Typography className="text-center mt-4 text-red-500">{error}</Typography>;
  }

  return (
    <div className="p-4">
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

      <Typography variant="h4" className="mb-4">Location Management</Typography>
      {/* Add form/modal for creating location here */}
      <Button className="mb-4" onClick={handleOpenCreateModal}>Thêm địa điểm mới</Button>

      {/* Display locations list here (e.g., using a Table component) */}
      {/* Example basic list: */}
      <ul>
        {locations.map((loc) => (
           // Ensure location object and properties exist before accessing
           loc && loc.location_id && loc.name_local ? (
            <li key={loc.location_id} className="border-b py-2 flex justify-between items-center">
              {loc.name_local}
              <div>
                <Button size="sm" variant="gradient" className="mr-2" onClick={() => handleOpenEditModal(loc)}>Edit</Button>
                <Button size="sm" color="red" variant="gradient" onClick={() => handleDeleteLocation(loc)}>Delete</Button>
              </div>
            </li>
           ) : null
        ))}
      </ul>

      {/* Add form/modal for updating location here */}

      {/* Basic Create Location Modal Structure */}
      {isCreateModalOpen && (
        <div className="modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div className="modal-content"
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
              minWidth: '300px',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <span className="close"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={handleCloseCreateModal}
            >&times;</span>
            <h2>Thêm địa điểm mới</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleCreateLocation(); // Call with data from state
            }}>
              <div className="mt-6">
                <Input
                  type="text"
                  label="Tên địa điểm"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <Button type="submit">Tạo địa điểm</Button>
                <Button variant="outlined" onClick={handleCloseCreateModal}>Hủy</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Basic Edit Location Modal Structure */}
      {isEditModalOpen && currentLocation && (
        <div className="modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div className="modal-content"
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              position: 'relative',
              minWidth: '300px',
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <span className="close"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '24px',
                cursor: 'pointer',
              }}
              onClick={handleCloseEditModal}
            >&times;</span>
            <h2>Sửa địa điểm</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (currentLocation) {
                // We will add handleUpdateLocation logic here in the next step
                await handleUpdateLocation(currentLocation.location_id, { name_local: editLocationName });
              }
            }}>
              <div className="mt-6">
                <Input
                  type="text"
                  label="Tên địa điểm"
                  value={editLocationName}
                  onChange={(e) => setEditLocationName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <Button type="submit">Cập nhật địa điểm</Button>
                <Button variant="outlined" onClick={handleCloseEditModal}>Hủy</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LocationManagement;
