import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  className = "",
  disabled = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Closes the dropdown and clears search when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  // Resolves the display label for the currently selected value
  const selectedOption = options.find((opt) => opt.value === value);

  // Filters options against the search term; bypassed entirely when searchable=false
  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Selects an option, fires the onChange callback, and closes the dropdown
  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={dropdownRef}
      className={`custom-select-container ${className} ${disabled ? "custom-select-disabled" : ""}`}
    >
      {/* Trigger button */}
      <div
        className={`custom-select-trigger ${isOpen ? "custom-select-open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "" : "custom-select-placeholder"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`custom-select-arrow ${isOpen ? "custom-select-arrow-up" : ""}`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="custom-select-dropdown">
          {/* Search input */}
          {searchable && options.length > 5 && (
            <div className="custom-select-search">
              <Search size={16} className="custom-select-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="custom-select-search-input"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="custom-select-options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-no-results">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`custom-select-option ${
                    option.value === value
                      ? "custom-select-option-selected"
                      : ""
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
