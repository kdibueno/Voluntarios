// components/DraggableCameras.js
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function DraggableCameras({
  items,
  getId,
  storageKey,
  renderItem,
  className,
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const [ordered, setOrdered] = useState(items.map(getId));

  // carrega ordem salva no localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // mantém apenas ids ainda existentes
      const valid = parsed.filter((id) => items.some((it) => getId(it) === id));
      const missing = items
        .map(getId)
        .filter((id) => !valid.includes(id));
      setOrdered([...valid, ...missing]);
    } else {
      setOrdered(items.map(getId));
    }
  }, [items, getId, storageKey]);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrdered((old) => {
      const oldIndex = old.indexOf(active.id);
      const newIndex = old.indexOf(over.id);
      const newOrder = arrayMove(old, oldIndex, newIndex);
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
      return newOrder;
    });
  }

  const orderedItems = ordered
    .map((id) => items.find((it) => getId(it) === id))
    .filter(Boolean);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ordered} strategy={horizontalListSortingStrategy}>
        <div className={className}>
          {orderedItems.map((item) => (
            <SortableItem key={getId(item)} id={getId(item)}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
