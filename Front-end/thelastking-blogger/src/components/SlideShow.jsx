import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "https://images.unsplash.com/photo-1537724326059-2ea20251b9c8?q=80&w=1776&auto=format&fit=crop",
  "https://inkythuatso.com/uploads/thumbnails/800/2022/03/anh-lien-minh-huyen-thoai-4k-10-17-10-26-27.jpg",
  "https://gamek.mediacdn.vn/133514250583805952/2024/1/11/riot-stillhere-mv-tuonglmht-6-17049433708711950513758.jpg",
  "https://gamek.mediacdn.vn/133514250583805952/2024/9/24/yasuo-skin-1-1727148942603165090057.jpg",
  "https://cdnmedia.webthethao.vn/uploads/2021-10-07/yasuo-huyen-long-kiem.jpg"
];

function ImageSlider() {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);

  const paginate = (newDirection, isManual = true) => {
    setIndex((prev) => (prev + newDirection + images.length) % images.length);
    if (isManual) resetAutoSlide();
  };

  const startAutoSlide = () => {
    intervalRef.current = setInterval(() => paginate(1, false), 5000);
  };

  const resetAutoSlide = () => {
    clearInterval(intervalRef.current);
    startAutoSlide();
  };

  useEffect(() => {
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, []);

  const variants = {
    enter: {
      opacity: 0
    },
    center: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        delay:0,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      transition: {
      duration: 0.8,
      ease: "easeInOut"
     }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden rounded-none group">
      <AnimatePresence>
        <motion.img
          key={index}
          src={images[index]}
          alt={`Slide ${index}`}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Buttons hidden by default, visible on hover */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition"
      >
        ‹
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
            setIndex(i);
            resetAutoSlide();
           }}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
            i === index ? "bg-white scale-110" : "bg-white/40"
          }`}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageSlider;

// import React, { useState, useMemo, useEffect, useCallback } from 'react';
// import { PencilIcon } from '@heroicons/react/24/outline';
// import axios from 'axios';
// import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Typography, Input, Card } from "@material-tailwind/react";

// // Function to get the access token (Helper)
// const getAccessToken = () => localStorage.getItem('accessToken');

// // Accept products and a callback for changes
// const Table = ({ products, onProductChange }) => {
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [productToDelete, setProductToDelete] = useState(null);
//   const [editingProduct, setEditingProduct] = useState(null);

//   const [filterName, setFilterName] = useState('');
//   const [filterStatus, setFilterStatus] = useState('');
//   const [filterYear, setFilterYear] = useState('');
//   const [error, setError] = useState(null);

//   // Use useCallback for delete handler
//   const handleConfirmDelete = useCallback(async () => {
//     if (!productToDelete?.product_id) return; // Use product_id based on backend schema

//     const accessToken = getAccessToken();
//     if (!accessToken) {
//        setError("Không có token xác thực. Vui lòng đăng nhập lại.");
//        return;
//     }

//     try {
//       const response = await axios.delete(`/thientancay/product/del/${productToDelete.product_id}`, { // Use axios
//          headers: { Authorization: `Bearer ${accessToken}` }, // Include token
//          withCredentials: true,
//       });

//       if (response.status !== 200) { // Check axios response status
//          throw new Error(response.data?.comment || `Không thể xoá sản phẩm: ${response.status} ${response.statusText}`);
//       }

//       // Trigger re-fetch in parent component
//       if (onProductChange) {
//          onProductChange();
//       }
//       setProductToDelete(null);
//     } catch (err) {
//       console.error("Failed to delete product:", err);
//       setError(err.message);
//     }
//   }, [productToDelete, onProductChange]);

//   // Use useCallback for save edit handler
//   const handleSaveEdit = useCallback(async () => {
//     if (!editingProduct?.product_id) return; // Use product_id

//     const accessToken = getAccessToken();
//     if (!accessToken) {
//        setError("Không có token xác thực. Vui lòng đăng nhập lại.");
//        return;
//     }

//     const toTitleCase = (str) =>
//       str
//         .toLowerCase()
//         .split(' ')
//         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//         .join(' ');

//     // Prepare updated data based on backend req_users.ProductInput
//     const updatedData = {
//       title: editingProduct.title ? toTitleCase(editingProduct.title) : undefined, // Include if exists
//       status: editingProduct.status ? toTitleCase(editingProduct.status) : undefined, // Include if exists
//       image: editingProduct.image ?? editingProduct.imageUrl ?? editingProduct.fileImage, // Prefer fileImage > imageUrl > existing image
//       video: editingProduct.video ?? editingProduct.videoUrl ?? editingProduct.fileVideo, // Add video handling similar to image
//       describe_product: editingProduct.describe ?? editingProduct.describe_product, // Use describe_product based on backend
//       year_product: editingProduct.year ?? editingProduct.year_product, // Use year_product based on backend
//       name_factory: editingProduct.name_factory, // Assuming name_factory is part of editingProduct
//       // Note: Backend ProductInput uses pointers (*string, *time.Time). Check if axios handles undefined/null correctly or needs explicit nulls.
//       // For simplicity, sending undefined for missing optional fields is common with axios.
//     };
//      // Filter out undefined values before sending
//      Object.keys(updatedData).forEach(key => updatedData[key] === undefined && delete updatedData[key]);

//     try {
//       const response = await axios.patch(`/thientancay/product/upd/${editingProduct.product_id}`, updatedData, { // Use axios and product_id
//          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, // Include token
//          withCredentials: true,
//       });

//       if (response.status !== 200) { // Check axios response status
//          throw new Error(response.data?.comment || `Không thể cập nhật sản phẩm: ${response.status} ${response.statusText}`);
//       }

//       // Trigger re-fetch in parent component
//       if (onProductChange) {
//          onProductChange();
//       }
//       setEditingProduct(null);
//     } catch (err) {
//       console.error("Failed to save product edit:", err);
//       setError(err.message);
//     }
//   }, [editingProduct, onProductChange]);

//   // availableYears and filteredProducts should now use the products prop
//   const availableYears = useMemo(() => {
//     // Ensure products is an array before mapping
//     if (!Array.isArray(products)) return [];
//     const years = products.map(p => p.year ? new Date(p.year).getFullYear() : null).filter(year => year !== null); // Use p.year and filter nulls
//     return Array.from(new Set(years)).sort((a, b) => a - b);
//   }, [products]); // Depend on products prop

//   const filteredProducts = useMemo(() => {
//     // Ensure products is an array before filtering and sorting
//     if (!Array.isArray(products)) return [];

//     return [...products]
//       .filter(p => {
//         const matchName = p.title?.toLowerCase().includes(filterName.toLowerCase()) ?? false; // Handle potential null title
//         const matchStatus = filterStatus ? p.status?.toLowerCase() === filterStatus.toLowerCase() : true; // Handle potential null status
//         const productYear = p.year ? new Date(p.year).getFullYear().toString() : null; // Use p.year
//         const matchYear = filterYear ? productYear === filterYear : true;
//         return matchName && matchStatus && matchYear;
//       })
//       // Sort by year_product descending, then title ascending
//       .sort((a, b) => {
//           const yearA = a.year ? new Date(a.year).getFullYear() : 0; // Use 0 or some default for sorting if year is null
//           const yearB = b.year ? new Date(b.year).getFullYear() : 0;
//           if (yearB !== yearA) {
//               return yearB - yearA;
//           }
//           return a.title?.localeCompare(b.title ?? '') ?? 0; // Sort by title if years are same, handle null titles
//       });
//   }, [products, filterName, filterStatus, filterYear]); // Depend on products prop

//   if (error) return <div className="p-4 text-red-500">Lỗi: {error}</div>;

//   return (
//     <div className="p-4 bg-white shadow rounded space-y-4 max-h-[80vh] overflow-y-auto">
//       <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>

//       <div className="flex flex-wrap gap-4 mb-4">
//         <div className="w-72">
//           <Input
//             type="text"
//             label="Tìm theo tên"
//             value={filterName}
//             onChange={(e) => setFilterName(e.target.value)}
//           />
//         </div>
//         <div className="w-72">
//           <select
//             label="Trạng thái"
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="border px-3 py-2 rounded-md w-full h-[42px]"
//           >
//             <option value="">Tất cả trạng thái</option>
//             <option value="Tốt">Tốt</option>
//             <option value="Chết">Chết</option>
//             <option value="Sâu bệnh">Sâu bệnh</option>
//           </select>
//         </div>
//         <div className="w-72">
//           <select
//             label="Năm"
//             value={filterYear}
//             onChange={(e) => setFilterYear(e.target.value)}
//             className="border px-3 py-2 rounded-md w-full h-[42px]"
//           >
//             <option value="">Tất cả năm</option>
//             {availableYears.map(year => (
//               <option key={year} value={year}>{year}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <Card className="h-full w-full overflow-scroll">
//         <table className="w-full min-w-max table-auto text-left">
//           <thead>
//             <tr>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                 <Typography
//                   variant="small"
//                   color="blue-gray"
//                   className="font-normal leading-none opacity-70"
//                 >
//                   Hình ảnh
//                 </Typography>
//               </th>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                  <Typography
//                    variant="small"
//                    color="blue-gray"
//                    className="font-normal leading-none opacity-70"
//                  >
//                    Video
//                  </Typography>
//                </th>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                 <Typography
//                   variant="small"
//                   color="blue-gray"
//                   className="font-normal leading-none opacity-70"
//                 >
//                   Tiêu đề
//                 </Typography>
//               </th>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                 <Typography
//                   variant="small"
//                   color="blue-gray"
//                   className="font-normal leading-none opacity-70"
//                 >
//                   Năm
//                 </Typography>
//               </th>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                 <Typography
//                   variant="small"
//                   color="blue-gray"
//                   className="font-normal leading-none opacity-70"
//                 >
//                   Trạng thái
//                 </Typography>
//               </th>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                  <Typography
//                    variant="small"
//                    color="blue-gray"
//                    className="font-normal leading-none opacity-70"
//                  >
//                    Mô tả
//                  </Typography>
//                </th>
//                <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography
//                     variant="small"
//                     color="blue-gray"
//                     className="font-normal leading-none opacity-70"
//                   >
//                     Nhà máy
//                   </Typography>
//                 </th>
//               <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                 <Typography
//                   variant="small"
//                   color="blue-gray"
//                   className="font-normal leading-none opacity-70"
//                 >
//                   Hành động
//                 </Typography>
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredProducts.map((p, index) => {
//               const isLast = index === filteredProducts.length - 1;
//               const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

//               return (
//                 <tr key={p.product_id}>
//                   <td className={classes}>
//                     {p.image && (
//                       <img
//                         src={p.image}
//                         alt="Product"
//                         className="w-12 h-12 rounded-full object-cover cursor-pointer"
//                         onClick={() => setSelectedImage(p.image)}
//                       />
//                     )}
//                   </td>
//                    <td className={classes}>
//                      {p.video && (
//                        <a href={p.video} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
//                          Xem video
//                        </a>
//                      )}
//                    </td>
//                   <td className={classes}>
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {p.title}
//                     </Typography>
//                   </td>
//                   <td className={classes}>
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {p.year ? new Date(p.year).toLocaleDateString() : 'N/A'}
//                     </Typography>
//                   </td>
//                   <td className={classes}>
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {p.status}
//                     </Typography>
//                   </td>
//                    <td className={classes}>
//                      <Typography variant="small" color="blue-gray" className="font-normal line-clamp-2">
//                        {p.describe_product}
//                      </Typography>
//                    </td>
//                     <td className={classes}>
//                       <Typography variant="small" color="blue-gray" className="font-normal">
//                         {p.name_factory}
//                       </Typography>
//                     </td>
//                   <td className={classes}>
//                     <div className="flex space-x-2">
//                       <Button
//                          size="sm"
//                          onClick={() => setEditingProduct({ ...p })}
//                          className="flex items-center gap-1"
//                       >
//                          <PencilIcon className="h-4 w-4" /> Sửa
//                        </Button>
//                       <Button
//                          size="sm"
//                          color="red"
//                          onClick={() => setProductToDelete(p)}
//                          className="flex items-center gap-1"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.93c-1.03 0-1.9-.618-2.241-1.543L4.5 7.591m15.804-.82a.75.75 0 00-.72-.93m0 0l-3.164-.578a1.5 1.5 0 00-1.485 1.06L9.176 19.52c-.16.866-.59 1.65-1.28 2.267M6.927 19.088c-.403.422-.927.633-1.571.633A1.5 1.5 0 014.5 20.25v-7.5A1.5 1.5 0 016 11.25h1.5v7.838zm5.007.422c.403.422.927.633 1.571.633A1.5 1.5 0 0112 20.25v-7.5a1.5 1.5 0 011.5-1.5H15v7.838z"
//                           />
//                         </svg>
//                         Xoá
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//          {!filteredProducts || filteredProducts.length === 0 && !error && (
//              <Typography className="text-center mt-4">Không tìm thấy sản phẩm nào.</Typography>
//          )}
//       </Card>

//       <Dialog open={!!selectedImage} handler={() => setSelectedImage(null)} size="sm">
//         <DialogBody divider>
//            <img src={selectedImage} alt="Product" className="max-w-full max-h-[80vh] object-contain" />
//         </DialogBody>
//          <DialogFooter>
//              <Button variant="text" color="blue-gray" onClick={() => setSelectedImage(null)}>Đóng</Button>
//          </DialogFooter>
//       </Dialog>

//       <Dialog open={!!productToDelete} handler={() => setProductToDelete(null)} size="sm">
//         <DialogHeader>Xác nhận xoá</DialogHeader>
//         <DialogBody divider>
//           Bạn có chắc là muốn xoá sản phẩm <b>{productToDelete?.title}</b> không?
//         </DialogBody>
//         <DialogFooter>
//           <Button variant="text" onClick={() => setProductToDelete(null)} color="blue-gray">Huỷ</Button>
//           <Button variant="gradient" color="red" onClick={handleConfirmDelete}>Xoá</Button>
//         </DialogFooter>
//       </Dialog>

//        <Dialog open={!!editingProduct} handler={() => setEditingProduct(null)} size="lg">
//          <DialogHeader>Chỉnh sửa sản phẩm</DialogHeader>
//          <DialogBody divider className="max-h-[70vh] overflow-y-auto">
//            <div className="grid gap-4">

//              <div>
//                <Typography variant="h6" className="mb-2">Hình ảnh</Typography>
//                <Input
//                  label="URL hình ảnh"
//                  type="text"
//                  value={editingProduct?.imageUrl ?? editingProduct?.image ?? ''}
//                  onChange={(e) => {
//                    const val = e.target.value;
//                    setEditingProduct(prev => ({
//                      ...prev,
//                      imageUrl: val === '' ? null : val,
//                      fileImage: null,
//                    }));
//                  }}
//                />
//                <label className="block mt-2 text-sm font-medium cursor-pointer text-blue-600 hover:underline">
//                  Hoặc tải file ảnh từ máy
//                  <input
//                    type="file"
//                    accept="image/*"
//                    className="hidden"
//                    onChange={(e) => {
//                      if (e.target.files && e.target.files[0]) {
//                        const file = e.target.files[0];
//                        const reader = new FileReader();
//                        reader.onload = (ev) => {
//                          setEditingProduct(prev => ({
//                            ...prev,
//                            fileImage: ev.target.result,
//                            imageUrl: null,
//                          }));
//                        };
//                        reader.readAsDataURL(file);
//                      }
//                    }}
//                  />
//                </label>
//                 {(editingProduct?.fileImage || editingProduct?.imageUrl || editingProduct?.image) && (
//                    <img
//                      src={editingProduct.fileImage || editingProduct.imageUrl || editingProduct.image}
//                      alt="Preview"
//                      className="w-24 h-24 object-cover mt-4 rounded"
//                    />
//                  )}
//              </div>

//              <div>
//                <Typography variant="h6" className="mb-2">Video</Typography>
//                <Input
//                  label="URL video"
//                  type="text"
//                  value={editingProduct?.videoUrl ?? editingProduct?.video ?? ''}
//                  onChange={(e) => {
//                    const val = e.target.value;
//                    setEditingProduct(prev => ({
//                      ...prev,
//                      videoUrl: val === '' ? null : val,
//                      fileVideo: null,
//                    }));
//                  }}
//                />
//                <label className="block mt-2 text-sm font-medium cursor-pointer text-blue-600 hover:underline">
//                  Hoặc tải file video từ máy
//                  <input
//                    type="file"
//                    accept="video/*"
//                    className="hidden"
//                    onChange={(e) => {
//                      if (e.target.files && e.target.files[0]) {
//                        const file = e.target.files[0];
//                        const reader = new FileReader();
//                        reader.onload = (ev) => {
//                          setEditingProduct(prev => ({
//                            ...prev,
//                            fileVideo: ev.target.result,
//                            videoUrl: null,
//                          }));
//                        };
//                        reader.readAsDataURL(file);
//                      }
//                    }}
//                  />
//                </label>
//                 {(editingProduct?.fileVideo || editingProduct?.videoUrl || editingProduct?.video) && (
//                    <Typography variant="small" className="mt-2">
//                      Đã chọn file video hoặc URL video.
//                    </Typography>
//                  )}
//              </div>

//              <div>
//                <Typography variant="h6" className="mb-2">Tiêu đề</Typography>
//                <Input
//                  label="Tiêu đề sản phẩm"
//                  type="text"
//                  value={editingProduct?.title ?? ''}
//                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
//                />
//              </div>

//               <div>
//                 <Typography variant="h6" className="mb-2">Mô tả</Typography>
//                 <Input
//                   label="Mô tả sản phẩm"
//                   type="text"
//                   value={editingProduct?.describe_product ?? ''}
//                   onChange={(e) => setEditingProduct({ ...editingProduct, describe_product: e.target.value })}
//                 />
//               </div>

//              <div>
//                <Typography variant="h6" className="mb-2">Năm</Typography>
//                <Input
//                  label="Năm sản xuất"
//                  type="date"
//                  value={editingProduct?.year ? editingProduct.year.split('T')[0] : editingProduct?.year_product ? editingProduct.year_product.split('T')[0] : ''}
//                  onChange={(e) => setEditingProduct({ ...editingProduct, year: e.target.value, year_product: e.target.value })}
//                />
//              </div>

//              <div>
//                <Typography variant="h6" className="mb-2">Trạng thái</Typography>
//                <Input
//                  label="Trạng thái sản phẩm"
//                  type="text"
//                  value={editingProduct?.status ?? ''}
//                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
//                />
//              </div>

//               <div>
//                 <Typography variant="h6" className="mb-2">Nhà máy</Typography>
//                 <Input
//                   label="Tên nhà máy"
//                   type="text"
//                   value={editingProduct?.name_factory ?? ''}
//                   onChange={(e) => setEditingProduct({ ...editingProduct, name_factory: e.target.value })}
//                 />
//               </div>

//            </div>
//          </DialogBody>
//          <DialogFooter>
//             <Button variant="text" onClick={() => setEditingProduct(null)} color="blue-gray">Huỷ</Button>
//             <Button variant="gradient" color="green" onClick={handleSaveEdit}>Lưu</Button>
//          </DialogFooter>
//        </Dialog>
//     </div>
//   );
// };

// export default Table;