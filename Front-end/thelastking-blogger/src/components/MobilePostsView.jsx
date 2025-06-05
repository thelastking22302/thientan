import { useState, useEffect } from "react";
import {
  Typography,
  Button,
} from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import BlogPostCard from "./BlogPostCard";
import FilterBar from "./FilterBar";

const MobilePostsView = ({
  posts,
  locations,
  factories,
  selectedLocation,
  setSelectedLocation,
  selectedFactoryId,
  setSelectedFactoryId,
  filters,
  setFilters,
  loading,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  // Lọc bài viết dựa trên filters
  const displayedPosts = posts.filter((post) => {
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
  });

  const handleSlide = (dir) => {
    setCurrentSlide((prev) => {
      if (dir === "left") return (prev - 1 + displayedPosts.length) % displayedPosts.length;
      if (dir === "right") return (prev + 1) % displayedPosts.length;
      return prev;
    });
  };

  return (
    <div className="sm:hidden w-full px-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between mt-2">
        <Typography variant="h6" className="font-semibold text-sm">
          Bộ sưu tập
        </Typography>
        <Button
          size="sm"
          variant="outlined"
          className="py-1 px-2 text-xs"
          onClick={() => setShowFilter((prev) => !prev)}
        >
          BỘ LỌC
        </Button>
      </div>

      {/* Tabs - Căn giữa */}
      <div className="flex justify-center gap-4 mb-4 overflow-x-auto no-scrollbar">
        {locations.map(({ location_id, name_local }) => (
          <button
            key={location_id}
            onClick={() => setSelectedLocation(location_id)}
            className={`text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
              location_id === selectedLocation
                ? "text-black border-pink-600"
                : "text-gray-400 border-transparent opacity-60"
            }`}
          >
            {name_local}
          </button>
        ))}
      </div>

      {showFilter && (
        <div className="mb-4">
          <FilterBar
            setFilters={setFilters}
            posts={posts}
            factories={factories}
            selectedFactoryId={selectedFactoryId}
            onFactoryChange={setSelectedFactoryId}
          />
        </div>
      )}

      {/* Carousel với 1 card */}
      <div className="relative mt-10 mb-4">
        {loading && <Typography className="text-center mt-4 text-sm">Đang tải sản phẩm...</Typography>}
        {!loading && displayedPosts.length > 0 && (
          <BlogPostCard {...displayedPosts[currentSlide]} /> // Loại bỏ hideImage
        )}
        {!loading && displayedPosts.length === 0 && (
          <Typography className="text-center mt-4 text-sm text-gray-500">
            Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
          </Typography>
        )}
        {!loading && displayedPosts.length > 1 && (
          <>
            <div
              className="absolute bg-white bg-opacity-60 rounded-2xl left-0 top-1/2 -translate-y-1/2 z-10 text-black px-2 animate-pulse select-none cursor-pointer"
              onClick={() => handleSlide("left")}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </div>
            <div
              className="absolute bg-white bg-opacity-60 rounded-2xl right-0 top-1/2 -translate-y-1/2 z-10 text-black px-2 animate-pulse select-none cursor-pointer"
              onClick={() => handleSlide("right")}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobilePostsView;