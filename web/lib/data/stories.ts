import type { Story, StoryFraming } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type DbRow = {
  id: string;
  user_id: string;
  title: string;
  raw_experience: string;
  framings: StoryFraming[] | null;
  created_at: string;
};

function mapRow(r: DbRow): Story {
  return {
    id: r.id,
    title: r.title,
    rawExperience: r.raw_experience,
    framings: r.framings ?? [],
  };
}

export async function getStories(userId: string): Promise<Story[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("stories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(mapRow);
}

export async function saveStory(
  userId: string,
  input: { title: string; rawExperience: string; framings: StoryFraming[] },
): Promise<Story> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("stories")
    .insert({
      user_id: userId,
      title: input.title,
      raw_experience: input.rawExperience,
      framings: input.framings,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function updateStoryFramings(
  userId: string,
  id: string,
  framings: StoryFraming[],
): Promise<void> {
  const sb = await createClient();
  const { error } = await sb
    .from("stories")
    .update({ framings })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteStory(userId: string, id: string): Promise<void> {
  const sb = await createClient();
  const { error } = await sb.from("stories").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
