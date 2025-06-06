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
  const imageUrl = img
    ? (img.startsWith('http') ? img : `http://localhost:8000/${img.replace(/^\/+/, '')}`)
    : "placeholder-image-url";
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
        <div className="w-full aspect-square md:aspect-[4/3] overflow-hidden bg-gray-100 flex items-center justify-center">
          {img ? (
            <img
              src={imageUrl}
              alt={safeTitle}
              className="w-full h-full object-cover rounded-t-lg"
              style={{
                objectFit: 'cover',
                imageRendering: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
              }}
            />
          ) : (
            <span className="text-gray-400 text-sm">Không có ảnh</span>
          )}
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
          className="mb-1 text-base font-semibold text-gray-600 hover:text-blue-600 transition-colors break-words md:truncate"
        >
          Năm: {safeYear}
        </Typography>
        <Typography
          variant="small"
          className="mb-1 text-base font-semibold text-gray-600 hover:text-blue-600 transition-colors break-words md:truncate"
        >
          Nhà máy: {safeFactory}
        </Typography>
      </CardBody>
    </Card>
  );
}