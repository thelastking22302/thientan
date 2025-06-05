
import { Typography, Card, CardBody, Button } from "@material-tailwind/react";

export function ArticleCard({ img, title, desc, link }) {
  return (
    <Card
      className="relative grid min-h-[30rem] items-end overflow-hidden rounded-xl group hover:cursor-pointer"
      color="transparent"
    >
      <img
        src={img}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform object-center"
        onError={(e) => {
          console.error(`Failed to load image: ${img}`);
          e.target.src = "https://via.placeholder.com/400x300?text=Image+Error";
        }}
      />
      <div className="absolute inset-0 bg-black/60" />
      <CardBody className="relative flex flex-col justify-end">
        <Typography variant="h4" color="white">
          {title}
        </Typography>
        <Typography
          variant="paragraph"
          color="white"
          className="my-2 font-normal"
        >
          {desc}
        </Typography>
        <Button
          variant="text"
          color="white"
          className="underline"
          onClick={() => window.open(link, "_blank")}
        >
          Xem thêm
        </Button>
      </CardBody>
    </Card>
  );
}

export default ArticleCard;