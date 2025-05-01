import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../styles/SortableSongItem.css";

/**
 * SortableSongItem
 *
 * Draggable list item representing a song in the playlist.
 */
function SortableSongItem({ song }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: song.track_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-song"
      {...attributes}
      {...listeners}
    >
      {song.song_title} — {song.song_artist}
    </div>
  );
}

export default SortableSongItem;
