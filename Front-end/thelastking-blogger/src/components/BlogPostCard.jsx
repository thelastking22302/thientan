import { Card, CardBody, Typography } from "@material-tailwind/react";

export default function BlogPostCard({
  img,
  title,
  status,
  year,
  factory,
  describe,
  product,
  onClick,
  hideImage, // Thêm prop hideImage
}) {
  const imageUrl = img || "placeholder-image-url";
  const safeTitle = title || "Không có tiêu đề";
  const safeStatus = status || "Không xác định";
  const safeYear = year || "N/A";
  const safeFactory = factory || "Không xác định";

  return (
    <Card
      className="w-full max-w-[26rem] shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={() => onClick(product)}
    >
      {/* Ẩn hình ảnh nếu hideImage là true */}
      {!hideImage && (
        <div className="w-full h-48 overflow-hidden">
          <img src={imageUrl} alt={safeTitle} className="w-full h-full object-cover" />
        </div>
      )}
      <CardBody>
        <Typography
          variant="h5"
          className="mb-2 text-xl font-bold text-gray-800 hover:text-blue-700 transition-colors truncate"
        >
          {safeTitle}
        </Typography>
        <Typography
          variant="small"
          className="mb-1 text-base font-semibold text-gray-600 hover:text-blue-600 transition-colors truncate"
        >
          Tình trạng: {safeStatus}
        </Typography>
        <Typography
          variant="small"
          className="mb-1 text-base font-semibold text-gray-600 hover:text-blue-600 transition-colors truncate"
        >
          Năm: {safeYear}
        </Typography>
        <Typography
          variant="small"
          className="mb-1 text-base font-semibold text-gray-600 hover:text-blue-600 transition-colors truncate"
        >
          Nhà máy: {safeFactory}
        </Typography>
      </CardBody>
    </Card>
  );
}