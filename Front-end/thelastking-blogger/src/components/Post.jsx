import {
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { useState, useEffect, useRef } from "react";
import BlogPostCard from "./BlogPostCard";
import FilterBar from "./FilterBar";
import MobilePostsView from "./MobilePostsView";
import { getAccessToken } from "../utils/tokenMemory";

const POSTS_PER_PAGE = 12;

export function Posts() {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [filters, setFilters] = useState({
    year: "",
    type: "",
    factory: "",
    media: "",
    status: "",
  });
  const filterRef = useRef(null);
  const dialogBodyRef = useRef(null);
  const dialogHeaderRef = useRef(null);

  const [factories, setFactories] = useState([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', isError: false });

  const handleOpenDetailDialog = (product) => {
    setSelectedProduct(product);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setSelectedProduct(null);
    setOpenDetailDialog(false);
  };

  useEffect(() => {
    if (openDetailDialog && dialogBodyRef.current) {
      setTimeout(() => {
        if (dialogBodyRef.current) {
          console.log("Setting scrollTop to 0");
          dialogBodyRef.current.scrollTop = 0;
        }
        if (dialogHeaderRef.current) {
          dialogHeaderRef.current.focus();
        }
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [openDetailDialog]);

  const fetchProducts = async (locationId, factoryId) => {
    setLoading(true);
    let url;
    try {
      const selectedLocationObj = locations.find((loc) => loc.location_id === locationId);
      const selectedLocationName = selectedLocationObj?.name_local;
      const selectedFactoryObj = factories.find((factory) => factory.factory_id === factoryId);
      const selectedFactoryName = selectedFactoryObj?.name_factory;

      if (factoryId && selectedFactoryName) {
        url = `http://localhost:8000/thientancay/product/list/by-factory?name_factory=${selectedFactoryName}`;
      } else if (locationId && selectedLocationName) {
        url = `http://localhost:8000/thientancay/product/list/by-local?name_local=${selectedLocationName}`;
      } else {
        url = "http://localhost:8000/thientancay/product/list";
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("API data", data);
      const validPosts = (data.data || data.products || []).filter((post) => {
        const isValid = post.title && post.status;
        if (!isValid) {
          console.warn("Invalid product data:", post);
        }
        return isValid;
      });
      console.log("Valid posts", validPosts);
      setPosts(validPosts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(selectedLocation, selectedFactoryId);

    fetch("http://localhost:8000/thientancay/location/list")
      .then((res) => res.json())
      .then((data) => {
        const sortedLocations = (data.data || []).sort((a, b) =>
          a.name_local.localeCompare(b.name_local)
        );
        setLocations(sortedLocations);
        if (sortedLocations.length > 0) {
          setSelectedLocation(sortedLocations[0].location_id);
        }
      })
      .catch((err) => console.error("Error fetching locations:", err));
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      setFactories([]);
      setSelectedFactoryId("");
      return;
    }
    const selectedLocationObj = locations.find((loc) => loc.location_id === selectedLocation);
    if (!selectedLocationObj || !selectedLocationObj.name_local) {
      console.error("Could not find location name for selected location ID:", selectedLocation);
      setFactories([]);
      setSelectedFactoryId("");
      return;
    }
    const fetchFactoriesByLocation = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/thientancay/factory/list/by-local?name_local=${selectedLocationObj.name_local}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const factoriesData = data.factories || data.data || [];
        console.log("Fetched factories for location:", selectedLocationObj.name_local, factoriesData);
        setFactories(factoriesData);
        setSelectedFactoryId("");
      } catch (err) {
        setFactories([]);
        setSelectedFactoryId("");
      }
    };
    fetchFactoriesByLocation();
  }, [selectedLocation, locations]);

  useEffect(() => {
    fetchProducts(selectedLocation, selectedFactoryId);
    setCurrentPage(1);
  }, [selectedFactoryId, factories, selectedLocation, locations]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      console.warn("No access token found for WebSocket connection.");
      return;
    }

    let socket;
    const wsUrl = `ws://localhost:8000/ws/product?authorization=Bearer ${encodeURIComponent(token)}`;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("WebSocket sản phẩm đã kết nối!");
        socket.send(JSON.stringify({ event: "subscribe", data: "products-room" }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (["product:created", "product:updated", "product:deleted"].includes(message.event)) {
            console.log(`Received WebSocket event: ${message.event}. Refetching products...`);
            fetchProducts(selectedLocation, selectedFactoryId);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
      };
    } catch (err) {
      console.error("Could not set up WebSocket connection:", err);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log("Cleaning up WebSocket connection.");
      }
    };
  }, [fetchProducts, selectedLocation, selectedFactoryId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const wsUrl = `ws://localhost:8000/ws/location?authorization=Bearer ${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ event: "subscribe" }));
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event.startsWith("location:")) {
          fetch("http://localhost:8000/thientancay/location/list")
            .then((res) => res.json())
            .then((data) => {
              const sortedLocations = (data.data || []).sort((a, b) =>
                a.name_local.localeCompare(b.name_local)
              );
              setLocations(sortedLocations);
              if (message.event === "location:deleted" && selectedLocation && !sortedLocations.find(l => l.location_id === selectedLocation)) {
                setSelectedLocation(sortedLocations[0]?.location_id || "");
              }
            });
          let msg = "";
          if (message.event === "location:created") msg = "Địa điểm mới đã được thêm!";
          if (message.event === "location:deleted") msg = "Một địa điểm đã bị xóa!";
          if (message.event === "location:updated") msg = "Địa điểm đã được cập nhật!";
          setToast({ visible: true, message: msg, isError: false });
        }
      } catch (e) {}
    };
    socket.onerror = () => {};
    socket.onclose = () => {};

    return () => {
      socket.close();
    };
  }, [selectedLocation]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ ...toast, visible: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const displayedPosts = posts
    .filter((post) => {
      const year = post.year_product ? new Date(post.year_product).getFullYear().toString() : "";
      const hasImage = post.image && post.image !== "";
      const hasVideo = post.video && post.video !== "";

      return (
        (!filters.year || year === filters.year) &&
        (!filters.type || post.title === filters.type) &&
        (!filters.media ||
          (filters.media === "Tất cả" && (hasImage || hasVideo)) ||
          (filters.media === "Chỉ ảnh" && hasImage) ||
          (filters.media === "Chỉ video" && hasVideo)) &&
        (!filters.status || filters.status === "Tất cả" || post.status === filters.status)
      );
    })
    .sort((a, b) => {
      const yearA = a.year_product ? new Date(a.year_product).getFullYear() : 0;
      const yearB = b.year_product ? new Date(b.year_product).getFullYear() : 0;
      return yearB - yearA; // Sắp xếp giảm dần theo năm
    });

  const totalPages = Math.ceil(displayedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = displayedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      if (filterRef.current) {
        filterRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <section className="lg:min-h-screen w-full">
      <div className="sm:hidden">
        <MobilePostsView
          posts={posts}
          locations={locations}
          factories={factories}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          selectedFactoryId={selectedFactoryId}
          setSelectedFactoryId={setSelectedFactoryId}
          filters={filters}
          setFilters={setFilters}
          loading={loading}
        />
      </div>

      <div className="hidden sm:grid place-items-center p-4 lg:p-8">
        <Typography variant="h6" className="mb-2 text-center">
          Thiên Tân Green
        </Typography>
        <Typography variant="h1" className="mb-2 text-center">
          Bộ sưu tập
        </Typography>
        <Typography
          variant="lead"
          color="gray"
          className="max-w-3xl mb-10 text-center text-gray-500 px-4 sm:px-0"
        >
          Hãy cùng nhau tham quan, thưởng thức và trải nghiệm những vẻ đẹp mang giá trị tinh thần trong bộ sưu tập của chúng tôi nhé!
        </Typography>

        <Tabs value={selectedLocation} className="mx-auto max-w-7xl w-full mb-16 relative overflow-visible">
          <div className="w-full flex mb-8 flex-col items-center">
            <TabsHeader
              className="h-12 w-full max-w-5xl mx-auto bg-gray-200 rounded-xl px-2 sm:px-6 py-2 flex flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide space-x-2 sm:space-x-6"
            >
              {locations.map(({ location_id, name_local }) => (
                <Tab
                  key={location_id}
                  value={location_id}
                  onClick={() => {
                    console.log("Selected location ID:", location_id);
                    setSelectedLocation(location_id);
                  }}
                >
                  {name_local}
                </Tab>
              ))}
            </TabsHeader>
            <div className="w-full max-w-3xl h-1 mt-3 mb-3 bg-gray-400" />
            <div ref={filterRef}>
              <FilterBar
                setFilters={setFilters}
                posts={posts}
                factories={factories}
                selectedFactoryId={selectedFactoryId}
                onFactoryChange={setSelectedFactoryId}
              />
            </div>
          </div>
        </Tabs>

        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {currentPosts.map((product) => {
            const { image, title, status, year_product, name_factory, describe_product, product_id, factory_id } = product;
            const productFactory = factories.find((factory) => factory.factory_id === factory_id);
            return (
              <BlogPostCard
                key={product_id}
                img={image}
                title={title}
                status={status}
                year={year_product ? new Date(year_product).getFullYear() : ""}
                factory={productFactory?.name_factory || "Loading..."}
                describe={describe_product}
                product={product}
                onClick={handleOpenDetailDialog}
              />
            );
          })}
        </div>

        <div className="flex justify-center items-center mt-12 flex-wrap gap-2 px-2 sm:px-0">
          <Button
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            &lt;
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={i + 1 === currentPage ? "filled" : "outlined"}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            &gt;
          </Button>
        </div>

        {loading && <Typography className="text-center mt-8">Đang tải sản phẩm...</Typography>}
        {!loading && displayedPosts.length === 0 && (
          <Typography className="text-center mt-8 text-gray-500">
            Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
          </Typography>
        )}
      </div>

      <Dialog open={openDetailDialog} handler={handleCloseDetailDialog} size="xl">
        <DialogHeader
          className="flex justify-between items-center text-3xl font-bold text-gray-900"
          ref={dialogHeaderRef}
          tabIndex={0}
        >
          {selectedProduct?.title}
        </DialogHeader>
        <DialogBody
          divider
          className="overflow-y-auto max-h-[75vh] space-y-4 text-gray-800"
          ref={dialogBodyRef}
        >
          <Typography variant="h6" className="text-xl font-semibold">
            Tình trạng: <span className="font-normal">{selectedProduct?.status || "Không xác định"}</span>
          </Typography>
          <Typography variant="h6" className="text-xl font-semibold">
            Năm: <span className="font-normal">
              {selectedProduct?.year_product ? new Date(selectedProduct.year_product).getFullYear() : "N/A"}
            </span>
          </Typography>
          <Typography variant="h6" className="text-xl font-semibold">
            Nhà máy: <span className="font-normal">
              {(() => {
                const factory = factories.find((factory) => factory.factory_id === selectedProduct?.factory_id);
                console.log("Looking up factory for product:", selectedProduct?.product_id, "Found factory:", factory);
                return factory?.name_factory || selectedProduct?.name_factory || "Không xác định";
              })()}
            </span>
          </Typography>
          <Typography variant="paragraph" className="text-lg leading-relaxed tracking-wide">
            {selectedProduct?.describe_product || "Không có mô tả"}
          </Typography>

          {selectedProduct?.image && (
            <div className="w-full h-[24rem] overflow-hidden rounded-lg shadow-lg mb-4">
              <img
                src={selectedProduct.image}
                alt={selectedProduct?.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {selectedProduct?.video && (
            <div className="mb-4">
              <video
                controls
                className="w-full h-auto rounded-lg shadow-md"
                autoPlay={false}
                muted={true}
                preload="metadata"
                tabIndex={-1}
              >
                <source src={selectedProduct.video} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={handleCloseDetailDialog}>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>

      {toast.visible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 text-green-800 px-4 py-2 rounded shadow">
          {toast.message}
        </div>
      )}
    </section>
  );
}

export default Posts;