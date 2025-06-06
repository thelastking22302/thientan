import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Typography, Input, Button, Textarea } from "@material-tailwind/react";
import { getAccessToken } from "../utils/tokenMemory";

const toProperCase = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const ProductManagement = ({ selectedTab, products, setProducts }) => {
  const [productForm, setProductForm] = useState({
    title: '',
    year_product: '',
    status: '',
    image: null,
    video: null,
    describe_product: '',
    name_factory: '',
  });
  const [showToast, setShowToast] = useState({ visible: false, message: '', isError: false });

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Thiết lập kết nối WebSocket
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setShowToast({ visible: true, message: 'Vui lòng đăng nhập để kết nối WebSocket!', isError: true });
      return;
    }

    if (selectedTab === 'products') { // Only connect if this tab is selected
      const wsUrl = `ws://localhost:8000/ws/product?authorization=Bearer%20${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setShowToast({ visible: true, message: 'WebSocket sản phẩm đã kết nối!', isError: false });
        socket.send(JSON.stringify({ event: 'subscribe', data: 'products-room' }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.event) {
            case 'subscribed':
              setShowToast({ visible: true, message: 'Đã kết nối WebSocket!', isError: false });
              break;
            case 'product:created':
              const newProduct = message.data;
              setProducts((prev) => [...(prev || []), { // Update state directly
                product_id: newProduct.product_id || Date.now(),
                title: toProperCase(newProduct.title),
                year_product: newProduct.year_product, // Keep original format
                status: toProperCase(newProduct.status),
                image: newProduct.image, // Keep raw image/video data
                video: newProduct.video,
                describe_product: newProduct.describe_product || newProduct.describe,
                name_factory: newProduct.name_factory, // Keep raw factory name
              }]);
              setShowToast({ visible: true, message: 'Sản phẩm mới được tạo!', isError: false });
              break;
            case 'product:updated':
              const updatedProduct = message.data;
              setProducts((prev) => // Update state directly
                prev.map((p) =>
                  p.product_id === updatedProduct.product_id
                    ? { // Merge updated fields while keeping existing if not provided
                        ...p,
                        title: toProperCase(updatedProduct.title),
                        year_product: updatedProduct.year_product, // Keep original format
                        status: toProperCase(updatedProduct.status),
                        image: updatedProduct.image, // Keep raw image/video data
                        video: updatedProduct.video,
                        describe_product: updatedProduct.describe_product || updatedProduct.describe,
                        name_factory: updatedProduct.name_factory, // Keep raw factory name
                      }
                    : p
                )
              );
              setShowToast({ visible: true, message: 'Sản phẩm đã được cập nhật!', isError: false });
              break;
            case 'product:deleted':
              const deletedProduct = message.data;
              setProducts((prev) => prev.filter((p) => p.product_id !== deletedProduct.product_id)); // Update state directly
              setShowToast({ visible: true, message: 'Sản phẩm đã được xóa!', isError: false });
              break;
            default:
              // Removed unhandled WebSocket event console output
          }
        } catch (err) {
          // Removed error parsing WebSocket message console output
        }
      };

      socket.onerror = (error) => {
        setShowToast({ visible: true, message: 'Lỗi kết nối WebSocket!', isError: true });
      };

      socket.onclose = () => {
        setShowToast({ visible: true, message: 'Mất kết nối WebSocket!', isError: true });
      };

      // Cleanup WebSocket on unmount or tab change away from this one
      return () => {
        socket.close();
      };
    } else {
      // Clean up function returns nothing when not connected
      return () => {};
    }
  }, [selectedTab, setProducts]); // Dependency array includes selectedTab and setProducts

  // Xử lý thêm sản phẩm
  const handleProductAdd = async () => {
    const { describe_product } = productForm;
    if (!describe_product) {
      setShowToast({ visible: true, message: 'Vui lòng nhập mô tả sản phẩm!', isError: true });
      return;
    }

    let formattedYear = null;
    if (productForm.year_product) {
      try {
        const date = new Date(productForm.year_product);
        formattedYear = date.toISOString();
      } catch (error) {
        setShowToast({ visible: true, message: 'Định dạng ngày không hợp lệ.', isError: true });
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', productForm.title || "");
    formData.append('status', productForm.status || "");
    formData.append('year_product', formattedYear || "");
    formData.append('describe_product', productForm.describe_product || "");
    formData.append('name_factory', productForm.name_factory || "");
    if (productForm.image) formData.append('image', productForm.image);
    if (productForm.video) formData.append('video', productForm.video);

    try {
      const token = getAccessToken();
      if (!token) throw new Error('Vui lòng đăng nhập để thực hiện thao tác này!');

      const response = await fetch('http://localhost:8000/thientancay/product/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // KHÔNG set Content-Type
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.comment || errorData.error || 'Không thể tạo sản phẩm');
      }

      setProductForm({
        title: '',
        year_product: '',
        status: '',
        image: null,
        video: null,
        describe_product: '',
        name_factory: '',
      });

      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';

      setShowToast({ visible: true, message: 'Tạo sản phẩm thành công!', isError: false });
    } catch (error) {
      setShowToast({ visible: true, message: error.message, isError: true });
    }
  };

  // Xử lý upload ảnh
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProductForm(prev => ({ ...prev, image: file }));
  };

  // Xử lý upload video
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setProductForm(prev => ({ ...prev, video: file }));
  };

  // Hiển thị thông báo
  useEffect(() => {
    if (showToast.visible) {
      const timer = setTimeout(() => setShowToast({ visible: false, message: '', isError: false }), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="max-h-[90vh] overflow-y-auto">
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

      {/* Form */}
      <Card className="mb-6 shadow-lg">
        <CardBody>
          <Typography variant="h5" className="mb-6">Thêm sản phẩm</Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Tiêu đề" value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} />
            <Input label="Năm sản xuất" type="date" value={productForm.year_product} onChange={e => setProductForm({ ...productForm, year_product: e.target.value })} />
            <Input label="Trạng thái" value={productForm.status} onChange={e => setProductForm({ ...productForm, status: e.target.value })} />
            <Input label="Tên nhà máy" value={productForm.name_factory} onChange={e => setProductForm({ ...productForm, name_factory: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex flex-col gap-2">
              <Input label="URL ảnh" value={productForm.image ? productForm.image.name || '' : ''} readOnly />
              <label htmlFor="imageUpload" className="border border-gray-500 px-4 py-2 rounded-md text-sm text-center cursor-pointer hover:bg-gray-50 transition">
                Tải ảnh từ máy
              </label>
              <input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={imageInputRef} />
            </div>

            <div className="flex flex-col gap-2">
              <Input label="URL video" value={productForm.video ? productForm.video.name || '' : ''} readOnly />
              <label htmlFor="videoUpload" className="border border-gray-500 px-4 py-2 rounded-md text-sm text-center cursor-pointer hover:bg-gray-50 transition">
                Tải video từ máy
              </label>
              <input id="videoUpload" type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" ref={videoInputRef} />
            </div>
          </div>

          <div className="mt-6">
            <Textarea label="Mô tả sản phẩm" value={productForm.describe_product} onChange={e => setProductForm({ ...productForm, describe_product: e.target.value })} required />
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={handleProductAdd}>Thêm sản phẩm</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProductManagement;
