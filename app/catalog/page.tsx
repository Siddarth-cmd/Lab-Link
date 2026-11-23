import { connection } from "next/server";
import { Catalog } from "@/components/Catalog";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { getEquipmentCatalog } from "@/lib/equipment-service";
export const instant = false;

export default async function CatalogPage() {
  await connection();
  const result = await getEquipmentCatalog();
  return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="SHARED RESOURCES" title="Equipment catalog" description="Find and reserve the tools your research needs."/><Catalog {...result}/></main></Shell>;
}
