import { useState, useRef, useEffect } from "react";

export default function FilterBar({ setFilters, posts, factories, selectedFactoryId, onFactoryChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 }, (_, i) => String(2016 + i)).reverse();
  const media = ["Tất cả", "Chỉ ảnh", "Chỉ video"];
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMedia, setSelectedMedia] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [openId, setOpenId] = useState(null);
  const dropdownRefs = useRef({});
  const containerRef = useRef(null);

  // Lấy danh sách types và statuses từ posts
  useEffect(() => {
    if (posts.length > 0) {
      const uniqueTypes = [...new Set(posts.map((p) => p.title).filter(Boolean))];
      const typeOptions = ["Tất cả", ...uniqueTypes];
      const uniqueStatuses = [...new Set(posts.map((p) => p.status).filter(Boolean))];
      const statusOptions = ["Tất cả", ...uniqueStatuses];
      setTypes(uniqueTypes);
      setStatuses(statusOptions);
    }
  }, [posts]);

  // Cập nhật bộ lọc
  useEffect(() => {
    setFilters({
      year: selectedYear,
      type: selectedType === "Tất cả" ? "" : selectedType,
      media: selectedMedia,
      status: selectedStatus,
    });
  }, [selectedYear, selectedType, selectedMedia, selectedStatus, setFilters, selectedFactoryId]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      const refs = Object.values(dropdownRefs.current);
      if (refs.every((ref) => ref && !ref.contains(e.target))) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const FilterDropdown = ({ id, label, options, selected, setSelected }) => {
    const isOpen = openId === id;
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const [position, setPosition] = useState("bottom");

    useEffect(() => {
      if (isOpen && buttonRef.current && dropdownRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = Math.min(options.length * 40, 240);
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;

        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setPosition("top");
        } else {
          setPosition("bottom");
        }
      }
    }, [isOpen, options.length, options]);

    return (
      <div
        ref={(el) => (dropdownRefs.current[id] = el)}
        className="relative inline-flex items-center gap-2"
      >
        <span className="text-xs text-gray-700 font-semibold uppercase whitespace-nowrap">
          {label}
        </span>
        <button
          ref={buttonRef}
          onClick={() => setOpenId((prev) => (prev === id ? null : id))}
          className={`border ${
            isOpen ? "bg-blue-100" : "border-blue-400"
          } text-blue-700 font-semibold rounded px-4 py-1 shadow text-sm min-w-[120px] hover:bg-blue-50`}
        >
          <div className="truncate">{selected?.name_factory || label}</div>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={`absolute z-[999] w-48 max-h-60 overflow-y-auto bg-white shadow-lg ring-1 ring-black ring-opacity-5 rounded scrollbar-thin hover:scrollbar-thumb-gray-400 scrollbar-thumb-blue-400 scrollbar-track-transparent
              ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
          >
            {options.map((option) => (
              <button
                key={option.factory_id || option.name_local || option}
                onClick={() => {
                  setSelected(option.factory_id || option);
                  setOpenId(null);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-blue-100 text-gray-800"
              >
                {option.name_factory || option.name_local || option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative z-[60] flex flex-wrap justify-center gap-4 p-4 bg-white border border-gray-300 shadow rounded-lg max-w-5xl w-full overflow-visible"
    >
      <FilterDropdown
        id="year"
        label="Thời gian"
        options={years}
        selected={selectedYear}
        setSelected={setSelectedYear}
      />
      <FilterDropdown
        id="type"
        label="Loại"
        options={["Tất cả", ...types]}
        selected={selectedType}
        setSelected={setSelectedType}
      />
      <FilterDropdown
        id="factory"
        label="Nhà máy"
        options={[{ factory_id: "", name_factory: "Tất cả nhà máy" }, ...(factories || [])]}
        selected={factories?.find(f => f.factory_id === selectedFactoryId) || { factory_id: "", name_factory: "" }}
        setSelected={onFactoryChange}
      />
      <FilterDropdown
        id="media"
        label="Định Dạng"
        options={media}
        selected={selectedMedia}
        setSelected={setSelectedMedia}
      />
      <FilterDropdown
        id="status"
        label="Tình trạng"
        options={statuses}
        selected={selectedStatus}
        setSelected={setSelectedStatus}
      />
    </div>
  );
}