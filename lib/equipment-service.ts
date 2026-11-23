import "server-only";
import { equipment as demoEquipment, type Equipment } from "@/lib/data";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type EquipmentRow = {
  id: string; slug: string; name: string; category: string; lab_name: string; building: string; floor: string;
  description: string; image_url: string | null; specifications: Record<string, string>;
  status: "available" | "in_use" | "maintenance"; utilization_percent: number; rating: number;
  next_available_at: string | null; is_demo_seed: boolean;
  department?: { name?: string } | { name?: string }[] | null;
};

export type CatalogResult = { items: Equipment[]; source: "supabase" | "demo" | "error"; message?: string };
const connectionError = "Could not connect to Supabase. Confirm the project URL and publishable key in .env.local, then retry.";
const schemaError = "Supabase could not load equipment. Apply the migrations and confirm the equipment read policy is enabled.";

function mapEquipment(row: EquipmentRow): Equipment {
  const nextAvailable = row.next_available_at
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(row.next_available_at)) + " UTC"
    : "Check availability";
  const department = Array.isArray(row.department) ? row.department[0] : row.department;
  return {
    id: row.slug, dbId: row.id, slug: row.slug, name: row.name, category: row.category,
    lab: row.lab_name, building: row.building, floor: row.floor,
    status: row.status === "in_use" ? "In use" : row.status === "maintenance" ? "Maintenance" : "Available",
    utilization: Number(row.utilization_percent), image: row.image_url || "/lab-equipment.svg", color: "#e9f2ed",
    description: row.description,
    specs: Object.entries(row.specifications ?? {}).map(([label, value]) => ({ label, value })),
    nextAvailable, rating: Number(row.rating).toFixed(1), departmentName: department?.name ?? "Shared Research Facilities",
    isDemo: row.is_demo_seed,
  };
}

export async function getEquipmentCatalog(): Promise<CatalogResult> {
  if (!isSupabaseConfigured()) return { items: demoEquipment.map((item) => ({ ...item, slug: item.id, isDemo: true })), source: "demo", message: "Supabase is not configured. Showing clearly labeled demo equipment." };
  try {
    const supabase = await createSupabasePublicServerClient();
    if (!supabase) return { items: [], source: "error", message: connectionError };
    const { data, error } = await supabase.from("equipment")
      .select("id, slug, name, category, lab_name, building, floor, description, image_url, specifications, status, utilization_percent, rating, next_available_at, is_demo_seed, department:departments(name)")
      .eq("is_active", true).order("name");
    if (error) {
      console.error("Supabase equipment query failed", { code: error.code });
      return { items: [], source: "error", message: error.code === "PGRST205" ? schemaError : "Supabase could not load equipment. Check the table grants and Row Level Security read policy." };
    }
    return { items: (data as unknown as EquipmentRow[]).map(mapEquipment), source: "supabase" };
  } catch {
    console.error("Supabase equipment query failed", { code: "NETWORK" });
    return { items: [], source: "error", message: connectionError };
  }
}

export async function getEquipmentBySlug(slug: string): Promise<{ item: Equipment | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    const item = demoEquipment.find((equipment) => equipment.id === slug);
    return { item: item ? { ...item, slug: item.id, isDemo: true } : null };
  }
  try {
    const supabase = await createSupabasePublicServerClient();
    if (!supabase) return { item: null, error: connectionError };
    const { data, error } = await supabase.from("equipment")
      .select("id, slug, name, category, lab_name, building, floor, description, image_url, specifications, status, utilization_percent, rating, next_available_at, is_demo_seed, department:departments(name)")
      .eq("slug", slug).eq("is_active", true).maybeSingle();
    if (error) {
      console.error("Supabase equipment detail query failed", { code: error.code });
      return { item: null, error: error.code === "PGRST205" ? schemaError : "Supabase could not load this equipment. Check the table grants and Row Level Security read policy." };
    }
    return { item: data ? mapEquipment(data as unknown as EquipmentRow) : null };
  } catch {
    console.error("Supabase equipment detail query failed", { code: "NETWORK" });
    return { item: null, error: connectionError };
  }
}
