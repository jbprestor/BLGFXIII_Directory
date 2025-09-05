export default function NavItem({ item, currentPage, isScrolled, onClick }) {
  <li>
    <button
      onClick={() => onClick(item.name, item.page)}
      className={`btn btn-ghost rounded-btn transition-all duration-300 ${
        currentPage === item.page
          ? isScrolled
            ? "btn-primary shadow-md"
            : "bg-white/20 text-white shadow-md"
          : isScrolled
          ? "hover:btn-primary hover:shadow-md"
          : "text-white hover:bg-white/10 hover:shadow-md"
      }`}
      aria-current={currentPage === item.page ? "page" : undefined}
    >
      <span className="text-sm">{item.icon}</span>
      <span className="hidden lg:inline">{item.name}</span>
    </button>
  </li>;
}
