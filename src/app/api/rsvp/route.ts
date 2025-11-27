import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

interface RSVPData {
  name: string;
  attending: boolean;
  guest_count: number;
  message?: string;
}

// Fallback to local JSON storage if Supabase is not configured
const LOCAL_STORAGE_PATH = path.join(process.cwd(), "data", "rsvps.json");

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readLocalRSVPs(): RSVPData[] {
  ensureDataDirectory();
  if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
    return [];
  }
  const data = fs.readFileSync(LOCAL_STORAGE_PATH, "utf-8");
  return JSON.parse(data);
}

function writeLocalRSVPs(rsvps: RSVPData[]) {
  ensureDataDirectory();
  fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(rsvps, null, 2));
}

export async function POST(request: Request) {
  try {
    const body: RSVPData = await request.json();

    // Validate required fields
    if (!body.name || body.attending === undefined) {
      return NextResponse.json(
        { error: "Name and attendance status are required" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && supabase) {
      // Use Supabase
      const { data, error } = await supabase.from("rsvps").insert([
        {
          name: body.name,
          attending: body.attending,
          guest_count: body.guest_count || 1,
          message: body.message || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      return NextResponse.json(
        { message: "RSVP submitted successfully", data },
        { status: 201 }
      );
    } else {
      // Fallback to local JSON storage
      const rsvps = readLocalRSVPs();
      const newRSVP = {
        ...body,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      rsvps.push(newRSVP);
      writeLocalRSVPs(rsvps);

      return NextResponse.json(
        { message: "RSVP submitted successfully (local storage)", data: newRSVP },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("RSVP submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && supabase) {
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return NextResponse.json({ rsvps: data }, { status: 200 });
    } else {
      const rsvps = readLocalRSVPs();
      return NextResponse.json({ rsvps }, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}
