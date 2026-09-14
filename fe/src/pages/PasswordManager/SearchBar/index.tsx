type SearchBarProps = {
  query: string
  onQueryChange: (value: string) => void
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <input
      type="search"
      placeholder="Search secrets"
      className="h-9 w-full shrink-0 rounded-md border border-input bg-background px-3 text-sm"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
    />
  )
}
