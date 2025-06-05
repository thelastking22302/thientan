import React, { useEffect, useRef } from "react";
import { Typography } from "@material-tailwind/react";
import { motion, useInView, useAnimation } from "framer-motion";

// Variants
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const textWrapperVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.6,
    },
  },
};

const lineVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.9 }); // 90% vào viewport
  const controls = useAnimation();
  const imageControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
      imageControls.start({ opacity: 1, x: 0 });
    } else {
      controls.start("hidden");
      imageControls.start({ opacity: 0, x: 50 });
    }
  }, [isInView, controls, imageControls]);

  return (
    <section className="bg-white py-12 w-full" ref={ref}>
      <div className="max-w-[1200px] mx-auto px-4 w-full">
        <motion.div
          className="bg-black rounded-2xl p-8 md:p-12 text-white"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* LEFT: TEXT */}
            <motion.div
              className="w-full md:w-1/2 text-center md:text-left"
              variants={textWrapperVariants}
              initial="hidden"
              animate={controls}
            >
              <motion.div variants={lineVariants}>
                <Typography variant="small" className="uppercase font-semibold">
                  GIỚI THIỆU
                </Typography>
              </motion.div>

              <motion.div variants={lineVariants}>
                <Typography variant="h2" className="mt-2 font-bold">
                  Thiên Tân Green
                </Typography>
              </motion.div>

              <motion.div variants={lineVariants}>
                <Typography variant="h4" className="mt-4 font-semibold">
                  NIỀM TIN KHÔNG DỪNG LẠI
                </Typography>
              </motion.div>

              <motion.ul
                className="mt-4 space-y-2 list-disc pl-5"
                variants={textWrapperVariants}
              >
                <motion.li variants={lineVariants}>
                  Thiên Tân Green - Nơi trải nghiệm vẻ đẹp xanh
                </motion.li>
                <motion.li variants={lineVariants}>
                  Ông Huỳnh Kim Lập - Anh Hùng Lao Động Thời Kỳ Đổi Mới
                  <br />
                  Chủ Tịch Hội Đồng Quản Trị Thiên Tân Group
                </motion.li>
              </motion.ul>
            </motion.div>

            {/* RIGHT: IMAGE */}
            <motion.div
              className="w-full md:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              animate={imageControls}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="rounded-2xl shadow-md overflow-hidden w-full min-h-[300px] md:min-h-[400px]">
                <img
                  src="https://demo1.thientangroup.vn/User_folder_upload/admin/images/about-one-img-2.jpg"
                  alt="Agriculture Leader"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Failed to load image");
                    e.target.src = "https://via.placeholder.com/600x400?text=Image+Error";
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


//https://demo1.thientangroup.vn/User_folder_upload/admin/images/about-one-img-2.jpg