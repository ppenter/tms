"use client"

import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
]

export interface SearchBarProps {
    value?: string
    search: string
    onChange: (value: string) => void
    results?: any[]
    setSearch: React.Dispatch<React.SetStateAction<string>>
}

export const SearchBar = (props:SearchBarProps) => {
  const [open, setOpen] = React.useState(false)
  

  const { value, onChange, results, search, setSearch } = props

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? results?.find((framework: any) => framework.name.toLowerCase() === value)?.name
            : ""}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput value={search} placeholder="Search..." className="h-9" onValueChange={e => {
            setSearch(e)
          }} />
          <CommandEmpty>Select</CommandEmpty>
          <CommandGroup>
            {results?.map((result: any) => (
              <CommandItem
                key={result.name}
                value={result.name}
                onSelect={(value: any) => {
                  onChange(value)
                  setOpen(false)
                }}
              >
                {result.name}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    value?.toLowerCase() == result.name.toLowerCase() ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
