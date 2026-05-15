const Logo = ({ size = "md" }) => {
  const sizes = {
    sm: { box: "w-7 h-7 text-sm", text: "text-base" },
    md: { box: "w-9 h-9 text-base", text: "text-lg" },
    lg: { box: "w-11 h-11 text-lg", text: "text-xl" },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${s.box} rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold shadow-sm`}
      >
        N
      </div>
      <span
        className={`${s.text} font-semibold text-stone-800 dark:text-stone-100 tracking-tight`}
        style={{ fontFamily: "Georgia, serif" }}
      >
        NoWrite
      </span>
    </div>
  );
};

export default Logo;
