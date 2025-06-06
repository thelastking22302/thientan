import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Typography, Input, Card } from "@material-tailwind/react";
import { getAccessToken } from "../utils/tokenMemory";

const Table = () => {
  const [products, setProducts] = useState([]); // Keep products state as raw data from API/WebSocket
  const [factories, setFactories] = useState([]); // factories state is needed for factoryMap
  const [selectedImage, setSelectedImage] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState({ visible: false, message: '', isError: false });

  // Fetch factories from API (Declared earlier)
  const fetchFactories = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Không có token xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    const url = 'http://localhost:8000/thientancay/factory/list';
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      if (response.status === 200) {
        setFactories(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        throw new Error(`Không thể lấy danh sách nhà máy: ${response.status}`);
      }
    } catch (err) {
      setError(`Lỗi tải nhà máy từ ${url}: ${err.message}`);
    }
  }, []); // No dependencies needed for fetching factories

  // Fetch products from API (Declared earlier)
  const fetchProducts = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Không có token xác thực. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    const url = 'http://localhost:8000/thientancay/product/list';
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      if (response.status === 200) {
        const rawProducts = Array.isArray(response.data.data) ? response.data.data : [];
        setProducts(rawProducts); // Set raw products data
      } else {
        throw new Error(`Không thể lấy danh sách sản phẩm: ${response.status}`);
      }
    } catch (err) {
      setError(`Lỗi tải sản phẩm từ ${url}: ${err.message}`);
    }
  }, []); // No dependencies on processing helper here

  // Create factoryMap to map factory_id to name_factory (Depends on factories, declared after fetchFactories)
  const factoryMap = useMemo(() => {
    const map = {};
    if (Array.isArray(factories)) {
      factories.forEach(factory => {
        if (factory?.factory_id && factory?.name_factory) {
          map[factory.factory_id] = factory.name_factory;
        }
      });
    }
    return map;
  }, [factories]); // factoryMap depends on factories state

  // Helper function to process raw product data (used after fetching/updating products AND factories)
  // This function needs access to the latest factoryMap. (Depends on factoryMap, declared after factoryMap)
  const processSingleProductData = useCallback((rawProduct) => {
    // Ensure data structure is consistent and look up factory name
    const processed = {
      product_id: rawProduct.product_id, // Use server ID
      title: rawProduct.title || "N/A",
      year_product: rawProduct.year_product, // Keep original format, will be parsed for display
      status: rawProduct.status || "N/A",
      image: rawProduct.image || null,
      video: rawProduct.video || null,
      describe_product: rawProduct.describe_product || rawProduct.describe || "N/A", // Backend might use describe or describe_product
      // Look up factory name using the latest factoryMap
      name_factory: rawProduct.factory_id && factoryMap[rawProduct.factory_id] ? factoryMap[rawProduct.factory_id] : rawProduct.name_factory || "N/A", // Prefer map lookup, fallback to name_factory if provided
      factory_id: rawProduct.factory_id || "N/A",
    };
    return processed;
  }, [factoryMap]); // Dependency on factoryMap is CRUCIAL here

  // Process the raw products data using the latest factoryMap whenever products or factories change
  // (Depends on products and processSingleProductData, declared after them)
  const processedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.map(p => processSingleProductData(p));
  }, [products, processSingleProductData]); // Depends on both products and the processing logic

  // Function to update raw products state based on WebSocket events
  // This function will receive raw data and update the raw products state.
  // (Depends on fetchFactories, declared after it)
  const updateRawProductsFromWebSocket = useCallback((message) => {
    try {
      const rawData = message.data;
      // No need to process here, processedProducts memo handles it.

      switch (message.event) {
        case 'product:created':
          setProducts(prev => {
            // Avoid adding duplicate if it's already fetched via initial load
            if (prev.some(p => p.product_id === rawData.product_id)) return prev;
            return [...(prev || []), rawData]; // Add raw data
          });
          // After adding a new product, ensure factories are fresh in case a new factory was used.
          fetchFactories(); // Refetch factories to update the map
          fetchProducts(); // Refetch products to ensure the latest data including relationships is available for processing
          break;
        case 'product:updated':
          setProducts(prev =>
            prev.map(p =>
              p.product_id === rawData.product_id
                ? rawData // Replace with raw updated data
                : p
            )
          );
          // Refetch factories on update too
          fetchFactories();
          fetchProducts(); // Refetch products to ensure the latest data is available for processing
          break;
        case 'product:deleted':
          setProducts(prev => prev.filter(p => p.product_id !== rawData.product_id));
          // No need to refetch factories or products on delete, the item is just removed.
          break;
        default:
      }
    } catch (err) {
      console.error('Error processing WebSocket message in Table.jsx:', err); // Keep console error
    }
  }, [fetchFactories, fetchProducts]); // Dependency on fetchFactories and fetchProducts

  // Fetch data on component mount and establish WebSocket connection
  // (Depends on fetchProducts, fetchFactories, updateRawProductsFromWebSocket, declared after them)
  useEffect(() => {
    // Initial data fetch
    Promise.all([fetchProducts(), fetchFactories()])
      .catch(err => {
        setError("Lỗi tải dữ liệu: " + err.message);
      })
      .finally(() => setLoading(false));

    // Setup WebSocket
    let socket;
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/product?authorization=Bearer ${encodeURIComponent(token)}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ event: 'subscribe', data: 'products-room' }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Update raw products state directly from the WebSocket message
        if (message.event.startsWith('product:')) {
            updateRawProductsFromWebSocket(message); // Use the useCallback'ed update function
        }
      } catch (err) {
        console.error('Error processing WebSocket message in Table.jsx:', err); // Keep console error
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error in Table.jsx:', error); // Keep console error
      // Optional: attempt to reconnect after a delay
    };

    socket.onclose = () => {
      // Optional: attempt to reconnect after a delay
    };

    // Clean up the WebSocket connection on component unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [fetchProducts, fetchFactories, updateRawProductsFromWebSocket]); // Dependencies: ensure effect reruns if fetch, factories fetch, or raw update logic changes

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

  // Filter and sort the PROCESSED products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(processedProducts)) return [];
    return [...processedProducts]
      .filter(p => {
        const matchName = p.title?.toLowerCase().includes(filterName.toLowerCase()) ?? false;
        const matchStatus = filterStatus ? p.status?.toLowerCase() === filterStatus.toLowerCase() : true;
        const productYear = p.year_product ? new Date(p.year_product).getFullYear().toString() : null;
        const matchYear = filterYear ? productYear === filterYear : true;
        return matchName && matchStatus && matchYear;
      })
      .sort((a, b) => {
        const yearA = a.year_product ? new Date(a.year_product).getFullYear() : 0;
        const yearB = b.year_product ? new Date(b.year_product).getFullYear() : 0;
        if (yearB !== yearA) {
          return yearB - yearA;
        }
        return a.title?.localeCompare(b.title ?? '') ?? 0;
      });
  }, [processedProducts, filterName, filterStatus, filterYear]); // Depends on processedProducts

  // Calculate available statuses from PROCESSED products
  const availableStatuses = useMemo(() => {
    if (!Array.isArray(processedProducts)) return [];
    const statuses = processedProducts
      .map(p => p.status)
      .filter(status => status != null);
    return Array.from(new Set(statuses)).sort();
  }, [processedProducts]); // Depends on processedProducts

  // Handle delete product
  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete?.product_id) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Không có token xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:8000/thientancay/product/del/${productToDelete.product_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      if (response.status !== 200) {
        throw new Error(response.data?.comment || `Không thể xoá sản phẩm: ${response.status} ${response.statusText}`);
      }

      // Refresh products after delete
      await fetchProducts();
      setProductToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  }, [productToDelete, fetchProducts]);

  // Handle save edit product
  const handleSaveEdit = useCallback(async () => {
    if (!editingProduct?.product_id) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Không có token xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    const formData = new FormData();
    formData.append('title', editingProduct.title || "");
    formData.append('status', editingProduct.status || "");
    formData.append('describe_product', editingProduct.describe_product || "");
    formData.append('name_factory', editingProduct.name_factory || "");
    if (editingProduct.year_product) {
      const formattedYear = new Date(editingProduct.year_product).toISOString();
      formData.append('year_product', formattedYear);
    }
    if (editingProduct.fileImage) formData.append('image', editingProduct.fileImage);
    if (editingProduct.fileVideo) formData.append('video', editingProduct.fileVideo);

    try {
      const response = await fetch(`http://localhost:8000/thientancay/product/upd/${editingProduct.product_id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` }, // KHÔNG set Content-Type
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.comment || errorData.error || 'Không thể cập nhật sản phẩm');
      }

      setEditingProduct(null);
    } catch (err) {
      setError(err.message);
    }
  }, [editingProduct]);

  // Calculate available years using PROCESSED products
  const availableYears = useMemo(() => {
    if (!Array.isArray(processedProducts)) return [];
    const years = processedProducts
      .map(p => (p.year_product ? new Date(p.year_product).getFullYear() : null))
      .filter(year => year !== null);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }, [processedProducts]); // Depends on processedProducts

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-500">Lỗi: {error}</div>;
  if (products.length === 0 && !loading) return <div className="p-4 text-center">Không tìm thấy sản phẩm nào.</div>; // Adjusted empty state message

  return (
    <div className="p-4 bg-white shadow rounded space-y-4 max-h-[80vh] overflow-y-auto">
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

      <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="w-72">
          <Input
            type="text"
            label="Tìm theo tên"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>
        <div className="w-72">
          <select
            label="Trạng thái"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border px-3 py-2 rounded-md w-full h-[42px]"
          >
            <option value="">Tất cả trạng thái</option>
            {availableStatuses.map((status, index) => (
              <option key={index} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="w-72">
          <select
            label="Năm"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border px-3 py-2 rounded-md w-full h-[42px]"
          >
            <option value="">Tất cả năm</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="h-full w-full overflow-scroll">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Hình ảnh
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Video
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Tiêu đề
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Năm
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Trạng thái
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Mô tả
                </Typography>
              </th>
              <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  Nhà máy
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
            {filteredProducts?.map((p, index) => { // Map over filteredProducts
              const isLast = index === filteredProducts.length - 1;
              const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

              return (
                <tr key={p.product_id}>
                  <td className={classes}>
                    {p.image && (
                      <img
                        src={p.image.startsWith('http') ? p.image : `http://localhost:8000/${p.image.replace(/^\/+/, '')}`}
                        alt="Product"
                        className="w-12 h-12 rounded-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(p.image.startsWith('http') ? p.image : `http://localhost:8000/${p.image.replace(/^\/+/, '')}`)}
                      />
                    )}
                  </td>
                  <td className={classes}>
                    {p.video && (
                      <a href={p.video} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Xem video
                      </a>
                    )}
                  </td>
                  <td className={classes}>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {p.title || 'N/A'}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {p.year_product ? new Date(p.year_product).getFullYear() : 'N/A'}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {p.status || 'N/A'}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography variant="small" color="blue-gray" className="font-normal line-clamp-2">
                      {p.describe_product || 'N/A'}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {p.factory_id && factoryMap[p.factory_id] ? factoryMap[p.factory_id] : p.name_factory || 'N/A'}
                    </Typography>
                  </td>
                  <td className={classes}>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => setEditingProduct({ ...p, factory_id: p.factory_id })}
                        className="flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" /> Sửa
                      </Button>
                      <Button
                        size="sm"
                        color="red"
                        onClick={() => setProductToDelete(p)}
                        className="flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.93c-1.03 0-1.9-.618-2.241-1.543L4.5 7.591m15.804-.82a.75.75 0 00-.72-.93m0 0l-3.164-.578a1.5 1.5 0 00-1.485 1.06L9.176 19.52c-.16.866-.59 1.65-1.28 2.267M6.927 19.088c-.403.422-.927.633-1.571.633A1.5 1.5 0 014.5 20.25v-7.5A1.5 1.5 0 016 11.25h1.5v7.838zm5.007.422c.403.422.927.633 1.571.633A1.5 1.5 0 0112 20.25v-7.5a1.5 1.5 0 011.5-1.5H15v7.838z"
                          />
                        </svg>
                        Xoá
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filteredProducts?.length && !error && (
          <Typography className="text-center mt-4">Không tìm thấy sản phẩm nào.</Typography>
        )}
      </Card>

      <Dialog open={!!selectedImage} handler={() => setSelectedImage(null)} size="sm">
        <DialogBody divider>
          <img src={selectedImage && (selectedImage.startsWith('http') ? selectedImage : `http://localhost:8000/${selectedImage.replace(/^\/+/, '')}`)} alt="Product" className="max-w-full max-h-[80vh] object-contain" />
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="blue-gray" onClick={() => setSelectedImage(null)}>Đóng</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!productToDelete} handler={() => setProductToDelete(null)} size="sm">
        <DialogHeader>Xác nhận xoá</DialogHeader>
        <DialogBody divider>
          Bạn có chắc là muốn xoá sản phẩm <b>{productToDelete?.title}</b> không?
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setProductToDelete(null)} color="blue-gray">Huỷ</Button>
          <Button variant="gradient" color="red" onClick={handleConfirmDelete}>Xoá</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={!!editingProduct} handler={() => setEditingProduct(null)} size="lg">
        <DialogHeader>Chỉnh sửa sản phẩm</DialogHeader>
        <DialogBody divider className="max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4">
            <div>
              <Typography variant="h6" className="mb-2">Hình ảnh</Typography>
              <Input
                label="URL hình ảnh"
                type="text"
                value={editingProduct?.imageUrl ?? editingProduct?.image ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingProduct(prev => ({
                    ...prev,
                    imageUrl: val === '' ? null : val,
                    fileImage: null,
                  }));
                }}
              />
              <label className="block mt-2 text-sm font-medium cursor-pointer text-blue-600 hover:underline">
                Hoặc tải file ảnh từ máy
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditingProduct(prev => ({
                        ...prev,
                        fileImage: e.target.files[0],
                        imageUrl: null,
                      }));
                    }
                  }}
                />
              </label>
              {(editingProduct?.fileImage || editingProduct?.imageUrl || editingProduct?.image) && (
                <img
                  src={editingProduct.fileImage || editingProduct.imageUrl || editingProduct.image}
                  alt="Preview"
                  className="w-24 h-24 object-cover mt-4 rounded"
                />
              )}
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Video</Typography>
              <Input
                label="URL video"
                type="text"
                value={editingProduct?.videoUrl ?? editingProduct?.video ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingProduct(prev => ({
                    ...prev,
                    videoUrl: val === '' ? null : val,
                    fileVideo: null,
                  }));
                }}
              />
              <label className="block mt-2 text-sm font-medium cursor-pointer text-blue-600 hover:underline">
                Hoặc tải file video từ máy
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditingProduct(prev => ({
                        ...prev,
                        fileVideo: e.target.files[0],
                        videoUrl: null,
                      }));
                    }
                  }}
                />
              </label>
              {(editingProduct?.fileVideo || editingProduct?.videoUrl || editingProduct?.video) && (
                <Typography variant="small" className="mt-2">
                  Đã chọn file video hoặc URL video.
                </Typography>
              )}
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Tiêu đề</Typography>
              <Input
                label="Tiêu đề sản phẩm"
                type="text"
                value={editingProduct?.title ?? ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
              />
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Mô tả</Typography>
              <Input
                label="Mô tả sản phẩm"
                type="text"
                value={editingProduct?.describe_product ?? ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, describe_product: e.target.value })}
              />
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Năm</Typography>
              <Input
                label="Năm sản xuất"
                type="date"
                value={editingProduct?.year_product ? editingProduct.year_product.split('T')[0] : ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, year_product: e.target.value })}
              />
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Trạng thái</Typography>
              <select
                label="Trạng thái sản phẩm"
                value={editingProduct?.status ?? ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                className="border px-3 py-2 rounded-md w-full h-[42px]"
              >
                <option value="">Chọn trạng thái</option>
                {availableStatuses.map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Nhà máy</Typography>
              <select
                label="Nhà máy"
                value={editingProduct?.factory_id ?? ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, factory_id: e.target.value })}
                className="border px-3 py-2 rounded-md w-full h-[42px]"
              >
                <option value="">Chọn nhà máy</option>
                {factories.map(factory => (
                  <option key={factory.factory_id} value={factory.factory_id}>
                    {factory.name_factory}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setEditingProduct(null)} color="blue-gray">Huỷ</Button>
          <Button variant="gradient" color="green" onClick={handleSaveEdit}>Lưu</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default Table;