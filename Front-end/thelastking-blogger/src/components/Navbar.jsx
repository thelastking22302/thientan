import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Navbar as MTNavbar,
    Collapse,
    Button,
    Typography,
} from "@material-tailwind/react";
import {
    XMarkIcon,
    Bars3Icon,
} from "@heroicons/react/24/solid";

const NAV_MENU = [
    { name: "Trang chủ", refKey: "Home" },
    { name: "Về chúng tôi", refKey: "About" },
    { name: "Bộ sưu tập", refKey: "album" },
    { name: "Bài viết khác", refKey: "Articles" },
    { name: "Liên hệ", refKey: "contact" }
];

function NavItem({ children, scrolled, refKey, refs, onClick }) {
    const handleClick = (e) => {
        e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
        if (refs[refKey] && refs[refKey].current) {
            refs[refKey].current.scrollIntoView({ behavior: 'smooth' });
        }
        if (onClick) onClick(); // Gọi onClick để đóng menu trên mobile
    };

    return (
        <li className="relative group px-2 py-1">
            <a
                href="#"
                onClick={handleClick}
                className={`relative z-10 px-4 py-2 font-medium transition-colors duration-300 ${
                    scrolled ? "text-black" : "text-white"
                }`}
            >
                {children}
                <span
                    className="absolute left-0 bottom-0 h-[3px] w-0 rounded-full bg-current transition-all duration-700 ease-in-out group-hover:w-full"
                ></span>
            </a>
        </li>
    );
}

export function Navbar({ refs }) {
    const [open, setOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const navigate = useNavigate();

    const handleOpen = () => setOpen((cur) => !cur);

    // Đóng menu khi nhấp vào một mục trên mobile
    const handleMenuItemClick = () => {
        if (window.innerWidth < 960) {
            setOpen(false);
        }
    };

    React.useEffect(() => {
        const handleScroll = () => {
            const hero = document.querySelector("section");
            if (hero) {
                const triggerHeight = hero.offsetHeight * 0.7; 
                setScrolled(window.scrollY >= triggerHeight);
            }
        };

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", () => {
            if (window.innerWidth >= 960) setOpen(false);
        });

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <MTNavbar
            shadow={false}
            fullWidth
            className={`fixed top-0 z-[9999] border-none transition-colors duration-300 ${
                scrolled ? "bg-white text-black border-b border-gray-500 shadow-md" : "bg-transparent text-white"
            }`}
            style={{
                backgroundColor: scrolled ? "rgba(255, 255, 255, 1)" : "transparent",
                backdropFilter: scrolled ? "none" : "none", 
            }}
        >
            <div className="container mx-auto flex items-center justify-between">
                <Typography
                    as="a"
                    href="#"
                    className={`text-lg font-bold transition-colors duration-300 ${
                        scrolled ? "text-black" : "text-white"
                    }`}
                    onClick={(e) => {
                        e.preventDefault();
                        if (refs.home && refs.home.current) {
                            refs.home.current.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                >
                    ThienTanBlog
                </Typography>
                <ul className="ml-10 hidden items-center gap-8 lg:flex">
                    {NAV_MENU.map(({ name, refKey }) => (
                        <NavItem
                            key={name}
                            scrolled={scrolled}
                            refKey={refKey}
                            refs={refs}
                        >
                            {name}
                        </NavItem>
                    ))}
                </ul>
                <div className="hidden items-center gap-2 lg:flex">
                    <Button
                        variant="text"
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-300
                            ${scrolled ? "text-black hover:bg-black hover:text-white" : "text-white hover:bg-white hover:text-black"}
                        `}
                        onClick={() => navigate("/login")}
                    >
                        Sign In
                    </Button>
                </div>
                <button
                    onClick={handleOpen}
                    className="ml-auto inline-block lg:hidden flex-shrink-0 max-w-full p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                    {open ? (
                        <XMarkIcon strokeWidth={2} className="h-6 w-6" />
                    ) : (
                        <Bars3Icon strokeWidth={2} className="h-6 w-6" />
                    )}
                </button>
            </div>
            <Collapse open={open}>
                <div className="container mx-auto mt-3 border-t border-gray-200 px-2 pt-4">
                    <ul className="flex flex-col gap-4">
                        {NAV_MENU.map(({ name, refKey }) => (
                            <NavItem
                                key={name}
                                scrolled={scrolled}
                                refKey={refKey}
                                refs={refs}
                                onClick={handleMenuItemClick}
                            >
                                {name}
                            </NavItem>
                        ))}
                    </ul>
                    <div className="mt-6 mb-4 flex items-center gap-2">
                        <Button
                            variant="text"
                            className={`transition-colors duration-300 ${
                                scrolled ? "text-black" : "text-white"
                            }`}
                            onClick={() => navigate("/login")}
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </Collapse>
        </MTNavbar>
    );
}

export default Navbar;