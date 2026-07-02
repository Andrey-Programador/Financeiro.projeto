import { promises as fs } from "fs";
import path from "path";
import { FinanceData } from "@/types/finance";

const dataPath = path.join(process.cwd(), "data", "financeiro.json");

export async function readFinanceData(): Promise<FinanceData> {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw) as FinanceData;
}

export async function writeFinanceData(data: FinanceData): Promise<void> {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");
}
