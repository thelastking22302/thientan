import { Typography } from "@material-tailwind/react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import ArticleCard from "./ArticleCard";

const ARTICLES = [
  {
    img: "https://images.unsplash.com/photo-1537724326059-2ea20251b9c8?q=80&w=1776&auto=format&fit=crop",
    title: "Thiên Tân Group",
    desc: "Khám phá Thiên Tân Group - Tập đoàn kinh tế đa ngành, dẫn đầu trong năng lượng tái tạo, thủy điện, bất động sản và quy hoạch đô thị tại Việt Nam.",
    link: "https://thientangroup.vn/",
  },
  {
    img: "https://images.unsplash.com/photo-1537724326059-2ea20251b9c8?q=70&w=1773&auto=format&fit=crop",
    title: "Thiên Tân Solar",
    desc: "Thiên Tân Solar - Tiên phong trong lĩnh vực điện mặt trời, mang đến giải pháp năng lượng xanh bền vững cho Việt Nam.",
    link: "https://thientansolar.vn/",
  },
  {
    img: "https://images.unsplash.com/photo-1537724326059-2ea20251b9c8?q=60&w=2070&auto=format&fit=crop",
    title: "Thiên Tân Land",
    desc: "Thiên Tân Land - Đầu tư bất động sản với các dự án chung cư, biệt thự đẳng cấp, để lại dấu ấn vượt thời gian.",
    link: "https://thientanland.vn/",
  },
];

export function Articles() {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false, // để cho phép reset khi scroll lại
  });

  return (
    <section ref={ref} className="container mx-auto px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" color="blue-gray">
          Bài viết khác
        </Typography>
        <Typography
          variant="lead"
          className="my-2 w-full font-normal !text-gray-500 lg:w-5/12"
        >
          Khám phá thêm những doanh nghiệp của chúng tôi
        </Typography>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ARTICLES.map((props, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: idx * 0.2, duration: 0.5, ease: "easeOut" }}
          >
            <ArticleCard {...props} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Articles;
