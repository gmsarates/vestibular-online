import { useState, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseOption {
  id: string;
  name: string;
}

interface MultipleCoursesSelectProps {
  courses: CourseOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultipleCoursesSelect({
  courses,
  value,
  onChange,
  placeholder = "Selecione os cursos...",
  disabled = false,
}: MultipleCoursesSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      courses.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [courses, search]
  );

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  const selectedCourses = courses.filter((c) => value.includes(c.id));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "border-ring"
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selectedCourses.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedCourses.map((course) => (
                <span
                  key={course.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {course.name}
                  <span
                    onClick={(e) => remove(course.id, e)}
                    className="rounded-full p-0.5 hover:bg-primary/20 transition-colors cursor-pointer"
                    role="button"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))
            )}
          </div>
          <ChevronsUpDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-input bg-popover p-0 shadow-md outline-none animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2 border-b border-input px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Buscar curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum curso encontrado.
              </p>
            ) : (
              filtered.map((course) => {
                const checked = value.includes(course.id);
                return (
                  <div
                    key={course.id}
                    onClick={() => toggle(course.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      checked && "bg-accent/50"
                    )}
                  >
                    <Checkbox.Root
                      checked={checked}
                      onCheckedChange={() => toggle(course.id)}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "h-4 w-4 shrink-0 rounded border border-input transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background"
                      )}
                    >
                      <Checkbox.Indicator className="flex items-center justify-center">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span className="flex-1">{course.name}</span>
                  </div>
                );
              })
            )}
          </div>

          {value.length > 0 && (
            <div className="border-t border-input px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {value.length} selecionado{value.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Limpar
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}