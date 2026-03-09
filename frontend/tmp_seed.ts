import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Starting database reset...");

  try {
    console.log("Deleting old data...");
    const tables = [
      "box_location_history",
      "po_transfer_history",
      "borrow_logs",
      "pos",
      "boxes",
      "bins",
      "levels",
      "rows",
      "racks",
    ];

    for (const table of tables) {
      console.log(`Deleting from ${table}...`);
      const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
         console.warn(`Warning deleting from ${table}:`, error.message);
      }
    }

    const rackCodes = ["A", "B", "C", "D"];
    const rowsPerRack = 6;
    const levelsPerRow = 5;
    const binsPerLevel = 9;

    console.log("Seeding new storage structure...");

    for (const rCode of rackCodes) {
      const { data: rack, error: rackErr } = await supabase
        .from("racks")
        .insert({ code: rCode, name: `Rak ${rCode}`, is_active: true })
        .select()
        .single();
      if (rackErr) throw rackErr;

      console.log(`Created Rack ${rCode}`);

      for (let ro = 1; ro <= rowsPerRack; ro++) {
        const roCode = `${rCode}-${String(ro).padStart(2, "0")}`; // e.g., A-01
        const { data: row, error: rowErr } = await supabase
          .from("rows")
          .insert({ rack_id: rack.id, code: roCode })
          .select()
          .single();
        if (rowErr) throw rowErr;

        for (let lvl = 1; lvl <= levelsPerRow; lvl++) {
          const lvlLetter = String.fromCharCode(64 + lvl); // A, B, C, D, E
          const lvlCode = `${roCode}-${lvlLetter}`; // A-01-A
          const { data: level, error: lvlErr } = await supabase
            .from("levels")
            .insert({ row_id: row.id, code: lvlCode })
            .select()
            .single();
          if (lvlErr) throw lvlErr;

          const binsToInsert = [];
          for (let b = 1; b <= binsPerLevel; b++) {
            const binStr = String(b).padStart(2, "0");
            const binCode = `${lvlCode}-${binStr}`; // A-01-A-01
            binsToInsert.push({
              level_id: level.id,
              code: binStr,
              bin_code: binCode,
              max_boxes: 1,
              is_active: true,
            });
          }
          const { error: binErr } = await supabase.from("bins").insert(binsToInsert);
          if (binErr) throw binErr;
        }
      }
    }

    console.log("✅ Seed completed successfully!");
  } catch (err) {
    console.error("Error during seed:", err);
  }
}

run();
