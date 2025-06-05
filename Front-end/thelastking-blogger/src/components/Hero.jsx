
import ImageSlider from "./SlideShow";

function Hero() {
    return (
        <section className="hidden sm:block relative w-full h-screen">
            <ImageSlider />
        </section>
    );
}
export default Hero;
// const [email, setEmail] = useState('');
// const [error, setError] = useState('');

// const handleEmailChange = (e) => {
//     setEmail(e.target.value);
//     setError('');
// };
//  const handleSubmit = () => {
//     if (!IsValidEmail(email)) {
//         setError('Không phải email hợp lệ');
//     } else {
//         alert('Đã gửi email: ' + email);
//     }
// };
{/* <div className="w-full container mx-auto pt-12 pb-24 text-center">
    <Typography
    color="blue-gray"
    className="mx-auto w-full text-[30px] lg:text-[48px] font-bold leading-[45px] lg:leading-[60px] lg:max-w-2xl"
    >
    Thelastking:Những dự án tốt nhất của tôi
    </Typography>
    <Typography
    variant="lead"
    className="mx-auto mt-8 mb-4 w-full px-8 !text-gray-700 lg:w-10/12 lg:px-12 xl:w-8/12 xl:px-20"
    >
    Mở rộng kiến thức phát triển web của bạn với lộ trình hướng dẫn học tập và dự án của tôi.
    </Typography>
    <div className="grid place-items-start justify-center gap-2">
        <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
        <div className="w-80">
                <Input
                    label="name@gmail.com"
                    value={email}
                    onChange={handleEmailChange}
                    error={!!error}
                    helperText={error}
                />
            </div>
            <Button
                size="md"
                className="relative lg:w-max shrink-0 transition-all duration-300 border-2 border-transparent text-white bg-black hover:bg-white hover:text-black hover:border-red-500"
                onClick={handleSubmit}
                fullWidth
            >
                get started
            </Button>
        </div>
        <div className="flex items-center gap-1">
            <Typography variant="small" className="font-normal text-gray-700">
                Xem{" "}
                <a
                    href="#"
                    className="hover:text-red-900 transition-colors underline"
                >
                    Điều khoản và điều lệ
                </a>
                {" "}của tôi.
            </Typography>
        </div>
    </div>
</div> */}