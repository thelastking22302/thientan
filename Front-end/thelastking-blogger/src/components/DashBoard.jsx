import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getAccessToken } from "../utils/tokenMemory";

const defaultColors = [
  '#4ecdc4', '#ff6b6b', '#ffd166', '#8e44ad',
  '#36a2eb', '#a29bfe', '#e17055', '#00b894'
];

const extractGroupName = (title) => title ? title.split('-')[0].trim().toLowerCase() : '';

const renderCustomizedLabel = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, fill } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const percentValue = parseFloat(props.payload.percent);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontWeight="700"
      fontSize={14}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {percentValue.toFixed(1)}%
    </text>
  );
};

const Dashboard = ({ selectedTab }) => {
  const [products, setProducts] = useState([]);
  const [selectedGroupName, setSelectedGroupName] = useState('Tất cả');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState({ visible: false, message: '', isError: false });
  const [ws, setWs] = useState(null); // State to hold the WebSocket instance
  const [factories, setFactories] = useState([]); // New state for factories
  const [locations, setLocations] = useState([]); // New state for locations

  // Fetch factories from API using useCallback
  const fetchFactories = useCallback(async () => {
    try {
      const url = 'http://localhost:8000/thientancay/factory/list';
      const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        withCredentials: true,
      });
      if (response.status === 200 && Array.isArray(response.data)) {
        setFactories(response.data);
      } else {
        // Removed console error
        // Handle error or set empty array
        setFactories([]);
      }
    } catch (err) {
      // Removed console error
      setFactories([]);
    }
  }, []); // Empty dependency array for fetchFactories

  // Fetch locations from API using useCallback
  const fetchLocations = useCallback(async () => {
    try {
      const url = 'http://localhost:8000/thientancay/location/list';
      const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        withCredentials: true,
      });
      if (response.status === 200 && Array.isArray(response.data)) {
        setLocations(response.data);
      } else {
        // Removed console error
        // Handle error or set empty array
        setLocations([]);
      }
    } catch (err) {
      // Removed console error
      setLocations([]);
    }
  }, []); // Empty dependency array for fetchLocations

  // Fetch products from API (Declared earlier) - dependency updated to include factories and locations
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = 'http://localhost:8000/thientancay/product/list';
      const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
        withCredentials: true,
      });

      if (response.status !== 200) {
        throw new Error(response.data.comment || 'Không thể lấy danh sách sản phẩm.');
      }

      let data = response.data.items || response.data.data || response.data; // Xử lý nhiều trường hợp trả về
      if (!Array.isArray(data)) {
        data = [];
      }

      const mappedProducts = data.map(product => {
        // Ánh xạ name_factory và name_local bằng cách tra cứu từ danh sách đã fetch dựa trên IDs
        let factoryName = "Không xác định";
        let locationName = "Không xác định";

        // --- Logic để tìm tên nhà máy --- //
        // Giả định: ID nhà máy nằm trong product.factory_id
        const factoryId = product.factory_id; // Sử dụng factory_id theo cấu trúc backend
        const foundFactory = factories.find(f => f.factory_id === factoryId); // Tra cứu dựa trên factory_id
        if (foundFactory) {
            factoryName = foundFactory.name_factory || "Không xác định"; // Sử dụng name_factory từ factory object
        }

        // --- Logic để tìm tên địa điểm --- //
        // Giả định: ID địa điểm nằm trong product.location_id (hoặc thông qua factory nếu factory có location_id)
        let locationId = product.location_id; // Sử dụng location_id theo cấu trúc sản phẩm (nếu có)
        // Nếu sản phẩm không có location_id trực tiếp, thử lấy từ factory
        if (!locationId && foundFactory && foundFactory.location_id) {
             locationId = foundFactory.location_id;
        }

         const foundLocation = locations.find(l => l.location_id === locationId); // Tra cứu dựa trên location_id
         if (foundLocation) {
             locationName = foundLocation.name_local || "Không xác định"; // Sử dụng name_local từ location object
         }


        return {
          product_id: product.product_id,
          title: product.title || "N/A",
          image: product.image || null,
          video: product.video || null,
          describe: product.describe_product || product.describe || "N/A",
          year: product.year_product || product.year || null,
          name_factory: factoryName, // Sử dụng tên đã tra cứu
          name_local: locationName, // Sử dụng tên đã tra cứu
          status: product.status || "N/A",
        };
      });
      setProducts(mappedProducts);
      setShowToast({ visible: true, message: 'Dữ liệu Dashboard đã tải xong!', isError: false });
    } catch (err) {
      setError(err.message || "Không thể lấy danh sách sản phẩm.");
      setShowToast({ visible: true, message: 'Lỗi tải dữ liệu Dashboard!', isError: true });
    } finally {
      setLoading(false);
    }
  }, [factories, locations]); // Added factories and locations as dependencies

  // Effect for initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchFactories();
    fetchLocations();
  }, []); // Dependencies adjusted to run only once on mount

  // Function to update raw products state based on WebSocket events
  const updateRawProductsFromWebSocket = useCallback((message) => {
    try {
      const rawData = message.data;

      switch (message.event) {
        case 'product:created':
          setProducts(prev => {
            if (prev.some(p => p.product_id === rawData.product_id)) return prev;
            return [...(prev || []), rawData]; // Add raw data
          });
          // Removed fetch calls that caused loop
          // fetchFactories();
          // fetchLocations();
          // fetchProducts();
          break;
        case 'product:updated':
          setProducts(prev =>
            prev.map(p =>
              p.product_id === rawData.product_id
                ? rawData // Replace with raw updated data
                : p
            )
          );
          // Removed fetch calls that caused loop
          // fetchFactories();
          // fetchLocations();
          // fetchProducts();
          break;
        case 'product:deleted':
          setProducts(prev => prev.filter(p => p.product_id !== rawData.product_id));
          // Removed fetch calls that caused loop
          break;
        default:
      }
    } catch (err) {

    }
  }, [/* Removed dependencies that caused loop */]); 

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const wsUrl = `ws://localhost:8000/ws/product?authorization=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ event: 'subscribe', data: 'products-room' }));
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (["product:created", "product:updated", "product:deleted"].includes(message.event)) {
          fetchProducts();
        }
      } catch (e) {}
    };
    socket.onerror = () => {};
    socket.onclose = () => {};

    return () => {
      socket.close();
    };
  }, [fetchProducts]);

  // Effect to hide toast automatically after 5 seconds
  useEffect(() => {
    if (showToast.visible) {
      const timer = setTimeout(() => {
        setShowToast({ visible: false, message: '', isError: false });
      }, 5000); // Hide after 5000 milliseconds (5 seconds)

      // Cleanup function to clear the timer if the component unmounts or toast changes
      return () => clearTimeout(timer);
    }
  }, [showToast]); // Rerun effect when showToast state changes

  const groupNames = useMemo(() => {
    const names = Array.from(new Set(products.map(p => extractGroupName(p.title))));
    return ['Tất cả', ...names];
  }, [products]);

  const availableYears = useMemo(() => {
    const years = new Set(products.map(p => p.year ? new Date(p.year).getFullYear() : null).filter(year => year !== null));
    return ['Tất cả', ...Array.from(years).map(y => y.toString()).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesGroup = selectedGroupName === 'Tất cả' || extractGroupName(p.title) === selectedGroupName;
      const matchesYear = selectedYear === 'Tất cả' || (p.year && new Date(p.year).getFullYear().toString() === selectedYear);
      return matchesGroup && matchesYear;
    });
  }, [products, selectedGroupName, selectedYear]);

  const latestYear = useMemo(() => {
    const years = products.map(p => p.year ? new Date(p.year).getFullYear() : 0).filter(year => year !== 0);
    return years.length ? Math.max(...years) : new Date().getFullYear();
  }, [products]);

  const productStatsByYear = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesGroup = selectedGroupName === 'Tất cả' || extractGroupName(p.title) === selectedGroupName;
      const notDead = (p.status || '').toLowerCase() !== 'chết';
      return matchesGroup && notDead;
    });

    const countsByYear = filtered.reduce((acc, p) => {
      if (!p.year) return acc;
      const year = new Date(p.year).getFullYear();
      if (selectedYear !== 'Tất cả' && selectedYear !== year.toString()) return acc;
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countsByYear).map(([year, count]) => ({ year, count }));
  }, [products, selectedGroupName, selectedYear]);

  const productStatusStats = useMemo(() => {
    const stats = {};
    filteredProducts.forEach(p => {
      // Normalize status: trim whitespace and convert to lowercase
      const status = (p.status || 'Khác').trim().toLowerCase();
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  }, [filteredProducts]);

  const totalForPie = Object.values(productStatusStats).reduce((sum, v) => sum + v, 0);

  const pieData = Object.entries(productStatusStats).map(([status, count], i) => ({
    name: status, // Use normalized status for display name in pie chart legend
    value: count,
    percent: ((count / totalForPie) * 100).toFixed(1),
    color: defaultColors[i % defaultColors.length],
  }));

  const yearlyBreakdown = useMemo(() => {
    const byYear = {};
    products.forEach(p => {
      if (!p.year) return;
      const year = new Date(p.year).getFullYear();
      // Normalize status for yearly breakdown
      const status = (p.status || 'Khác').trim().toLowerCase();
      const productName = p.title; // Keep original product name

      const isDead = status === 'chết'; // Compare with normalized status
      if (!byYear[year]) byYear[year] = { total: 0, statuses: {} };
      if (!isDead) byYear[year].total++;

      if (!byYear[year].statuses[status]) byYear[year].statuses[status] = {};
      byYear[year].statuses[status][productName] = (byYear[year].statuses[status][productName] || 0) + 1;
    });

    return Object.entries(byYear).sort((a, b) => b[0] - a[0]);
  }, [products]);

  const factoryStats = useMemo(() => {
    const stats = {};
    filteredProducts.forEach(p => {
      const factory = p.name_factory || "Không xác định";
      if (!stats[factory]) {
        stats[factory] = { count: 0, trees: [] };
      }
      stats[factory].count += 1;
      // We still gather stats here, but the export logic will iterate filteredProducts directly
      stats[factory].trees.push({ title: p.title, year: p.year ? new Date(p.year).getFullYear() : 'N/A', status: p.status || 'N/A' });
    });
    return stats;
  }, [filteredProducts]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Trang 1: Thống kê theo năm và trạng thái
    // Generate headers based on normalized statuses from productStatusStats
    const yearlyHeaders = ['Năm', 'Tổng', ...Object.keys(productStatusStats)];
    const yearlyData = yearlyBreakdown.map(([year, data]) => [
      year,
      data.total,
      // Map data to headers using normalized status
      ...Object.keys(productStatusStats).map(status => {
        if (!data.statuses[status]) return 0;
        return Object.values(data.statuses[status]).reduce((a, b) => a + b, 0);
      }),
    ]);
    const yearlyWorksheetData = [yearlyHeaders, ...yearlyData];
    const yearlyWorksheet = XLSX.utils.aoa_to_sheet(yearlyWorksheetData);

    // Định dạng cho trang 1
    yearlyWorksheet['!cols'] = [
      { wpx: 80 },  // Cột Năm
      { wpx: 80 },  // Cột Tổng
      ...Object.keys(productStatusStats).map(() => ({ wpx: 120 })) // Các cột trạng thái
    ];
    yearlyHeaders.forEach((header, index) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: index });
      yearlyWorksheet[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4A90E2" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }
        }
      };
    });
    yearlyData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
        yearlyWorksheet[cellAddress].s = {
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
          }
        };
      });
    });

    XLSX.utils.book_append_sheet(workbook, yearlyWorksheet, 'Thống kê theo năm');

    // Trang 2: Thống kê chi tiết sản phẩm (bao gồm Nhà máy và Địa điểm)
    // Updated headers for detailed list
    const detailedHeaders = ['Nhà máy', 'Địa điểm', 'Tên cây', 'Năm', 'Trạng thái'];

    // Prepare data for the detailed list by iterating through filteredProducts
    const detailedData = filteredProducts.map(p => [
      p.name_factory || "Không xác định", // Nhà máy
      p.name_local || "Không xác định", // Địa điểm
      p.title, // Tên cây
      p.year ? new Date(p.year).getFullYear() : 'N/A', // Năm
      p.status || 'N/A' // Trạng thái
    ]);

    const detailedWorksheetData = [
      ["BÁO CÁO CHI TIẾT SẢN PHẨM"], // Tiêu đề
      [], // Dòng trống
      detailedHeaders,
      ...detailedData
    ];

    const detailedWorksheet = XLSX.utils.aoa_to_sheet(detailedWorksheetData);

    // Định dạng cho trang 2 (Detailed list)
    detailedWorksheet['!cols'] = [
      { wpx: 150 },  // Cột Nhà máy
      { wpx: 150 },  // Cột Địa điểm
      { wpx: 250 },  // Cột Tên cây
      { wpx: 80 },   // Cột Năm
      { wpx: 100 }   // Cột Trạng thái
    ];
    detailedWorksheet['!rows'] = [
      { hpx: 40 }, // Chiều cao tiêu đề
      { hpx: 10 }, // Chiều cao dòng trống
      { hpx: 30 }  // Chiều cao tiêu đề cột
    ];

    // Định dạng tiêu đề
    const titleCellDetailed = XLSX.utils.encode_cell({ r: 0, c: 0 });
    detailedWorksheet[titleCellDetailed].s = {
      font: { bold: true, sz: 16, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "D3EAFD" } }
    };
    // Merge title cell across all columns
    detailedWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: detailedHeaders.length - 1 } }];

    // Định dạng tiêu đề cột
    detailedHeaders.forEach((header, index) => {
      const cell = XLSX.utils.encode_cell({ r: 2, c: index });
      detailedWorksheet[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4A90E2" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }}
      };
    });

    // Định dạng dữ liệu rows (starting from row index 3)
    detailedData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 3, c: colIndex });
            detailedWorksheet[cellAddress] = detailedWorksheet[cellAddress] || {}; // Ensure cell exists
            detailedWorksheet[cellAddress].s = detailedWorksheet[cellAddress].s || {};
            detailedWorksheet[cellAddress].s.alignment = { vertical: "center", wrapText: true };
            detailedWorksheet[cellAddress].s.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
            if (colIndex >= 3) { // Năm and Trạng thái columns
                detailedWorksheet[cellAddress].s.alignment.horizontal = "center";
            }
        });
    });

    // Rename the second sheet for clarity
    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Chi tiết SP theo Nhà máy-ĐL');

    // Trang 3: Nhà máy theo Địa điểm
    const factoryByLocationHeaders = ['Địa điểm', 'Nhà máy'];
    const factoryByLocationData = [];

    // Group factories by location
    const factoriesGroupedByLocation = locations.reduce((acc, location) => {
        acc[location.Location_ID] = { name: location.NameLocal || "Không xác định", factories: [] };
        return acc;
    }, {});

    factories.forEach(factory => {
        const locationId = factory.Location_ID;
        if (factoriesGroupedByLocation[locationId]) {
            factoriesGroupedByLocation[locationId].factories.push(factory.NameFactory || "Không xác định");
        } else {
            // Handle factories with unknown locations if necessary
             if(!factoriesGroupedByLocation["unknown"]) {
                 factoriesGroupedByLocation["unknown"] = { name: "Địa điểm không xác định", factories: [] };
             }
             factoriesGroupedByLocation["unknown"].factories.push(factory.NameFactory || "Không xác định");
        }
    });

    // Prepare data for the sheet
    Object.entries(factoriesGroupedByLocation).forEach(([locationId, data]) => {
        if (data.factories.length > 0) { // Only include locations that have factories
             // Add location row
            factoryByLocationData.push([
                data.name, // Tên Địa điểm
                data.factories.join(", ") // Danh sách Nhà máy
            ]);
        }
    });


    const factoryByLocationWorksheetData = [
      ["DANH SÁCH NHÀ MÁY THEO ĐỊA ĐIỂM"], // Tiêu đề
      [], // Dòng trống
      factoryByLocationHeaders,
      ...factoryByLocationData
    ];

     const factoryByLocationWorksheet = XLSX.utils.aoa_to_sheet(factoryByLocationWorksheetData);

     // Định dạng cho Trang 3
     factoryByLocationWorksheet['!cols'] = [
         { wpx: 150 }, // Cột Địa điểm
         { wpx: 300 }  // Cột Nhà máy
     ];
      factoryByLocationWorksheet['!rows'] = [
       { hpx: 40 }, // Chiều cao tiêu đề
       { hpx: 10 }, // Chiều cao dòng trống
       { hpx: 30 }  // Chiều cao tiêu đề cột
     ];

     // Định dạng tiêu đề
    const titleCellFactoryByLocation = XLSX.utils.encode_cell({ r: 0, c: 0 });
    factoryByLocationWorksheet[titleCellFactoryByLocation].s = {
      font: { bold: true, sz: 16, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "D3EAFD" } }
    };
    // Merge title cell across all columns
    factoryByLocationWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: factoryByLocationHeaders.length - 1 } }];

     // Định dạng tiêu đề cột
    factoryByLocationHeaders.forEach((header, index) => {
      const cell = XLSX.utils.encode_cell({ r: 2, c: index });
      factoryByLocationWorksheet[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4A90E2" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" }}
      };
    });

    // Định dạng dữ liệu rows (starting from row index 3)
    factoryByLocationData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 3, c: colIndex });
            factoryByLocationWorksheet[cellAddress] = factoryByLocationWorksheet[cellAddress] || {}; // Ensure cell exists
            factoryByLocationWorksheet[cellAddress].s = factoryByLocationWorksheet[cellAddress].s || {};
            factoryByLocationWorksheet[cellAddress].s.alignment = { vertical: "center", wrapText: true };
            factoryByLocationWorksheet[cellAddress].s.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        });
    });

     XLSX.utils.book_append_sheet(workbook, factoryByLocationWorksheet, 'Nhà máy theo Địa điểm');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Thong_ke_san_pham_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) return <div className="p-4 text-center">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-500">Lỗi: {error}</div>;
  if (products.length === 0) return <div className="p-4 text-center">Không có sản phẩm nào để hiển thị.</div>;

  return (
    <div className="space-y-6 mt-6 max-h-[90vh] overflow-y-auto">
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

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Chọn loại sản phẩm</label>
          <select
            value={selectedGroupName}
            onChange={(e) => setSelectedGroupName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {groupNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Chọn năm</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 shadow rounded">
          <h3 className="font-semibold mb-2">Số lượng sản phẩm theo năm</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productStatsByYear}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h3 className="font-semibold mb-2">
            Trạng thái sản phẩm năm {selectedYear === 'Tất cả' ? latestYear : selectedYear}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={80}
                label={renderCustomizedLabel}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}: {entry.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold mb-2">Bảng thống kê theo năm và trạng thái (chi tiết sản phẩm)</h3>
        <table className="min-w-full text-sm text-left border border-gray-200 mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Năm</th>
              <th className="px-4 py-2 border-b">Tổng</th>
              {Object.keys(productStatusStats).map(status => (
                <th key={status} className="px-4 py-2 border-b">{status}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yearlyBreakdown.map(([year, data]) => (
              <tr key={year} className="border-t align-top">
                <td className="px-4 py-2">{year}</td>
                <td className="px-4 py-2">{data.total}</td>
                {Object.keys(productStatusStats).map(status => (
                  <td key={status} className="px-4 py-2 align-top">
                    {data.statuses[status] ? (
                      <ul className="list-none space-y-1 max-h-40 overflow-auto">
                        {Object.entries(data.statuses[status]).map(([productName, count]) => (
                          <li key={productName}>- <strong>{productName}</strong>: {count}</li>
                        ))}
                      </ul>
                    ) : (
                      0
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Xuất Excel
        </button>
        {yearlyBreakdown.length >= 2 && (() => {
          const [thisYear, lastYear] = yearlyBreakdown;
          const diff = thisYear[1].total - lastYear[1].total;
          return (
            <div className="text-xl font-medium text-gray-900 mt-4">
              So với năm {lastYear[0]}, tổng số sản phẩm năm {thisYear[0]} {diff === 0 ? 'giữ nguyên' : diff > 0 ? `tăng ${diff}` : `giảm ${Math.abs(diff)}`} sản phẩm.
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Dashboard;
