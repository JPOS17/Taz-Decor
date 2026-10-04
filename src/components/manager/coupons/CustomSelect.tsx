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
  // Lets a <label htmlFor> point at the trigger button
  id?: string;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  className = "",
  disabled = false,
  id,
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

  // Escape closes the dropdown without selecting anything
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      className={`custom-select-container ${className} ${disabled ? "custom-select-disabled" : ""}`}
    >
      {/* Trigger button */}
      <button
        type="button"
        id={id}
        className={`custom-select-trigger ${isOpen ? "custom-select-open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={selectedOption ? "" : "custom-select-placeholder"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`custom-select-arrow ${isOpen ? "custom-select-arrow-up" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="custom-select-dropdown">
          {/* Search input */}
          {searchable && options.length > 5 && (
            <div className="custom-select-search">
              <Search
                size={16}
                className="custom-select-search-icon"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="custom-select-search-input"
                aria-label="Search options"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="custom-select-options" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-no-results">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={`custom-select-option ${
                    option.value === value
                      ? "custom-select-option-selected"
                      : ""
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
